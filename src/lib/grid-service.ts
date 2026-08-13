// ============================================================
// SERVICE LAYER — NHIỆM VỤ 1: CSDL ĐƯỜNG DÂY ĐẤU NỐI & TRẠM BIẾN ÁP
// Hiện chạy MOCK adapter (dữ liệu demo trong src/data/grid-mock.ts).
// Khi backend sẵn sàng: đổi GRID_DATA_SOURCE sang "api" và implement
// các hàm fetch tương ứng endpoint gợi ý bên dưới.
//
// ENDPOINT GỢI Ý (REST):
//   GET /grid/task1/overview
//   GET /grid/substations | /grid/substations/:id
//   GET /grid/power-lines | /grid/power-lines/:id
//   GET /grid/power-poles?line=:lineCode
//   GET /grid/planning-assets
//   GET /grid/supply-areas | /grid/load-areas
//   GET /grid/load-history?entity=:id&type=substation|line
//   GET /grid/forecast/:id?horizon=7d|1m|quarter|1y
//   GET /grid/ai-forecast/:id?horizon=7d|1m|quarter|1y  (AI hỗ trợ dự báo)
//   GET /grid/warnings
//   GET /grid/absorption?substation=:id     (khả năng tiếp nhận NLTT)
//   GET /grid/curtailment?line=:id          (khả năng giải tỏa công suất)
//   POST /grid/nearest-substation           (tra cứu trạm cho phụ tải mới)
//   GET /grid/area-forecast?area=:id        (dự báo phụ tải theo khu vực)
//   GET /grid/report/energy?year=:year      (báo cáo theo TT 34/2019/TT-BCT)
// ============================================================
import type {
  AbsorptionAssessment,
  AreaForecastResult,
  AiForecastResult,
  EnergyReport,
  ForecastHorizon,
  ForecastResult,
  GridEntityType,
  GridLoadRecord,
  GridWarning,
  LineCurtailment,
  NearestSubstationResult,
  Task1GridData,
} from "@/lib/grid-types";
import {
  GRID_LOAD_HISTORY,
  GRID_LOAD_AREAS,
  GRID_POWER_LINES,
  GRID_RENEWABLES,
  GRID_SUBSTATIONS,
  GRID_WARNINGS,
  buildTask1GridData,
  getForecastMock,
} from "@/data/grid-mock";
import { buildAiForecast } from "@/lib/grid-forecast";
import { nearestSubstation, substationSpareCapacityMw } from "@/lib/grid-geo";
import { GRID_CONFIG } from "@/lib/grid-types";

// Bật MOCK / API. Production phải đổi sang "api" và cấu hình base URL.
export type GridDataSource = "mock" | "api";
export const GRID_DATA_SOURCE: GridDataSource = "mock";

const USE_MOCK = GRID_DATA_SOURCE === "mock";

