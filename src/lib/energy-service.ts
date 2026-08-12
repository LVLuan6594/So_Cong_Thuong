// ============================================================
// SERVICE LAYER — PHÂN HỆ ĐIỀU TRA & NĂNG LƯỢNG
// Hiện chạy MOCK adapter (dữ liệu demo trong src/data/energy-mock.ts).
// Khi backend sẵn sàng: đổi ENERGY_DATA_SOURCE sang "api" và implement
// các hàm fetch tương ứng endpoint gợi ý bên dưới.
//
// ENDPOINT GỢI Ý (REST):
//   GET /energy/overview
//   GET /energy/substations | /energy/substations/:id
//   GET /energy/power-lines   | /energy/power-lines/:id
//   GET /energy/power-poles
//   GET /energy/projects      | /energy/projects/:id
//   GET /energy/rooftop-solar | /energy/rooftop-solar/:id
//   GET /energy/consumption
//   GET /energy/incidents     | /energy/incidents/:id
//   GET /energy/emissions     | /energy/emissions/:id
//   GET /energy/charging-stations | /energy/charging-stations/:id
// GIS:
//   GET /energy/gis (bundle các layer không gian)
// ============================================================
import type {
  CarbonCredit,
  ChargingStation,
  EmissionSource,
  EnergyConsumer,
  EnergyDataSource,
  EnergyGisData,
  EnergyOverview,
  GridIncident,
  GridSafetyViolation,
  KeyEnergyConsumer,
  PowerLine,
  PowerPole,
  PowerProject,
  RooftopSolar,
  SmartMeter,
  Substation,
} from "@/lib/energy-types";
import {
  CARBON_CREDITS,
  CHARGING_STATIONS,
  EMISSION_SOURCES,
  ENERGY_CONSUMERS,
  ENERGY_GIS_DATA,
  ENERGY_OVERVIEW,
  GRID_INCIDENTS,
  GRID_SAFETY_VIOLATIONS,
  KEY_ENERGY_CONSUMERS,
  POWER_LINES,
  POWER_POLES,
  POWER_PROJECTS,
  ROOFTOP_SOLAR,
  SMART_METERS,
  SUBSTATIONS,
} from "@/data/energy-mock";

// Bật MOCK / API. Production phải đổi sang "api" và cấu hình base URL.
export const ENERGY_DATA_SOURCE: EnergyDataSource = "mock";

const USE_MOCK = ENERGY_DATA_SOURCE === "mock";

