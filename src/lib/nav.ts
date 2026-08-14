import {
  Activity,
  BarChart3,
  Boxes,
  Database,
  FileBarChart,
  Globe2,
  Layers,
  LayoutDashboard,
  Map,
  Plug,
  ShieldCheck,
  Ship,
  Store,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoleId =
  "leader" | "dept" | "specialist" | "gis" | "surveyor" | "enterprise" | "investor" | "admin";

export interface RoleDef {
  id: RoleId;
  name: string;
  scope: string;
}

// Role switcher chỉ phục vụ DEMO RBAC (XXIII), không có backend auth.
export const ROLES: RoleDef[] = [
  { id: "leader", name: "Lãnh đạo UBND/Sở", scope: "Điều hành toàn ngành" },
  { id: "dept", name: "Lãnh đạo phòng/đơn vị", scope: "Kiểm duyệt – phê duyệt" },
  { id: "specialist", name: "Chuyên viên", scope: "Nhập liệu – tác nghiệp" },
  { id: "gis", name: "Cán bộ GIS", scope: "Dữ liệu không gian" },
  { id: "surveyor", name: "Cán bộ điều tra", scope: "Điều tra – năng lượng" },
  { id: "enterprise", name: "Doanh nghiệp", scope: "Cổng doanh nghiệp" },
  { id: "investor", name: "Nhà đầu tư", scope: "Thông tin công khai" },
  { id: "admin", name: "Quản trị hệ thống", scope: "Quản trị – an toàn" },
];

export interface NavChild {
  label: string;
  to: string;
  /** Đánh dấu mục con đặc biệt (vd "05-gis" = mở bộ lọc GIS). */
  code?: string;
  /** Query params kèm khi điều hướng (vd { mode: "station" } cho Nhiệm vụ 1). */
  search?: Record<string, unknown>;
  /** Phân quyền riêng cho mục con (nếu thiếu thì kế thừa của cha). */
  roles?: RoleId[];
  children?: NavChild[];
}

export interface NavItem {
  code: string;
  label: string;
  to: string;
  icon: LucideIcon;
  group: string;
  roles: RoleId[];
  /** Mở trong tab mới (dùng cho trang public portal). */
  external?: boolean;
  children?: NavChild[];
}

const ALL: RoleId[] = [
  "leader",
  "dept",
  "specialist",
  "gis",
  "surveyor",
  "enterprise",
  "investor",
  "admin",
];

export const NAV_GROUPS = ["ĐIỀU HÀNH", "DỮ LIỆU", "NGHIỆP VỤ CHUYÊN NGÀNH", "BÁO CÁO", "HỆ THỐNG"];

export const NAV_ITEMS: NavItem[] = [
  {
    code: "01",
    label: "Tổng quan",
    to: "/",
    icon: LayoutDashboard,
    group: "ĐIỀU HÀNH",
    roles: ALL,
  },
  {
    code: "13",
    label: "Kiến trúc nền tảng",
    to: "/platform-overview",
    icon: Layers,
    group: "ĐIỀU HÀNH",
    roles: ALL,
  },
  {
    code: "03",
    label: "Quản trị dữ liệu",
    to: "/data-management",
    icon: Database,
    group: "DỮ LIỆU",
    roles: ["dept", "specialist", "admin"],
  },
  {
    code: "14",
    label: "Workflow & phê duyệt",
    to: "/workflow",
    icon: Workflow,
    group: "DỮ LIỆU",
    roles: ["dept", "specialist", "admin"],
  },
  {
    code: "04",
    label: "Dữ liệu doanh nghiệp",
    to: "/industry-database",
    icon: Boxes,
    group: "DỮ LIỆU",
    roles: ["leader", "dept", "specialist", "enterprise", "admin"],
  },
  {
    code: "05",
    label: "Dữ liệu GIS",
    to: "/industrial-clusters",
    icon: Map,
    group: "NGHIỆP VỤ CHUYÊN NGÀNH",
    roles: ["leader", "dept", "specialist", "gis", "surveyor", "investor", "admin"],
    children: [
      { label: "Bản đồ GIS tổng hợp", to: "/gis/map" },
      { label: "Cụm Công nghiệp", to: "/industrial-clusters", code: "05-gis" },
      {
        label: "Nguồn năng lượng tái tạo",
        to: "/energy",
        code: "06",
        roles: ["leader", "dept", "specialist", "surveyor", "admin"],
        children: [
          {
            label: "Nhiệm vụ 1",
            to: "/energy/nhiem-vu-1",
            children: [
              {
                label: "Trạm điện",
                to: "/energy/nhiem-vu-1",
                search: { mode: "station" },
              },
              {
                label: "Lưới điện",
                to: "/energy/nhiem-vu-1",
                search: { mode: "grid" },
              },
            ],
          },
          { label: "Nhiệm vụ 2", to: "/energy/nhiem-vu-2" },
          { label: "Nhiệm vụ 3", to: "/energy/nhiem-vu-3" },
          { label: "Nhiệm vụ 4", to: "/energy/nhiem-vu-4" },
          { label: "Nhiệm vụ 5", to: "/energy/nhiem-vu-5" },
          { label: "Nhiệm vụ 6", to: "/energy/nhiem-vu-6" },
          { label: "Nhiệm vụ 7", to: "/energy/nhiem-vu-7" },
        ],
      },
    ],
  },
  {
    code: "07",
    label: "Thị trường & Sản phẩm",
    to: "/market",
    icon: Store,
    group: "NGHIỆP VỤ CHUYÊN NGÀNH",
    roles: ["leader", "dept", "specialist", "enterprise", "admin"],
  },
  {
    code: "08",
    label: "Xuất nhập khẩu",
    to: "/import-export",
    icon: Ship,
    group: "NGHIỆP VỤ CHUYÊN NGÀNH",
    roles: ["leader", "dept", "specialist", "enterprise", "admin"],
  },
  {
    code: "09",
    label: "Xúc tiến thương mại",
    to: "/trade-promotion",
    icon: Globe2,
    group: "NGHIỆP VỤ CHUYÊN NGÀNH",
    roles: ["leader", "dept", "specialist", "enterprise", "investor", "admin"],
  },
  {
    code: "10",
    label: "Báo cáo & BI",
    to: "/analytics",
    icon: FileBarChart,
    group: "BÁO CÁO",
    roles: ["leader", "dept", "specialist", "investor", "admin"],
  },
  {
    code: "11",
    label: "Tích hợp dữ liệu",
    to: "/integration",
    icon: Plug,
    group: "HỆ THỐNG",
    roles: ["admin", "dept"],
  },
  {
    code: "12",
    label: "Quản trị hệ thống",
    to: "/admin",
    icon: ShieldCheck,
    group: "HỆ THỐNG",
    roles: ["admin"],
  },
  {
    code: "15",
    label: "Trang thông tin",
    to: "/trang-thong-tin",
    icon: Globe2,
    group: "ĐIỀU HÀNH",
    roles: ALL,
    external: true,
  },
];

export const QUICK_ACTIONS = [
  { label: "Cập nhật dữ liệu", to: "/data-management", icon: Database },
  { label: "Xem báo cáo", to: "/analytics", icon: FileBarChart },
  { label: "Tra cứu doanh nghiệp", to: "/industry-database", icon: Boxes },
  { label: "Mở bản đồ GIS", to: "/industrial-clusters", icon: Map },
];

export const PLATFORM_MODULES = [
  {
    code: "A",
    name: "Khai thác / Điều hành",
    icon: BarChart3,
    tone: "gov" as const,
    to: "/analytics",
    items: [
      "Kho báo cáo",
      "BI / Drill-down",
      "Cổng Web – GIS Web – Mobile Web",
      "Tra cứu công khai",
      "Cảnh báo",
      "Xuất DOCX/XLSX/PDF",
      "KPI",
    ],
  },
  {
    code: "B",
    name: "Quản trị dữ liệu",
    icon: Database,
    tone: "teal" as const,
    to: "/data-management",
    items: [
      "Master Data",
      "Danh mục dùng chung",
      "OCR/AI",
      "Staging",
      "Data Quality",
      "Mapping",
      "Đối soát",
      "Versioning",
    ],
  },
  {
    code: "C",
    name: "Quản trị & Điều hành hệ thống",
    icon: ShieldCheck,
    tone: "navy" as const,
    to: "/admin",
    items: [
      "Người dùng – Vai trò – Phân quyền",
      "Workflow phê duyệt",
      "Notification",
      "Audit log",
      "Monitoring",
      "Cấu hình",
    ],
  },
  {
    code: "D",
    name: "CSDL ngành & Hồ sơ số cốt lõi",
    icon: Boxes,
    tone: "gov" as const,
    to: "/industry-database",
    items: [
      "Doanh nghiệp",
      "Cơ sở SXKD",
      "Sản phẩm",
      "Giấy phép",
      "Đề án / Chương trình",
      "Dự án",
      "Tài liệu",
      "Dữ liệu địa bàn",
      "Hồ sơ năng lượng",
    ],
  },
  {
    code: "E",
    name: "Phân hệ chuyên ngành",
    icon: Layers,
    tone: "teal" as const,
    to: "/industrial-clusters",
    items: [
      "E1 – GIS Cụm công nghiệp",
      "E2 – Nguồn năng lượng tái tạo",
      "E3 – Thị trường & Sản phẩm",
      "E4 – Xuất nhập khẩu",
      "E5 – Xúc tiến thương mại",
    ],
  },
  {
    code: "F",
    name: "Tích hợp & An toàn",
    icon: Plug,
    tone: "success" as const,
    to: "/integration",
    items: [
      "LGSP / NDXP",
      "QLVBĐH",
      "Cổng DVC",
      "CSDL chuyên ngành",
      "API Gateway",
      "Giám sát an toàn thông tin",
    ],
  },
  {
    code: "G",
    name: "Hạ tầng kỹ thuật",
    icon: Activity,
    tone: "navy" as const,
    to: "/integration",
    items: [
      "Trung tâm dữ liệu tỉnh",
      "Máy chủ ứng dụng – CSDL",
      "Sao lưu – Dự phòng",
      "Bảo mật nhiều lớp",
      "Giám sát hạ tầng",
    ],
  },
  {
    code: "H",
    name: "Tác nhân / Use case",
    icon: Globe2,
    tone: "analytics" as const,
    to: "/platform-overview",
    items: [
      "Lãnh đạo UBND/Sở",
      "Lãnh đạo phòng",
      "Chuyên viên",
      "Cán bộ GIS – điều tra",
      "Doanh nghiệp",
      "Nhà đầu tư",
      "Quản trị hệ thống",
    ],
  },
];