// Giả lập độ trễ mạng để UI có Loading state đúng cách.
function delay<T>(value: T, ms = 260): Promise<T> {
  if (!USE_MOCK) return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ─────────────────────────── Bundle dữ liệu trang ───────────────────────────
export function getTask1GridData(): Promise<Task1GridData> {
  return delay(buildTask1GridData());
}

// ─────────────────────────── Lịch sử tải ───────────────────────────
export function getLoadHistory(
  entityId: string,
  entityType: GridEntityType,
): Promise<GridLoadRecord[]> {
  const rows = GRID_LOAD_HISTORY.filter(
    (r) => r.entityId === entityId && r.entityType === entityType,
  );
  return delay(rows);
}

/** Toàn bộ chuỗi tải 12 kỳ cho tất cả đối tượng (dùng cho biểu đồ tổng hợp). */
export function getLoadHistoryAll(): Promise<GridLoadRecord[]> {
  return delay(GRID_LOAD_HISTORY);
}

// ─────────────────────────── Dự báo (AI hỗ trợ, demo) ───────────────────────────
export function getForecast(
  entityId: string,
  entityType: GridEntityType,
  horizon: ForecastHorizon,
): Promise<ForecastResult> {
  return delay(getForecastMock(entityType, entityId, horizon));
}

/**
 * Dự báo AI: hồi quy + mùa vụ trên chuỗi lịch sử tải, hiệu chỉnh
 * bởi dữ liệu GIS và thống kê lưới. Xem src/lib/grid-forecast.ts.
 */
export function getAiForecast(
  entityId: string,
  entityType: GridEntityType,
  horizon: ForecastHorizon,
): Promise<AiForecastResult> {
  return delay(buildAiForecast(entityType, entityId, horizon));
}

// ─────────────────────────── Cảnh báo đối tượng cần quan tâm ───────────────────────────
export function getGridWarnings(): Promise<GridWarning[]> {
  return delay(GRID_WARNINGS);
}

// ─────────────────────────── Khả năng tiếp nhận nguồn NLTT ───────────────────────────
/**
 * Đánh giá khả năng tiếp nhận NLTT tại trạm theo công thức EVN:
 * P_tiếp nhận = P_vh cho phép + P_phụ tải (11–13h) − P_đã vận hành − P_chưa vận hành.
 */
export function getRenewableAbsorption(substationId: string): Promise<AbsorptionAssessment> {
  const s = GRID_SUBSTATIONS.find((item) => item.id === substationId);
  if (!s) {
    return delay({
      substationId,
      substationName: substationId,
      substationCode: substationId,
      voltageLevel: "",
      allowableMw: 0,
      middayLoadMw: 0,
      operatingMw: 0,
      plannedMw: 0,
      absorptionMw: 0,
      status: "full",
      recommendation: "Không tìm thấy trạm.",
      sources: [],
    });
  }
  const sources = GRID_RENEWABLES.filter((r) => r.hostSubstationId === s.id);
  const operating = sources.filter((r) => r.status === "Vận hành");
  const planned = sources.filter((r) => r.status !== "Vận hành");
  const allowableMw = s.operatingCapacity ?? s.designCapacity ?? 0;
  // Phụ tải giờ cao điểm trưa ≈ 85% tải hiện tại của trạm.
  const middayLoadMw = Math.round(((s.loadFactor ?? 0) / 100) * allowableMw * 0.85 * 10) / 10;
  const operatingMw = Math.round(operating.reduce((sum, r) => sum + r.capacityKw, 0) / 1000);
  const plannedMw = Math.round(planned.reduce((sum, r) => sum + r.capacityKw, 0) / 1000);
  const absorptionMw = Math.round((allowableMw + middayLoadMw - operatingMw - plannedMw) * 10) / 10;
  const margin = (allowableMw * GRID_CONFIG.absorption.voltageMarginPct) / 100;
  const status: AbsorptionAssessment["status"] =
    absorptionMw <= margin ? "full" : absorptionMw <= margin * 2 ? "limited" : "available";
  const recommendation =
    status === "full"
      ? "Trạm đã đạt giới hạn tiếp nhận (lề điện áp +5%). Tạm thời không tiếp nhận nguồn NLTT mới; cần nâng công suất MBA hoặc san tải."
      : status === "limited"
        ? "Khả năng tiếp nhận còn hạn chế. Chỉ xem xét các dự án nhỏ (≤ lề còn lại) và yêu cầu kiểm tra quá tải theo QĐ 2293/QĐ-UBND."
        : "Trạm còn dư địa tiếp nhận nguồn NLTT mới. Thẩm định theo quy trình đăng ký phát triển ĐMT mái nhà.";
  return delay({
    substationId: s.id,
    substationName: s.name,
    substationCode: s.code,
    voltageLevel: s.voltageLevel,
    allowableMw,
    middayLoadMw,
    operatingMw,
    plannedMw,
    absorptionMw,
    status,
    recommendation,
    sources,
  });
}

// ─────────────────────────── Khả năng giải tỏa công suất tuyến ───────────────────────────
export function getLineCurtailment(lineId: string): Promise<LineCurtailment> {
  const l = GRID_POWER_LINES.find((item) => item.id === lineId);
  if (!l) {
    return delay({
      lineId,
      lineName: lineId,
      lineCode: lineId,
      voltageLevel: "",
      capacityMw: 0,
      currentLoadMw: 0,
      renewablesConnectedMw: 0,
      headroomMw: 0,
      status: "full",
      recommendation: "Không tìm thấy tuyến.",
      sources: [],
    });
  }
  const sources = GRID_RENEWABLES.filter((r) => r.hostLineCode === l.code);
  const operating = sources.filter((r) => r.status === "Vận hành");
  const capacityMw = l.capacityMw ?? 0;
  const currentLoadMw = l.actualLoadMw ?? 0;
  const renewablesConnectedMw = Math.round(operating.reduce((s, r) => s + r.capacityKw, 0) / 1000);
  const headroomMw = Math.max(
    0,
    Math.round((capacityMw - currentLoadMw - renewablesConnectedMw) * 10) / 10,
  );
  const status: LineCurtailment["status"] =
    headroomMw <= 0 ? "full" : headroomMw <= capacityMw * 0.1 ? "limited" : "available";
  const recommendation =
    status === "full"
      ? "Tuyến không còn dư địa giải tỏa công suất NLTT (đã kín tải + nguồn). Cần nâng cấp tiết diện dây hoặc san tải."
      : status === "limited"
        ? "Dư địa giải tỏa hạn chế — chỉ tiếp nhận nguồn nhỏ và hạn chế phát ngược giờ cao điểm trưa."
        : "Tuyến còn dư địa giải tỏa công suất cho các nguồn NLTT đấu nối mới.";
  return delay({
    lineId: l.id,
    lineName: l.name,
    lineCode: l.code,
    voltageLevel: l.voltageLevel,
    capacityMw,
    currentLoadMw,
    renewablesConnectedMw,
    headroomMw,
    status,
    recommendation,
    sources,
  });
}

// ─────────────────────────── Tra cứu trạm gần nhất cho phụ tải mới ───────────────────────────
export function getNearestSubstationAnalysis(
  lat: number,
  lng: number,
  demandMw: number,
): Promise<NearestSubstationResult> {
  const nearest = nearestSubstation(lat, lng, GRID_SUBSTATIONS);
  if (!nearest) {
    return delay({
      lat,
      lng,
      demandMw,
      substation: null,
      distanceKm: null,
      spareMw: 0,
      canSupply: false,
      recommendation: "Không tìm thấy trạm vận hành gần vị trí yêu cầu.",
    });
  }
  const { substation, distanceKm } = nearest;
  const spareMw = substationSpareCapacityMw(substation);
  const canSupply = spareMw >= demandMw;
  const recommendation = canSupply
    ? "Trạm còn dư địa công suất để cấp điện cho phụ tải mới. Đề xuất khảo sát lộ xuất tuyến gần nhất trước khi cấp điện."
    : `Trạm gần nhất thiếu ${Math.round((demandMw - spareMw) * 10) / 10} MW. Đề xuất: san tải từ trạm lân cận hoặc xem xét trạm quy hoạch ${substation.district}.`;
  return delay({
    lat,
    lng,
    demandMw,
    substation: {
      id: substation.id,
      name: substation.name,
      code: substation.code,
      voltageLevel: substation.voltageLevel,
      district: substation.district,
    },
    distanceKm: Math.round(distanceKm * 10) / 10,
    spareMw,
    canSupply,
    recommendation,
  });
}

// ─────────────────────────── Dự báo phụ tải theo khu vực ───────────────────────────
export function getAreaForecast(areaId: string): Promise<AreaForecastResult> {
  const area = GRID_LOAD_AREAS.find((a) => a.id === areaId);
  if (!area) {
    return delay({
      areaId,
      areaName: areaId,
      district: "",
      peakMw: 0,
      growthPerYearPct: 6,
      unit: "MW",
      points: [],
      risk: "Thấp",
      note: "Không tìm thấy vùng phụ tải.",
    });
  }
  const growthPerYearPct = 6;
  const points: AreaForecastResult["points"] = [];
  for (let i = -11; i < 13; i++) {
    const season = Math.sin((i + 4) * 0.5) * 8;
    if (i < 0) {
      points.push({
        period: `T${i + 13}`,
        actual: Math.round(Math.max(10, area.peakMw * (1 + season / 100))),
      });
    } else {
      const month = area.peakMw * (1 + (growthPerYearPct / 100) * (i / 12)) * (1 + season / 100);
      points.push({
        period: `D${i + 1}`,
        base: Math.round(month),
        min: Math.round(month * 0.9),
        max: Math.round(month * 1.08),
      });
    }
  }
  const maxForecast = Math.max(...points.map((p) => p.max ?? p.base ?? 0));
  const risk: AreaForecastResult["risk"] =
    maxForecast >= 150 ? "Cao" : maxForecast >= 110 ? "Trung bình" : "Thấp";
  const note =
    risk === "Cao"
      ? "Phụ tải khu vực dự báo vượt 150 MW trong 12 tháng tới — cần đối chiếu khả năng cấp điện của các trạm nguồn."
      : risk === "Trung bình"
        ? "Phụ tải khu vực tăng ~6%/năm, cần theo dõi định kỳ theo quý."
        : "Nhu cầu phụ tải khu vực trong giới hạn hiện tại.";
  return delay({
    areaId: area.id,
    areaName: area.name,
    district: area.district,
    peakMw: area.peakMw,
    growthPerYearPct,
    unit: "MW",
    points,
    risk,
    note,
  });
}

// ─────────────────────────── Báo cáo Thông tư 34/2019/TT-BCT ───────────────────────────
function csvCell(value: string | number): string {
  const text = String(value).replaceAll('"', '""');
  return /[;"\n]/.test(text) ? `"${text}"` : text;
}

function sectionToCsv(section: EnergyReport["sections"][number]): string {
  const head = [section.title, "", ...section.columns].join(";");
  const rows = section.rows.map((r) => r.map(csvCell).join(";")).join("\n");
  return `${head}\n${rows}`;
}

export function buildEnergyReport(year: number): Promise<EnergyReport> {
  const operatingLines = GRID_POWER_LINES.filter((l) => l.status !== "Quy hoạch");
  const operatingSubs = GRID_SUBSTATIONS.filter((s) => s.status !== "Quy hoạch");
  const voltageLevels = ["500kV", "220kV", "110kV", "22kV"];

  const lengthByVoltage: Record<string, number> = {};
  voltageLevels.forEach((v) => {
    lengthByVoltage[v] =
      Math.round(
        operatingLines.filter((l) => l.voltageLevel === v).reduce((s, l) => s + l.lengthKm, 0) * 10,
      ) / 10;
  });

  const subsByVoltage: Record<string, { transmission: number; distribution: number }> = {};
  voltageLevels.forEach((v) => {
    const subs = operatingSubs.filter((s) => s.voltageLevel === v);
    subsByVoltage[v] = {
      transmission: subs.filter((s) => s.type.includes("truyền tải") || s.voltageLevel !== "22kV")
        .length,
      distribution: subs.filter((s) => s.voltageLevel === "22kV").length,
    };
  });

  // Mẫu 1.6a — phụ tải ngày điển hình tháng cao điểm: giờ 0..23.
  const totalPeakMw = GRID_LOAD_AREAS.reduce((s, a) => s + a.peakMw, 0);
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const curve =
      0.5 + 0.28 * Math.exp(-((h - 19) ** 2) / 10) + 0.22 * Math.exp(-((h - 11) ** 2) / 7);
    return Math.round(totalPeakMw * curve);
  });

  const sections: EnergyReport["sections"] = [
    {
      id: "1.7a",
      title: "Mẫu 1.7a — Chiều dài đường dây truyền tải và phân phối (km)",
      columns: [
        "Cấp điện áp",
        "Đường dây truyền tải (km)",
        "Đường dây phân phối (km)",
        "Tổng (km)",
      ],
      rows: voltageLevels.map((v) => [
        v,
        v === "22kV" ? 0 : (lengthByVoltage[v] ?? 0),
        v === "22kV" ? (lengthByVoltage[v] ?? 0) : 0,
        lengthByVoltage[v] ?? 0,
      ]),
    },
    {
      id: "1.7b",
      title: "Mẫu 1.7b — Chiều dài đường dây theo tỉnh (km)",
      columns: ["Tỉnh", "500kV", "220kV", "110kV", "22kV", "Tổng"],
      rows: [
        [
          "Tây Ninh",
          lengthByVoltage["500kV"] ?? 0,
          lengthByVoltage["220kV"] ?? 0,
          lengthByVoltage["110kV"] ?? 0,
          lengthByVoltage["22kV"] ?? 0,
          Math.round(operatingLines.reduce((s, l) => s + l.lengthKm, 0) * 10) / 10,
        ],
      ],
    },
    {
      id: "1.8a",
      title: "Mẫu 1.8a — Số lượng trạm biến áp truyền tải và phân phối",
      columns: ["Cấp điện áp", "Trạm truyền tải", "Trạm phân phối", "Tổng"],
      rows: voltageLevels.map((v) => [
        v,
        subsByVoltage[v]?.transmission ?? 0,
        subsByVoltage[v]?.distribution ?? 0,
        (subsByVoltage[v]?.transmission ?? 0) + (subsByVoltage[v]?.distribution ?? 0),
      ]),
    },
    {
      id: "1.8b",
      title: "Mẫu 1.8b — Số lượng trạm biến áp theo tỉnh",
      columns: ["Tỉnh", "500kV", "220kV", "110kV", "22kV", "Tổng"],
      rows: [
        [
          "Tây Ninh",
          subsByVoltage["500kV"]?.transmission ?? 0,
          subsByVoltage["220kV"]?.transmission ?? 0,
          subsByVoltage["110kV"]?.transmission ?? 0,
          subsByVoltage["22kV"]?.distribution ?? 0,
          operatingSubs.length,
        ],
      ],
    },
    {
      id: "1.6a",
      title: "Mẫu 1.6a — Phụ tải ngày điển hình tháng cao điểm (MW)",
      columns: ["Giờ", "Phụ tải (MW)"],
      rows: hourly.map((mw, h) => [`${String(h).padStart(2, "0")}:00`, mw]),
    },
  ];

  const csv = sections.map(sectionToCsv).join("\n\n");
  const generatedAt = new Date().toLocaleDateString("vi-VN");
  return delay({
    year,
    standard: "Thông tư 34/2019/TT-BCT — Hệ thống thông tin năng lượng (hạn nộp 31/3 hằng năm)",
    generatedAt,
    sections,
    csv,
  });
}
