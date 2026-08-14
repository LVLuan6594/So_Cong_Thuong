// ============================================================
// CHAT QA — Trợ lý ảo trả lời câu hỏi về dữ liệu của nền tảng.
// Mọi câu trả lời đều tính từ dữ liệu thật (mock arrays trong
// src/data) — không hardcode chuỗi. Dữ liệu "chỉ số chính thức"
// (OVERVIEW_KPI / PORTAL_MARKET_KPIS) chỉ dùng cho câu hỏi tổng quan.
// ============================================================
import {
  CLUSTERS,
  CLUSTER_FACTORIES,
  ENTERPRISES,
  IMPORT_EXPORT_OVERVIEW,
  OVERVIEW_KPI,
  TRADES,
  TRADE_PORTS,
} from "@/data/mock";
import { ENERGY_OVERVIEW } from "@/data/energy-mock";
import { PORTAL_MARKET_KPIS, PORTAL_POSTS } from "@/data/portal";
import { SCT_LEADERS, SCT_UNITS } from "@/data/leadership";
import { formatNumber } from "@/lib/report-service";
import { computeImportExportKpis, formatTyUsd } from "@/lib/import-export-service";
import {
  computeTradePromotionForecast,
  computeTradePromotionKpis,
  formatNghinUsd,
} from "@/lib/trade-promotion-service";
import type { Cluster, Enterprise } from "@/lib/types";

export interface ChatQaRow {
  label: string;
  value: string;
  tone?: "up" | "down";
}

export interface ChatQaAction {
  label: string;
  to: string;
}

export interface ChatQaAnswer {
  text: string;
  rows?: ChatQaRow[];
  action?: ChatQaAction;
  /** Gợi ý câu hỏi tiếp theo để tiếp tục hội thoại. */
  followUps?: string[];
}

const OVERVIEW_LINK: ChatQaAction = {
  label: "Xem tổng quan nền tảng → /platform-overview",
  to: "/platform-overview",
};
const ENTERPRISES_LINK: ChatQaAction = {
  label: "Mở CSDL doanh nghiệp → /enterprises",
  to: "/enterprises",
};
const CLUSTERS_LINK: ChatQaAction = {
  label: "Xem bản đồ cụm công nghiệp → /industrial-clusters",
  to: "/industrial-clusters",
};
const GIS_LINK: ChatQaAction = { label: "Xem bản đồ GIS → /gis.map", to: "/gis.map" };
const XNK_LINK: ChatQaAction = { label: "Xem chi tiết → Xuất nhập khẩu", to: "/import-export" };
const XTTM_LINK: ChatQaAction = {
  label: "Xem chi tiết → Xúc tiến thương mại",
  to: "/trade-promotion",
};
const ENERGY_LINK: ChatQaAction = { label: "Xem chi tiết → Năng lượng", to: "/energy" };
const PORTAL_LINK: ChatQaAction = {
  label: "Xem cổng thông tin → /trang-thong-tin",
  to: "/trang-thong-tin",
};

// ---------------------------------------------------------------------------
// Chuẩn hóa câu hỏi: lowercase + bỏ dấu tiếng Việt + mở rộng từ viết tắt.
// ---------------------------------------------------------------------------
const DIACRITICS: Record<string, string> = {
  à: "a",
  á: "a",
  ả: "a",
  ã: "a",
  ạ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ẩ: "a",
  ẫ: "a",
  ậ: "a",
  đ: "d",
  è: "e",
  é: "e",
  ẻ: "e",
  ẽ: "e",
  ẹ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ể: "e",
  ễ: "e",
  ệ: "e",
  ì: "i",
  í: "i",
  ỉ: "i",
  ĩ: "i",
  ị: "i",
  ò: "o",
  ó: "o",
  ỏ: "o",
  õ: "o",
  ọ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ổ: "o",
  ỗ: "o",
  ộ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ở: "o",
  ỡ: "o",
  ợ: "o",
  ù: "u",
  ú: "u",
  ủ: "u",
  ũ: "u",
  ụ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ử: "u",
  ữ: "u",
  ự: "u",
  ỳ: "y",
  ý: "y",
  ỷ: "y",
  ỹ: "y",
  ỵ: "y",
};

export function normalizeText(input: string): string {
  let out = "";
  for (const ch of input.toLowerCase().trim()) out += DIACRITICS[ch] ?? ch;
  out = out
    .replace(/\bccn\b/g, "cum cong nghiep")
    .replace(/\bkcn\b/g, "khu cong nghiep")
    .replace(/\bxnk\b/g, "xuat nhap khau")
    .replace(/\bxnc\b/g, "xuat nhap khau")
    .replace(/\bxttm\b/g, "xuc tien thuong mai")
    .replace(/\bdn\b/g, "doanh nghiep")
    .replace(/\bcty\b/g, "cong ty");
  return out.replace(/\s+/g, " ").trim();
}