// Giả lập độ trễ mạng để UI có Loading state đúng cách.
function delay<T>(value: T, ms = 320): Promise<T> {
  if (!USE_MOCK) return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function listEndpoint<T>(path: string): Promise<T[]> {
  // Khi chuyển "api": return fetch(`/api${path}`).then((r) => r.json());
  void path;
  return delay([] as T[]);
}

// ─────────────────────────── Tổng quan ───────────────────────────
export function getEnergyOverview(): Promise<EnergyOverview> {
  return delay(ENERGY_OVERVIEW);
}

// ─────────────────────────── Trạm biến áp ───────────────────────────
export async function getSubstations(): Promise<Substation[]> {
  if (!USE_MOCK) return listEndpoint<Substation>("/energy/substations");
  return delay(SUBSTATIONS);
}

export async function getSubstation(id: string): Promise<Substation | undefined> {
  if (!USE_MOCK) return listEndpoint<Substation>(`/energy/substations/${id}`).then((l) => l[0]);
  return delay(SUBSTATIONS.find((s) => s.id === id || s.code === id));
}

// ─────────────────────────── Lưới điện ───────────────────────────
export async function getPowerLines(): Promise<PowerLine[]> {
  if (!USE_MOCK) return listEndpoint<PowerLine>("/energy/power-lines");
  return delay(POWER_LINES);
}

export async function getPowerPoles(): Promise<PowerPole[]> {
  if (!USE_MOCK) return listEndpoint<PowerPole>("/energy/power-poles");
  return delay(POWER_POLES);
}

// ─────────────────────────── Dự án nguồn điện ───────────────────────────
export async function getPowerProjects(): Promise<PowerProject[]> {
  if (!USE_MOCK) return listEndpoint<PowerProject>("/energy/projects");
  return delay(POWER_PROJECTS);
}

export async function getPowerProject(id: string): Promise<PowerProject | undefined> {
  if (!USE_MOCK) return listEndpoint<PowerProject>(`/energy/projects/${id}`).then((l) => l[0]);
  return delay(POWER_PROJECTS.find((p) => p.id === id || p.code === id));
}

// ─────────────────────────── Điện mặt trời mái nhà ───────────────────────────
export async function getRooftopSolar(): Promise<RooftopSolar[]> {
  if (!USE_MOCK) return listEndpoint<RooftopSolar>("/energy/rooftop-solar");
  return delay(ROOFTOP_SOLAR);
}

// ─────────────────────────── Tiêu thụ & công tơ ───────────────────────────
export async function getEnergyConsumers(): Promise<EnergyConsumer[]> {
  if (!USE_MOCK) return listEndpoint<EnergyConsumer>("/energy/consumption");
  return delay(ENERGY_CONSUMERS);
}

export async function getSmartMeters(): Promise<SmartMeter[]> {
  if (!USE_MOCK) return listEndpoint<SmartMeter>("/energy/smart-meters");
  return delay(SMART_METERS);
}

export async function getKeyEnergyConsumers(): Promise<KeyEnergyConsumer[]> {
  if (!USE_MOCK) return listEndpoint<KeyEnergyConsumer>("/energy/key-consumers");
  return delay(KEY_ENERGY_CONSUMERS);
}

// ─────────────────────────── An toàn & Sự cố ───────────────────────────
export async function getGridIncidents(): Promise<GridIncident[]> {
  if (!USE_MOCK) return listEndpoint<GridIncident>("/energy/incidents");
  return delay(GRID_INCIDENTS);
}

export async function getGridSafetyViolations(): Promise<GridSafetyViolation[]> {
  if (!USE_MOCK) return listEndpoint<GridSafetyViolation>("/energy/safety-violations");
  return delay(GRID_SAFETY_VIOLATIONS);
}

// ─────────────────────────── Phát thải Carbon ───────────────────────────
export async function getEmissionSources(): Promise<EmissionSource[]> {
  if (!USE_MOCK) return listEndpoint<EmissionSource>("/energy/emissions");
  return delay(EMISSION_SOURCES);
}

export async function getCarbonCredits(): Promise<CarbonCredit[]> {
  if (!USE_MOCK) return listEndpoint<CarbonCredit>("/energy/carbon-credits");
  return delay(CARBON_CREDITS);
}

// ─────────────────────────── Trạm sạc ───────────────────────────
export async function getChargingStations(): Promise<ChargingStation[]> {
  if (!USE_MOCK) return listEndpoint<ChargingStation>("/energy/charging-stations");
  return delay(CHARGING_STATIONS);
}

// ─────────────────────────── GIS (bundle) ───────────────────────────
export async function getEnergyGisData(): Promise<EnergyGisData> {
  if (!USE_MOCK) return delay(ENERGY_GIS_DATA);
  return delay(ENERGY_GIS_DATA);
}

// ─────────────────────────── Phân tích nâng cao (AI) ───────────────────────────
export interface EnergyAnalysisResult {
  available: boolean;
  title: string;
  message: string;
}

// Sẵn sàng nhận API dự báo từ backend. Hiện trả trạng thái "chưa có dữ liệu".
export function getEnergyAnalysis(kind: string): Promise<EnergyAnalysisResult> {
  return delay({
    available: false,
    title: kind,
    message: "Chưa có dữ liệu phân tích. Backend dự báo phụ tải/quá tải sẽ được kết nối sau.",
  });
}
