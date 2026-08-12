// Kiểu dữ liệu dùng chung cho toàn nền tảng.
// MOCK DATA: các cấu trúc này được thiết kế để map 1-1 với REST API sau này.

export type DataStatus =
  "draft" | "checking" | "need_more" | "pending" | "approved" | "locked" | "published" | "error";

export interface Enterprise {
  id: string;
  name: string;
  taxCode: string;
  sector: string;
  district: string;
  address: string;
  representative: string;
  employees: number;
  revenue: number; // tỷ đồng
  status: "active" | "suspended" | "dissolved";
  dataStatus: DataStatus;
  updatedAt: string;
  source: string;
  owner: string;
  links: {
    facilities: number;
    products: number;
    licenses: number;
    projects: number;
    energy: number;
    trades: number;
    documents: number;
  };
}

// Ranh giới KCN/CCN dạng GeoJSON Polygon (tọa độ [lng, lat])
export interface ClusterGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface Cluster {
  id: string;
  name: string;
  district: string;
  area: number;
  leased: number;
  enterprises: number;
  sectors: string;
  occupancy: number;
  status: DataStatus;
  lat: number; // toạ độ GPS thực tế (tâm KCN/CCN)
  lng: number;
  geometry?: ClusterGeometry; // backend cần bổ sung – nhưng thiếu vẫn vẽ được từ lat/lng + area
  infrastructure: { name: string; level: number; note: string }[];
}

export interface Factory {
  id: string;
  name: string;
  sector: string;
  address: string;
  representative: string;
  area: number; // ha
  employees: number;
  products: string;
  revenue: number; // tỷ đồng
  status: "active" | "suspended" | "expanding";
  lat: number;
  lng: number;
  // Hồ sơ doanh nghiệp (backend bổ sung dần; field chưa có sẽ hiển thị "—")
  taxCode?: string;
  establishedAt?: string;
  legalType?: string;
  sectorSecondary?: string;
  investment?: number; // tỷ đồng
  ward?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SurveyRecord {
  id: string;
  subject: string;
  district: string;
  officer: string;
  date: string;
  status: "new" | "doing" | "need_more" | "reviewed" | "approved";
}

export interface EnergySource {
  id: string;
  name: string;
  type: string;
  capacity: number; // MW
  output: number; // triệu kWh
  district: string;
  status: DataStatus;
}

export interface ProductRecord {
  id: string;
  name: string;
  group: string;
  market: string;
  standard: string;
  certificate: string;
  trend: number;
  status: DataStatus;
}

export interface TradeRecord {
  id: string;
  hs: string;
  name: string;
  enterprise: string;
  market: string;
  exportValue: number;
  importValue: number;
  period: string;
}

export interface PromotionProgram {
  id: string;
  name: string;
  organizer: string;
  time: string;
  enterprises: number;
  budget: number;
  result: string;
  status: DataStatus;
  kind: "Hội chợ" | "Triển lãm" | "Kết nối giao thương" | "Khuyến mại";
}

export interface MasterRecord {
  id: string;
  type: string;
  name: string;
  source: string;
  owner: string;
  updatedAt: string;
  status: DataStatus;
}

export interface QualityIssue {
  id: string;
  field: string;
  issue: string;
  records: number;
  severity: "Cao" | "Trung bình" | "Thấp";
  assignee: string;
  status: DataStatus;
}

export interface WorkflowItem {
  id: string;
  name: string;
  unit: string;
  updatedBy: string;
  time: string;
  source: string;
  stage: "new" | "checking" | "pending" | "approved" | "locked";
  history: { actor: string; role: string; action: string; time: string }[];
}

export interface IntegrationRow {
  id: string;
  system: string;
  api: string;
  lastSync: string;
  success: number;
  failed: number;
  latency: number;
  status: "connected" | "limited" | "error";
}

export interface UserRow {
  id: string;
  name: string;
  account: string;
  unit: string;
  role: string;
  lastLogin: string;
  status: "active" | "locked";
}

export interface AuditRow {
  id: string;
  time: string;
  user: string;
  action: string;
  module: string;
  object: string;
  ip: string;
  result: "SUCCESS" | "FAILED";
}

// --- Trang th�ng tin (public portal) ------------------------------------------
export type PortalContentType =
  | "news"
  | "event"
  | "promotion"
  | "investment"
  | "trade-promotion"
  | "market-info"
  | "announcement";

export type PortalStatus = "draft" | "published" | "archived";

export interface PortalAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface PortalPost {
  id: string;
  type: PortalContentType;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: string;
  status: PortalStatus;
  featured?: boolean;
  source?: string;
  author?: string;
  thumbnail?: string;
  views?: number;
  // event
  eventStartDate?: string;
  eventEndDate?: string;
  location?: string;
  organizer?: string;
  audience?: string;
  registrationDeadline?: string;
  // investment
  area?: string;
  availableArea?: string;
  industries?: string[];
  // misc
  attachments?: PortalAttachment[];
}