const STOP_WORDS = new Set([
  "doanh",
  "nghiep",
  "cong",
  "ty",
  "co",
  "cua",
  "va",
  "theo",
  "la",
  "nao",
  "tim",
  "xem",
  "cho",
  "ve",
  "bao",
  "cao",
  "khau",
  "dien",
  "nang",
  "luong",
  "thi",
  "truong",
  "toan",
  "tinh",
  "vui",
  "long",
  "xin",
  "hoi",
  "so",
  "nhieu",
  "loai",
  "ma",
  "hieu",
  "lam",
  "san",
  "hoat",
  "dong",
  "nguoi",
  "chi",
  "ra",
  "duoc",
  "tra",
  "cuu",
  "thong",
  "tin",
  "tong",
  "kha",
  "hien",
]);

function ans(
  text: string,
  opts?: { rows?: ChatQaRow[]; action?: ChatQaAction; followUps?: string[] },
): ChatQaAnswer {
  return {
    text,
    ...(opts?.rows?.length ? { rows: opts.rows } : {}),
    ...(opts?.action ? { action: opts.action } : {}),
    ...(opts?.followUps?.length ? { followUps: opts.followUps } : {}),
  };
}

function hasAny(q: string, keys: string[]): boolean {
  return keys.some((k) => q.includes(k));
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Xưng hô theo tên tiếng Việt: tên có đệm "Thị" → Bà, ngược lại → Ông. */
function honorific(name: string): string {
  return name.includes("Thị") ? "Bà" : "Ông";
}

function groupCount<T>(rows: T[], group: (r: T) => string): ChatQaRow[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const g = group(r) || "Chưa xác định";
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .map(({ label, value }) => ({ label, value: String(value) }));
}

function topN<T>(
  rows: T[],
  label: (r: T) => string,
  value: (r: T) => number,
  fmt: (n: number) => string,
  n: number,
): ChatQaRow[] {
  return [...rows]
    .sort((a, b) => value(b) - value(a))
    .slice(0, n)
    .map((r) => ({ label: label(r), value: fmt(value(r)) }));
}

function sumTop<T>(
  rows: T[],
  group: (r: T) => string,
  value: (r: T) => number,
  fmt: (n: number) => string,
  n = 8,
): ChatQaRow[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const g = group(r) || "Khác";
    map.set(g, (map.get(g) ?? 0) + value(r));
  }
  return [...map.entries()]
    .map(([label, v]) => ({ label, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map(({ label, v }) => ({ label, value: fmt(v) }));
}

const fmtTrUsd = (n: number) => `${formatNumber(n, 1)} tr. USD`;

// ---------------------------------------------------------------------------
// 1. TỔNG QUAN NỀN TẢNG
// ---------------------------------------------------------------------------
function answerOverview(): ChatQaAnswer {
  const official = OVERVIEW_KPI.map((k) => ({ label: k.label, value: k.value }));
  return ans(
    "Tổng quan ngành Công Thương tỉnh Tây Ninh (chỉ số chính thức): hệ thống đang theo dõi toàn bộ dữ liệu doanh nghiệp, cụm công nghiệp, năng lượng và giấy phép trên nền tảng số.",
    {
      rows: official,
      action: OVERVIEW_LINK,
      followUps: [
        "Có bao nhiêu doanh nghiệp?",
        "Tổng kim ngạch XNK 6T/2026?",
        "Độ tin cậy cung cấp điện?",
      ],
    },
  );
}

// ---------------------------------------------------------------------------
// 2. GIẤY PHÉP
// ---------------------------------------------------------------------------
function answerLicense(): ChatQaAnswer {
  const lic = OVERVIEW_KPI.find((k) => k.id === "lic")?.value ?? "1.827";
  const exp = OVERVIEW_KPI.find((k) => k.id === "exp")?.value ?? "37";
  return ans(
    `Hệ thống đang quản lý ${lic} giấy phép còn hiệu lực; ${exp} giấy phép sắp hết hạn trong 30 ngày tới (chỉ số chính thức).`,
    {
      rows: [
        { label: "Giấy phép còn hiệu lực", value: lic },
        { label: "Giấy phép sắp hết hạn", value: exp },
      ],
      action: { label: "Xem quản lý dữ liệu → /data-management", to: "/data-management" },
      followUps: ["Có bao nhiêu doanh nghiệp?", "Cụm công nghiệp lấp đầy cao nhất?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 3. LÃNH ĐẠO & ĐƠN VỊ TRỰC THUỘC
// ---------------------------------------------------------------------------
function answerLeadership(q: string): ChatQaAnswer {
  if (hasAny(q, ["don vi", "phong ban", "chinh van phong", "truong phong", "co cau", "to chuc"])) {
    const rows = SCT_UNITS.map((u) => ({
      label: u.unit,
      value: `${u.title}: ${honorific(u.name)} ${u.name}`,
    }));
    return ans(`Sở Công Thương Tây Ninh có ${SCT_UNITS.length} đơn vị trực thuộc.`, {
      rows,
      action: PORTAL_LINK,
      followUps: ["Ai là Giám đốc Sở?", "Có tin tức mới nào?"],
    });
  }
  const gd = SCT_LEADERS.find((l) => l.role.startsWith("Giám đốc") && !l.role.includes("Phó"));
  const pgd = SCT_LEADERS.filter((l) => l.role.includes("Phó Giám đốc"));
  const rows = SCT_LEADERS.map((l) => ({ label: l.role, value: `${honorific(l.name)} ${l.name}` }));
  const gdName = gd ? `${honorific(gd.name)} ${gd.name}` : "—";
  return ans(
    `Giám đốc Sở Công Thương Tây Ninh là ${gdName}.${pgd.length ? ` Sở có ${pgd.length} Phó Giám đốc.` : ""}`,
    {
      rows,
      action: PORTAL_LINK,
      followUps: ["Sở có những đơn vị nào?", "Số điện thoại liên hệ Sở?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 4. NĂNG LƯỢNG
// ---------------------------------------------------------------------------
function answerEnergy(q: string): ChatQaAnswer {
  if (
    q.includes("tin cay") ||
    q.includes("saifi") ||
    q.includes("saidi") ||
    q.includes("mat dien")
  ) {
    const trend = ENERGY_OVERVIEW.reliabilityTrend;
    const last = trend.length ? trend[trend.length - 1] : undefined;
    const target = ENERGY_OVERVIEW.reliabilityTarget;
    const lastText = last
      ? `Năm ${last.year}: SAIFI ${last.saifi} lần/khách hàng, SAIDI ${last.saidi} phút.`
      : "";
    return ans(
      `Chỉ số độ tin cậy cung cấp điện (dữ liệu tham khảo EVNHCMC): ${lastText} Chỉ tiêu ${target.period}: SAIFI < ${target.saifi} lần, SAIDI < ${target.saidi} phút.`,
      {
        rows: [
          ...(last
            ? [
                { label: `SAIFI (${last.year})`, value: `${last.saifi} lần` },
                { label: `SAIDI (${last.year})`, value: `${last.saidi} phút` },
              ]
            : []),
          {
            label: `Chỉ tiêu ${target.period}`,
            value: `SAIFI < ${target.saifi} · SAIDI < ${target.saidi}`,
          },
        ],
        action: ENERGY_LINK,
        followUps: ["Cơ cấu nguồn điện?", "Công suất lắp đặt bao nhiêu?"],
      },
    );
  }

  if (
    q.includes("nguon") ||
    q.includes("co cau") ||
    q.includes("dien mat troi") ||
    q.includes("nguon dien")
  ) {
    const rows = ENERGY_OVERVIEW.sourceMix.map((s) => ({
      label: s.name,
      value: `${formatNumber(s.capacityMw, 0)} MW`,
    }));
    return ans(
      `Cơ cấu nguồn điện lắp đặt: tổng ${formatNumber(ENERGY_OVERVIEW.kpis.totalCapacityMw, 0)} MW, tỷ trọng năng lượng tái tạo ${formatNumber(ENERGY_OVERVIEW.kpis.renewableRatioPct, 1)}%.`,
      {
        rows,
        action: ENERGY_LINK,
        followUps: ["Có bao nhiêu dự án điện mặt trời?", "Sản lượng điện bao nhiêu?"],
      },
    );
  }

  if (q.includes("du an") || q.includes("nha may")) {
    const rows = ENERGY_OVERVIEW.projectStatus.map((p) => ({
      label: p.name,
      value: String(p.value),
    }));
    return ans(
      `Cơ cấu dự án năng lượng trên địa bàn: ${rows.map((r) => `${r.label.toLowerCase()} ${r.value}`).join(", ")}. Nguồn: năng lượng tái tạo (điện mặt trời, điện rác, sinh khối).`,
      {
        rows,
        action: ENERGY_LINK,
        followUps: ["Công suất lắp đặt bao nhiêu?", "Độ tin cậy cung cấp điện?"],
      },
    );
  }

  const k = ENERGY_OVERVIEW.kpis;
  return ans(
    `Tổng quan năng lượng: công suất lắp đặt ${formatNumber(k.totalCapacityMw, 0)} MW, sản lượng ${formatNumber(k.electricityOutputGwh, 0)} GWh, tỷ trọng năng lượng tái tạo ${formatNumber(k.renewableRatioPct, 1)}%. Hệ thống có ${k.substations} trạm biến áp (${k.overloadedSubstations} trạm quá tải), ${formatNumber(k.rooftopSolarMw, 0)} MW điện mặt trời mái nhà, ${k.chargingStations} trạm sạc, ${k.incidentsActive} sự cố đang xử lý.`,
    {
      rows: [
        { label: "Công suất lắp đặt", value: `${formatNumber(k.totalCapacityMw, 0)} MW` },
        { label: "Sản lượng", value: `${formatNumber(k.electricityOutputGwh, 0)} GWh` },
        { label: "Tỷ trọng NLTT", value: `${formatNumber(k.renewableRatioPct, 1)}%` },
        { label: "Trạm biến áp", value: `${k.substations} (quá tải ${k.overloadedSubstations})` },
        { label: "ĐMT mái nhà", value: `${formatNumber(k.rooftopSolarMw, 0)} MW` },
        { label: "Trạm sạc", value: String(k.chargingStations) },
        { label: "Sự cố đang xử lý", value: String(k.incidentsActive) },
      ],
      action: ENERGY_LINK,
      followUps: ["Độ tin cậy cung cấp điện?", "Cơ cấu nguồn điện?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 5. CỤM / KHU CÔNG NGHIỆP
// ---------------------------------------------------------------------------
function answerCluster(q: string): ChatQaAnswer | undefined {
  const lookup = (): Cluster | undefined => {
    const tokens = q.split(" ").filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
    return CLUSTERS.find((c) => {
      const name = normalizeText(c.name);
      return name.includes(q) || q.includes(name) || tokens.some((t) => name.includes(t));
    });
  };

  const c = lookup();
  if (c) {
    const factories = CLUSTER_FACTORIES[c.id] ?? [];
    return ans(
      `${c.name} — huyện ${c.district}, xã ${c.ward}. Diện tích ${formatNumber(c.area, 0)} ha (đã cho thuê ${formatNumber(c.leased, 0)} ha), tỷ lệ lấp đầy ${formatNumber(c.occupancy, 1)}%. Ngành: ${c.sectors}.${c.investor ? ` Chủ đầu tư hạ tầng: ${c.investor}.` : ""}`,
      {
        rows: [
          { label: "Diện tích", value: `${formatNumber(c.area, 0)} ha` },
          { label: "Đã cho thuê", value: `${formatNumber(c.leased, 0)} ha` },
          { label: "Tỷ lệ lấp đầy", value: `${formatNumber(c.occupancy, 1)}%` },
          { label: "Doanh nghiệp/dự án", value: String(c.enterprises) },
          ...(factories.length
            ? [{ label: "Nhà máy trong cụm", value: String(factories.length) }]
            : []),
        ],
        action: GIS_LINK,
        followUps: ["Cụm nào lấp đầy cao nhất?", "Tổng diện tích cụm công nghiệp?"],
      },
    );
  }

  if (q.includes("huyen") || q.includes("theo dia ban")) {
    const rows = groupCount(CLUSTERS, (c2) => c2.district);
    return ans(`Số cụm/khu công nghiệp theo địa bàn (dữ liệu mẫu):`, {
      rows,
      action: CLUSTERS_LINK,
      followUps: ["Cụm nào lấp đầy cao nhất?", "Cụm công nghiệp có bao nhiêu nhà máy?"],
    });
  }

  if (q.includes("nhieu nha may") || q.includes("loi nhat") || q.includes("day nhat")) {
    const rows = topN(
      CLUSTERS,
      (c2) => c2.name,
      (c2) => c2.enterprises,
      (n) => `${formatNumber(n, 0)} DN`,
      5,
    );
    return ans(`Các cụm/khu công nghiệp có nhiều doanh nghiệp nhất (dữ liệu mẫu):`, {
      rows,
      action: CLUSTERS_LINK,
      followUps: ["Cụm nào lấp đầy cao nhất?", "Tổng diện tích cụm công nghiệp?"],
    });
  }

  if (q.includes("day") || q.includes("lap day") || q.includes("occupancy")) {
    const avg = CLUSTERS.reduce((s, c2) => s + c2.occupancy, 0) / CLUSTERS.length;
    const rows = topN(
      CLUSTERS,
      (c2) => c2.name,
      (c2) => c2.occupancy,
      (n) => `${formatNumber(n, 1)}%`,
      5,
    );
    return ans(
      `Tỷ lệ lấp đầy bình quân các cụm/khu công nghiệp đạt ${formatNumber(avg, 1)}% (dữ liệu mẫu). Cụm lấp đầy cao nhất: ${rows[0]?.label ?? "—"} (${rows[0]?.value ?? "—"}).`,
      {
        rows,
        action: CLUSTERS_LINK,
        followUps: ["Tổng diện tích cụm công nghiệp?", "Cụm công nghiệp theo huyện?"],
      },
    );
  }

  if (q.includes("dien tich") || q.includes("dien tich tong")) {
    const total = CLUSTERS.reduce((s, c2) => s + c2.area, 0);
    const leased = CLUSTERS.reduce((s, c2) => s + c2.leased, 0);
    return ans(
      `Tổng diện tích các cụm/khu công nghiệp ${formatNumber(total, 0)} ha, đã cho thuê ${formatNumber(leased, 0)} ha (dữ liệu mẫu).`,
      {
        action: CLUSTERS_LINK,
        followUps: ["Cụm nào lấp đầy cao nhất?", "Có bao nhiêu cụm công nghiệp?"],
      },
    );
  }

  const totalFactories = Object.values(CLUSTER_FACTORIES).reduce((s, arr) => s + arr.length, 0);
  return ans(
    `CSDL đang quản lý ${CLUSTERS.length} cụm/khu công nghiệp (dữ liệu mẫu) với tổng cộng ${totalFactories} nhà máy. Chỉ số chính thức của tỉnh: 26 cụm công nghiệp; theo quy hoạch 108 cụm (~6.228 ha) theo QĐ 2968/QĐ-UBND.`,
    {
      rows: [
        { label: "Cụm/KCN (CSDL mẫu)", value: String(CLUSTERS.length) },
        { label: "Nhà máy trong cụm", value: String(totalFactories) },
        { label: "Cụm CN (chính thức)", value: "26" },
        { label: "Quy hoạch", value: "108 cụm · ~6.228 ha" },
      ],
      action: CLUSTERS_LINK,
      followUps: ["Cụm nào lấp đầy cao nhất?", "Cụm công nghiệp theo huyện?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 6. XÚC TIẾN THƯƠNG MẠI
// ---------------------------------------------------------------------------
function answerTradePromotion(q: string): ChatQaAnswer {
  if (
    q.includes("du bao") ||
    q.includes("2027") ||
    q.includes("forecast") ||
    q.includes("quy toi") ||
    q.includes("sap toi")
  ) {
    const fc = computeTradePromotionForecast("H2/2026");
    const fcRows = fc.points
      .filter((p) => p.forecast !== undefined)
      .slice(0, 4)
      .map((p) => ({
        label: `Dự báo ${p.quarter}`,
        value: `${formatNumber(p.forecast ?? 0, 1)} nghìn USD`,
      }));
    return ans(
      `Dự báo xúc tiến thương mại ${fc.horizon}: kinh phí cả năm 2026 ước ${formatNumber(fc.budgetYear, 1)} nghìn USD (tăng ${formatNumber(fc.growthBudgetPct, 0)}% so 2025), lượt doanh nghiệp ước ${formatNumber(fc.enterprisesYear, 0)}. ${fc.insights}`,
      {
        rows: [
          ...fcRows,
          { label: "Kinh phí 2025", value: formatNghinUsd(fc.budget2025) },
          { label: "Lượt DN dự báo 2026", value: String(fc.enterprisesYear) },
        ],
        action: XTTM_LINK,
        followUps: ["Tổng kinh phí XTTM 2026?", "Dự báo XTTM Năm 2027?"],
      },
    );
  }

  if (q.includes("kinh phi")) {
    const k = computeTradePromotionKpis();
    return ans(
      `Tổng kinh phí xúc tiến thương mại 2026: ${formatNghinUsd(k.budget2026)} (2025: ${formatNghinUsd(k.budget2025)}). Trong 12 chương trình 2026 có ${k.ongoing} chương trình đang triển khai.`,
      {
        rows: [
          { label: "Kinh phí 2026", value: formatNghinUsd(k.budget2026) },
          { label: "Kinh phí 2025", value: formatNghinUsd(k.budget2025) },
          { label: "Chương trình 2026", value: String(k.count2026) },
          { label: "Top thị trường", value: k.topMarket },
        ],
        action: XTTM_LINK,
        followUps: ["Dự báo XTTM 6 tháng cuối 2026?", "Lượt doanh nghiệp tham gia XTTM?"],
      },
    );
  }

  const k = computeTradePromotionKpis();
  return ans(
    `Xúc tiến thương mại 2026: ${k.count2026} chương trình, tổng kinh phí ${formatNghinUsd(k.budget2026)}, ${formatNumber(k.enterprises2026, 0)} lượt doanh nghiệp tham gia. ${k.growthPrograms >= 0 ? "Tăng" : "Giảm"} ${formatNumber(Math.abs(k.growthPrograms), 0)} chương trình so 2025.`,
    {
      rows: [
        { label: "Chương trình 2026", value: String(k.count2026) },
        { label: "Kinh phí 2026", value: formatNghinUsd(k.budget2026) },
        { label: "Lượt DN 2026", value: String(k.enterprises2026) },
        { label: "Lượt DN 2025", value: String(k.enterprises2025) },
        { label: "Top thị trường", value: k.topMarket },
      ],
      action: XTTM_LINK,
      followUps: ["Tổng kinh phí XTTM 2026?", "Dự báo XTTM 2027?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 7. DOANH NGHIỆP
// ---------------------------------------------------------------------------
function answerEnterprise(q: string): ChatQaAnswer | undefined {
  const matches = (): Enterprise[] => {
    const tokens = q.split(" ").filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
    return ENTERPRISES.filter((e) => {
      const name = normalizeText(e.name);
      if (name.includes(q) || q.includes(name)) return true;
      return tokens.some((t) => name.includes(t));
    });
  };

  const found = matches();
  if (found.length) {
    const e = found[0]!;
    if (found.length === 1) {
      return ans(
        `${e.name} — ngành ${e.sector}, ${e.district}. Người đại diện: ${e.representative}.`,
        {
          rows: [
            { label: "Mã số thuế", value: e.taxCode },
            { label: "Lao động", value: formatNumber(e.employees, 0) },
            { label: "Doanh thu", value: `${formatNumber(e.revenue, 0)} tỷ đồng` },
            { label: "Trạng thái", value: e.status === "active" ? "Đang hoạt động" : e.status },
          ],
          action: ENTERPRISES_LINK,
          followUps: ["Doanh nghiệp theo huyện?", "Top doanh nghiệp theo doanh thu?"],
        },
      );
    }
    return ans(`Tìm thấy ${found.length} doanh nghiệp khớp:`, {
      rows: found.slice(0, 6).map((x) => ({ label: x.name, value: x.district })),
      action: ENTERPRISES_LINK,
      followUps: ["Tìm doanh nghiệp theo tên?", "Doanh nghiệp theo ngành?"],
    });
  }

  if (q.includes("huyen") || q.includes("theo dia ban")) {
    const rows = groupCount(ENTERPRISES, (e) => e.district);
    return ans(`Số doanh nghiệp theo địa bàn (dữ liệu mẫu):`, {
      rows,
      action: ENTERPRISES_LINK,
      followUps: ["Doanh nghiệp theo ngành?", "Top doanh nghiệp theo doanh thu?"],
    });
  }

  if (q.includes("nganh") || q.includes("linh vuc") || q.includes("theo nghe")) {
    const rows = groupCount(ENTERPRISES, (e) => e.sector);
    return ans(`Số doanh nghiệp theo ngành (dữ liệu mẫu):`, {
      rows,
      action: ENTERPRISES_LINK,
      followUps: ["Doanh nghiệp theo huyện?", "Có bao nhiêu doanh nghiệp?"],
    });
  }

  if (q.includes("top") || q.includes("lon nhat") || q.includes("hang dau")) {
    if (q.includes("lao dong") || q.includes("nhan su")) {
      const rows = topN(
        ENTERPRISES,
        (e) => e.name,
        (e) => e.employees,
        (n) => formatNumber(n, 0),
        5,
      );
      return ans(`Top doanh nghiệp theo số lao động (dữ liệu mẫu):`, {
        rows,
        action: ENTERPRISES_LINK,
        followUps: ["Top doanh nghiệp theo doanh thu?", "Doanh nghiệp theo huyện?"],
      });
    }
    const rows = topN(
      ENTERPRISES,
      (e) => e.name,
      (e) => e.revenue,
      (n) => `${formatNumber(n, 0)} tỷ đồng`,
      5,
    );
    return ans(`Top doanh nghiệp theo doanh thu (dữ liệu mẫu):`, {
      rows,
      action: ENTERPRISES_LINK,
      followUps: ["Top doanh nghiệp theo lao động?", "Doanh nghiệp theo ngành?"],
    });
  }

  if (q.includes("tong doanh thu") || q.includes("tong lao dong") || q.includes("tong so")) {
    const revenue = ENTERPRISES.reduce((s, e) => s + e.revenue, 0);
    const employees = ENTERPRISES.reduce((s, e) => s + e.employees, 0);
    return ans(
      `Tổng doanh thu các doanh nghiệp trong CSDL mẫu đạt ${formatNumber(revenue, 0)} tỷ đồng, tổng lao động ${formatNumber(employees, 0)} người.`,
      {
        action: ENTERPRISES_LINK,
        followUps: ["Có bao nhiêu doanh nghiệp?", "Top doanh nghiệp theo doanh thu?"],
      },
    );
  }

  const revenue = ENTERPRISES.reduce((s, e) => s + e.revenue, 0);
  return ans(
    `CSDL ngành đang quản lý ${ENTERPRISES.length} doanh nghiệp trong dữ liệu mẫu (tổng doanh thu ${formatNumber(revenue, 0)} tỷ đồng). Chỉ số chính thức của tỉnh: 2.486 doanh nghiệp, 3.174 cơ sở SXKD.`,
    {
      rows: [
        { label: "Doanh nghiệp (CSDL mẫu)", value: String(ENTERPRISES.length) },
        { label: "Doanh nghiệp (chính thức)", value: "2.486" },
        { label: "Cơ sở SXKD (chính thức)", value: "3.174" },
        { label: "DN tham gia XNK", value: formatNumber(IMPORT_EXPORT_OVERVIEW.enterprises, 0) },
      ],
      action: ENTERPRISES_LINK,
      followUps: ["Doanh nghiệp theo huyện?", "Top doanh nghiệp theo doanh thu?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 8. XUẤT NHẬP KHẨU
// ---------------------------------------------------------------------------
function answerImportExport(q: string): ChatQaAnswer {
  if (q.includes("cua khau")) {
    const rows: ChatQaRow[] = TRADE_PORTS.map((g) => ({
      label: g.name,
      value: `${fmtTrUsd(g.value2026)} (+${formatNumber(g.growth, 1)}%)`,
      tone: g.growth >= 0 ? "up" : "down",
    }));
    const top = TRADE_PORTS[0];
    return ans(
      `Tây Ninh có ${TRADE_PORTS.length} cửa khẩu đang theo dõi.${top ? ` Lớn nhất là ${top.name} với ${fmtTrUsd(top.value2026)} (tăng ${formatNumber(top.growth, 1)}%): ${top.highlight}` : ""}`,
      {
        rows,
        action: XNK_LINK,
        followUps: ["Mặt hàng xuất khẩu chính?", "So sánh kim ngạch 2025/2026?"],
      },
    );
  }

  if (q.includes("thi truong")) {
    const rows = sumTop(
      TRADES,
      (t) => t.market,
      (t) => t.exportValue,
      fmtTrUsd,
    );
    const k = computeImportExportKpis();
    return ans(
      `Thị trường xuất khẩu lớn nhất là ${k.topMarket}; toàn tỉnh đang xuất khẩu tới ${formatNumber(k.markets, 0)} quốc gia/vùng lãnh thổ (dữ liệu mẫu theo giá trị xuất khẩu):`,
      {
        rows,
        action: XNK_LINK,
        followUps: ["Mặt hàng xuất khẩu chính?", "Tổng kim ngạch XNK 6T/2026?"],
      },
    );
  }

  if (q.includes("mat hang") || q.includes("hang hoa")) {
    const rows = topN(
      TRADES,
      (t) => `${t.name} (${t.market})`,
      (t) => t.exportValue,
      fmtTrUsd,
      6,
    );
    return ans(`Top mặt hàng xuất khẩu theo giá trị 6T/2026 (tr. USD):`, {
      rows,
      action: XNK_LINK,
      followUps: ["Cửa khẩu nào lớn nhất?", "Thị trường xuất khẩu lớn nhất?"],
    });
  }

  if (q.includes("so sanh") || q.includes("2025")) {
    return ans(
      `Cả năm 2025 tổng kim ngạch đạt ${formatTyUsd(IMPORT_EXPORT_OVERVIEW.total2025)} (+${formatNumber(IMPORT_EXPORT_OVERVIEW.growth2025, 1)}%). Kế hoạch 2026: xuất khẩu ${formatTyUsd(IMPORT_EXPORT_OVERVIEW.exportPlan2026)}, nhập khẩu ${formatTyUsd(IMPORT_EXPORT_OVERVIEW.importPlan2026)}; 6T/2026 đã hoàn thành ${formatNumber(IMPORT_EXPORT_OVERVIEW.exportPlanPct, 2)}% kế hoạch xuất khẩu.`,
      {
        rows: [
          { label: "Tổng kim ngạch 2025", value: formatTyUsd(IMPORT_EXPORT_OVERVIEW.total2025) },
          {
            label: "Tăng trưởng 2025",
            value: `+${formatNumber(IMPORT_EXPORT_OVERVIEW.growth2025, 1)}%`,
          },
          { label: "Kế hoạch XK 2026", value: formatTyUsd(IMPORT_EXPORT_OVERVIEW.exportPlan2026) },
          { label: "Kế hoạch NK 2026", value: formatTyUsd(IMPORT_EXPORT_OVERVIEW.importPlan2026) },
        ],
        action: XNK_LINK,
        followUps: ["Tổng kim ngạch XNK 6T/2026?", "Cửa khẩu nào lớn nhất?"],
      },
    );
  }

  const k = computeImportExportKpis();
  return ans(
    `Kim ngạch xuất nhập khẩu 6 tháng đầu năm 2026 đạt ${formatTyUsd(k.total2026)} (tăng ${formatNumber(k.growth2026, 1)}% so cùng kỳ 2025), trong đó xuất khẩu ${formatTyUsd(k.export2026)} (+${formatNumber(k.exportGrowth2026, 1)}%), nhập khẩu ${formatTyUsd(k.import2026)} (+${formatNumber(k.importGrowth2026, 1)}%). Xuất siêu ${formatTyUsd(k.surplus2026)}. Có ${formatNumber(k.enterprises, 0)} doanh nghiệp tham gia XNK.`,
    {
      rows: [
        { label: "Tổng kim ngạch 6T/2026", value: formatTyUsd(k.total2026) },
        {
          label: "Xuất khẩu",
          value: `${formatTyUsd(k.export2026)} (+${formatNumber(k.exportGrowth2026, 1)}%)`,
        },
        {
          label: "Nhập khẩu",
          value: `${formatTyUsd(k.import2026)} (+${formatNumber(k.importGrowth2026, 1)}%)`,
        },
        { label: "Xuất siêu", value: formatTyUsd(k.surplus2026) },
        { label: "Cửa khẩu", value: String(k.gates) },
      ],
      action: XNK_LINK,
      followUps: ["Cửa khẩu nào lớn nhất?", "Mặt hàng xuất khẩu chính?"],
    },
  );
}

// ---------------------------------------------------------------------------
// 9. CHỈ SỐ THỊ TRƯỜNG (cổng thông tin)
// ---------------------------------------------------------------------------
function answerMarket(): ChatQaAnswer {
  const rows = PORTAL_MARKET_KPIS.map((k) => ({
    label: k.label,
    value: `${k.value} ${k.unit}`,
  }));
  return ans("Chỉ số thị trường 5–6 tháng đầu năm 2026 (cổng thông tin Sở Công Thương):", {
    rows,
    action: PORTAL_LINK,
    followUps: ["Tổng kim ngạch XNK 6T/2026?", "Có tin tức mới nào?"],
  });
}

// ---------------------------------------------------------------------------
// 10. TIN TỨC & SỰ KIỆN
// ---------------------------------------------------------------------------
function answerNews(q: string): ChatQaAnswer {
  const posts = PORTAL_POSTS.filter(
    (p) => p.status === "published" && (p.type === "news" || p.type === "event"),
  );
  const rows = posts.slice(0, 5).map((p) => ({
    label: p.title,
    value: formatDate(p.publishedAt),
  }));
  const latest = posts[0];
  return ans(
    `Cổng thông tin hiển thị ${posts.length} tin tức/sự kiện.${latest ? ` Tin mới nhất: "${latest.title}" (${formatDate(latest.publishedAt)}).` : ""}`,
    {
      rows,
      action: PORTAL_LINK,
      followUps: ["Chỉ số thị trường?", "Ai là Giám đốc Sở?"],
    },
  );
}

// ---------------------------------------------------------------------------
// BẢNG INTENT — thứ tự ưu tiên
// ---------------------------------------------------------------------------
interface Intent {
  id: string;
  match: (q: string) => boolean;
  answer: (q: string) => ChatQaAnswer | undefined;
}

const INTENTS: Intent[] = [
  {
    id: "overview",
    match: (q) =>
      hasAny(q, [
        "tong quan",
        "toan canh",
        "nen tang",
        "platform",
        "tong hop",
        "hieu qua hoat dong",
      ]),
    answer: answerOverview,
  },
  {
    id: "license",
    match: (q) =>
      q.includes("giay phep") ||
      (q.includes("phep") &&
        (q.includes("con hieu luc") || q.includes("het han") || q.includes("bao nhieu"))),
    answer: answerLicense,
  },
  {
    id: "leadership",
    match: (q) =>
      hasAny(q, [
        "giam doc",
        "lanh dao",
        "pho giam doc",
        "chinh van phong",
        "truong phong",
        "don vi truc thuoc",
        "co cau to chuc",
        "so cong thuong",
      ]),
    answer: answerLeadership,
  },
  {
    id: "energy",
    match: (q) =>
      hasAny(q, [
        "nang luong",
        "dien luc",
        "luoi dien",
        "nguon dien",
        "san luong dien",
        "tieu thu dien",
        "dien mat troi",
        "thuy dien",
        "dien gio",
        "sinh khoi",
        "dien rac",
        "cong suat",
        "saifi",
        "saidi",
        "tram bien ap",
        "dien nang",
        "du an dien",
        "tin cay",
        "cung cap dien",
        "mat dien",
      ]),
    answer: answerEnergy,
  },
  {
    id: "cluster",
    match: (q) => hasAny(q, ["cum cong nghiep", "khu cong nghiep", "ccn", "kcn", "kcn-ccn"]),
    answer: answerCluster,
  },
  {
    id: "trade_promotion",
    match: (q) =>
      hasAny(q, [
        "xuc tien thuong mai",
        "hoi cho",
        "trien lam",
        "khuyen mai",
        "ket noi giao thuong",
        "kinh phi",
        "chuong trinh xuc tien",
        "doan giao thuong",
      ]),
    answer: answerTradePromotion,
  },
  {
    id: "enterprise",
    match: (q) => hasAny(q, ["doanh nghiep", "co so sxkd", "co so san xuat", "cong ty", "nha may"]),
    answer: answerEnterprise,
  },
  {
    id: "import_export",
    match: (q) =>
      hasAny(q, [
        "xuat nhap khau",
        "kim ngach",
        "xuat khau",
        "nhap khau",
        "cua khau",
        "xuat sieu",
        "mat hang",
        "thi truong xuat",
        "hang hoa xuat",
      ]),
    answer: answerImportExport,
  },
  {
    id: "market",
    match: (q) =>
      hasAny(q, ["chi so thi truong", "ban le", "muc ban le", "ton du", "thuong mai dien tu"]),
    answer: answerMarket,
  },
  {
    id: "news",
    match: (q) => hasAny(q, ["tin tuc", "tin moi", "su kien", "thong bao", "cong bo", "hoi nghi"]),
    answer: answerNews,
  },
];

export function answerDataQuestion(question: string): ChatQaAnswer | undefined {
  const q = normalizeText(question);
  if (!q) return undefined;
  for (const intent of INTENTS) {
    if (intent.match(q)) {
      const a = intent.answer(q);
      if (a) return a;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// TRỢ GIÚP & GỢI Ý
// ---------------------------------------------------------------------------
export function helpAnswer(): ChatQaAnswer {
  return ans(
    "Tôi là trợ lý dữ liệu ngành Công Thương Tây Ninh. Tôi có thể trả lời câu hỏi về dữ liệu trong nền tảng:\n\n" +
      "• Tổng quan & KPI chính thức (doanh nghiệp, cụm CN, năng lượng, giấy phép)\n" +
      "• Doanh nghiệp & cụm/khu công nghiệp (đếm, theo huyện/ngành, tìm theo tên)\n" +
      "• Xuất nhập khẩu (kim ngạch, cửa khẩu, mặt hàng, so sánh 2025–2026)\n" +
      "• Xúc tiến thương mại (chương trình, kinh phí, lượt DN, dự báo)\n" +
      "• Năng lượng (công suất, sản lượng, độ tin cậy SAIFI/SAIDI, nguồn điện)\n" +
      "• Lãnh đạo Sở & đơn vị trực thuộc\n" +
      "• Tin tức, thị trường và báo cáo & BI\n\n" +
      'Thử hỏi: "Có bao nhiêu doanh nghiệp?", "Tổng kim ngạch XNK 6T/2026?", "Độ tin cậy cung cấp điện?"',
    { action: OVERVIEW_LINK, followUps: CHAT_SUGGESTIONS },
  );
}

export const CHAT_SUGGESTIONS = [
  "Có bao nhiêu doanh nghiệp?",
  "Tổng kim ngạch XNK 6T/2026?",
  "Danh sách cửa khẩu?",
  "Tổng kinh phí XTTM 2026?",
  "Độ tin cậy cung cấp điện?",
  "Ai là Giám đốc Sở?",
  "Cụm công nghiệp lấp đầy cao nhất?",
  "Có tin tức mới nào?",
];
