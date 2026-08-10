// ============================================================
// MOCK DATA — Toàn bộ số liệu dưới đây là dữ liệu giả lập cho DEMO.
// Sau này thay thế bằng REST API (mock service -> api service).
// ============================================================
import type {
  AuditRow,
  Cluster,
  EnergySource,
  Enterprise,
  IntegrationRow,
  MasterRecord,
  ProductRecord,
  PromotionProgram,
  QualityIssue,
  SurveyRecord,
  TradeRecord,
  UserRow,
  WorkflowItem,
} from "@/lib/types";

export const OVERVIEW_KPI = [
  { id: "ent", label: "Tổng doanh nghiệp", value: "2.486", delta: "+3,2%", tone: "gov" },
  { id: "fac", label: "Cơ sở SXKD", value: "3.174", delta: "+1,8%", tone: "gov" },
  { id: "ccn", label: "Cụm công nghiệp", value: "26", delta: "+2", tone: "teal" },
  { id: "energy", label: "Dự án năng lượng", value: "48", delta: "+5", tone: "teal" },
  { id: "lic", label: "Giấy phép còn hiệu lực", value: "1.827", delta: "+64", tone: "success" },
  { id: "exp", label: "Giấy phép sắp hết hạn", value: "37", delta: "30 ngày tới", tone: "warning" },
] as const;

export const SECTOR_CHART = [
  { name: "Cơ khí", value: 486 },
  { name: "Điện tử", value: 312 },
  { name: "Chế biến NS", value: 574 },
  { name: "Dệt may", value: 398 },
  { name: "Cao su", value: 264 },
  { name: "Năng lượng", value: 148 },
  { name: "Thương mại", value: 304 },
];

export const IIP_CHART = [
  { month: "T1", iip: 102.4, output: 8120 },
  { month: "T2", iip: 98.6, output: 7430 },
  { month: "T3", iip: 106.1, output: 9210 },
  { month: "T4", iip: 109.8, output: 9640 },
  { month: "T5", iip: 111.2, output: 10120 },
  { month: "T6", iip: 113.6, output: 10680 },
];

export const EXPORT_MARKET_CHART = [
  { name: "Hoa Kỳ", value: 34 },
  { name: "EU", value: 22 },
  { name: "Nhật Bản", value: 15 },
  { name: "Hàn Quốc", value: 12 },
  { name: "ASEAN", value: 11 },
  { name: "Khác", value: 6 },
];

export const DATA_STATE_CHART = [
  { name: "Đã phê duyệt", value: 1842 },
  { name: "Chờ duyệt", value: 264 },
  { name: "Cần bổ sung", value: 128 },
  { name: "Có lỗi", value: 46 },
];

export const OPERATION_ALERTS = [
  {
    id: "al-1",
    value: 37,
    label: "Giấy phép sắp hết hạn",
    tone: "warning" as const,
    detail:
      "37 giấy phép sẽ hết hiệu lực trong 30 ngày tới, tập trung tại Trảng Bàng và Gò Dầu.",
    items: [
      "GP-2026-014 — Công ty TNHH Công nghiệp Tây Ninh — hết hạn 12/09/2026",
      "GP-2026-031 — Công ty CP Cơ khí Đông Nam — hết hạn 18/09/2026",
      "GP-2025-208 — Công ty TNHH Thương mại Minh Long — hết hạn 25/09/2026",
    ],
  },
  {
    id: "al-2",
    value: 12,
    label: "Hồ sơ chờ phê duyệt",
    tone: "gov" as const,
    detail: "12 bộ dữ liệu đang chờ lãnh đạo phòng phê duyệt trước khi khóa kỳ.",
    items: [
      "Báo cáo sản xuất công nghiệp T6/2026 — Phòng QLCN",
      "Cập nhật hồ sơ CCN Bến Cầu — Phòng QLCN",
      "Danh mục sản phẩm chủ lực 2026 — Phòng QLTM",
    ],
  },
  {
    id: "al-3",
    value: 8,
    label: "Bộ dữ liệu có lỗi",
    tone: "danger" as const,
    detail: "8 bộ dữ liệu không đạt kiểm tra chất lượng (sai mã chuẩn, thiếu trường bắt buộc).",
    items: [
      "DS doanh nghiệp XNK — sai định dạng mã HS (46 bản ghi)",
      "Hồ sơ năng lượng mặt trời mái nhà — thiếu công suất (23 bản ghi)",
    ],
  },
  {
    id: "al-4",
    value: 4,
    label: "Nhiệm vụ chậm tiến độ",
    tone: "warning" as const,
    detail: "4 nhiệm vụ số hóa quá hạn so với kế hoạch quý II/2026.",
    items: ["Số hóa hồ sơ CCN Tân Biên", "Điều tra năng lượng đợt 2 — huyện Châu Thành"],
  },
  {
    id: "al-5",
    value: 3,
    label: "API tích hợp bất thường",
    tone: "danger" as const,
    detail: "3 API có tỷ lệ lỗi vượt ngưỡng 5% trong 24 giờ qua.",
    items: ["CSDL chuyên ngành /industry/sync — 8,4% lỗi", "Cổng DVC /dvc/status — 6,1% lỗi"],
  },
];

export const ENTERPRISES: Enterprise[] = [
  {
    id: "dn-001",
    name: "Công ty TNHH Công nghiệp Tây Ninh",
    taxCode: "3901234567",
    sector: "Cơ khí",
    district: "Trảng Bàng",
    address: "Lô A2, CCN Trảng Bàng, Tây Ninh",
    representative: "Nguyễn Văn Bình",
    employees: 620,
    revenue: 1240,
    status: "active",
    dataStatus: "approved",
    updatedAt: "05/08/2026",
    source: "Sở Công Thương",
    owner: "Phòng Quản lý công nghiệp",
    links: {
      facilities: 3,
      products: 12,
      licenses: 5,
      projects: 2,
      energy: 1,
      trades: 24,
      documents: 36,
    },
  },
  {
    id: "dn-002",
    name: "Công ty CP Năng lượng Mặt Trời Tây Ninh",
    taxCode: "3901987654",
    sector: "Năng lượng",
    district: "Tân Biên",
    address: "Ấp Thạnh Đông, Tân Biên, Tây Ninh",
    representative: "Trần Thị Hoa",
    employees: 145,
    revenue: 890,
    status: "active",
    dataStatus: "locked",
    updatedAt: "01/08/2026",
    source: "Điều tra năng lượng 2026",
    owner: "Phòng Quản lý năng lượng",
    links: {
      facilities: 2,
      products: 3,
      licenses: 4,
      projects: 5,
      energy: 6,
      trades: 4,
      documents: 21,
    },
  },
  {
    id: "dn-003",
    name: "Công ty TNHH Chế biến Nông sản Thành Công",
    taxCode: "3901445566",
    sector: "Chế biến nông sản",
    district: "Gò Dầu",
    address: "KP.2, thị trấn Gò Dầu, Tây Ninh",
    representative: "Lê Minh Thành",
    employees: 410,
    revenue: 720,
    status: "active",
    dataStatus: "pending",
    updatedAt: "28/07/2026",
    source: "Doanh nghiệp tự khai",
    owner: "Phòng Quản lý thương mại",
    links: {
      facilities: 4,
      products: 18,
      licenses: 6,
      projects: 1,
      energy: 1,
      trades: 32,
      documents: 44,
    },
  },
  {
    id: "dn-004",
    name: "Công ty CP Cơ khí Đông Nam",
    taxCode: "3901778899",
    sector: "Cơ khí",
    district: "Bến Cầu",
    address: "Lô C7, CCN Bến Cầu, Tây Ninh",
    representative: "Phạm Quốc Hùng",
    employees: 285,
    revenue: 505,
    status: "active",
    dataStatus: "need_more",
    updatedAt: "22/07/2026",
    source: "LGSP - Đăng ký kinh doanh",
    owner: "Phòng Quản lý công nghiệp",
    links: {
      facilities: 2,
      products: 9,
      licenses: 3,
      projects: 1,
      energy: 0,
      trades: 15,
      documents: 18,
    },
  },
  {
    id: "dn-005",
    name: "Công ty TNHH Thương mại Minh Long",
    taxCode: "3901223344",
    sector: "Thương mại",
    district: "TP. Tây Ninh",
    address: "128 Cách Mạng Tháng Tám, TP. Tây Ninh",
    representative: "Đỗ Thị Minh",
    employees: 96,
    revenue: 318,
    status: "active",
    dataStatus: "approved",
    updatedAt: "03/08/2026",
    source: "Sở Công Thương",
    owner: "Phòng Quản lý thương mại",
    links: {
      facilities: 1,
      products: 24,
      licenses: 4,
      projects: 0,
      energy: 0,
      trades: 41,
      documents: 12,
    },
  },
  {
    id: "dn-006",
    name: "Công ty TNHH Dệt may Châu Thành",
    taxCode: "3901556677",
    sector: "Dệt may",
    district: "Châu Thành",
    address: "Lô B1, CCN Châu Thành, Tây Ninh",
    representative: "Vũ Hải Nam",
    employees: 1180,
    revenue: 1610,
    status: "active",
    dataStatus: "approved",
    updatedAt: "30/07/2026",
    source: "Sở Công Thương",
    owner: "Phòng Quản lý công nghiệp",
    links: {
      facilities: 5,
      products: 15,
      licenses: 7,
      projects: 3,
      energy: 2,
      trades: 58,
      documents: 63,
    },
  },
  {
    id: "dn-007",
    name: "Công ty CP Cao su Tây Ninh Phát",
    taxCode: "3901889900",
    sector: "Cao su",
    district: "Tân Biên",
    address: "Ấp Hoà Bình, Tân Biên, Tây Ninh",
    representative: "Ngô Văn Phát",
    employees: 540,
    revenue: 980,
    status: "active",
    dataStatus: "locked",
    updatedAt: "18/07/2026",
    source: "Điều tra công nghiệp 2026",
    owner: "Phòng Quản lý công nghiệp",
    links: {
      facilities: 3,
      products: 7,
      licenses: 5,
      projects: 2,
      energy: 1,
      trades: 29,
      documents: 27,
    },
  },
  {
    id: "dn-008",
    name: "Công ty TNHH Điện tử Trảng Bàng",
    taxCode: "3901334455",
    sector: "Điện tử",
    district: "Trảng Bàng",
    address: "Lô D4, CCN Trảng Bàng, Tây Ninh",
    representative: "Bùi Anh Tuấn",
    employees: 830,
    revenue: 1430,
    status: "suspended",
    dataStatus: "checking",
    updatedAt: "12/07/2026",
    source: "Doanh nghiệp tự khai",
    owner: "Phòng Quản lý công nghiệp",
    links: {
      facilities: 2,
      products: 11,
      licenses: 4,
      projects: 1,
      energy: 1,
      trades: 36,
      documents: 33,
    },
  },
];

export const CLUSTERS: Cluster[] = [
  {
    id: "ccn-01",
    name: "Cụm công nghiệp Trảng Bàng",
    district: "Trảng Bàng",
    area: 190,
    leased: 152,
    enterprises: 42,
    sectors: "Cơ khí – Điện tử – Chế biến",
    occupancy: 80,
    status: "locked",
    x: 30,
    y: 68,
    infrastructure: [
      { name: "Giao thông", level: 92, note: "Kết nối QL22, đường nội bộ 4 làn" },
      { name: "Điện", level: 95, note: "Trạm 110kV, cấp điện ổn định" },
      { name: "Nước", level: 88, note: "Công suất 12.000 m³/ngày đêm" },
      { name: "Viễn thông", level: 90, note: "Cáp quang 3 nhà mạng" },
      { name: "Thoát nước", level: 76, note: "Hệ thống riêng nước mưa/nước thải" },
      { name: "Xử lý nước thải", level: 82, note: "Nhà máy XLNT 6.000 m³/ngày" },
    ],
  },
  {
    id: "ccn-02",
    name: "Cụm công nghiệp Bến Cầu",
    district: "Bến Cầu",
    area: 120,
    leased: 66,
    enterprises: 18,
    sectors: "Cơ khí – Dệt may",
    occupancy: 55,
    status: "approved",
    x: 18,
    y: 52,
    infrastructure: [
      { name: "Giao thông", level: 74, note: "Kết nối ĐT786" },
      { name: "Điện", level: 80, note: "Trạm 22kV" },
      { name: "Nước", level: 70, note: "Công suất 5.000 m³/ngày đêm" },
      { name: "Viễn thông", level: 78, note: "Cáp quang 2 nhà mạng" },
      { name: "Thoát nước", level: 62, note: "Đang nâng cấp giai đoạn 2" },
      { name: "Xử lý nước thải", level: 58, note: "XLNT 2.500 m³/ngày" },
    ],
  },
  {
    id: "ccn-03",
    name: "Cụm công nghiệp Gò Dầu",
    district: "Gò Dầu",
    area: 145,
    leased: 108,
    enterprises: 31,
    sectors: "Chế biến nông sản – Cao su",
    occupancy: 74,
    status: "locked",
    x: 42,
    y: 58,
    infrastructure: [
      { name: "Giao thông", level: 86, note: "Cạnh QL22B" },
      { name: "Điện", level: 90, note: "Trạm 110kV" },
      { name: "Nước", level: 84, note: "Công suất 9.000 m³/ngày đêm" },
      { name: "Viễn thông", level: 85, note: "Cáp quang 3 nhà mạng" },
      { name: "Thoát nước", level: 72, note: "Đã tách dòng" },
      { name: "Xử lý nước thải", level: 78, note: "XLNT 4.000 m³/ngày" },
    ],
  },
  {
    id: "ccn-04",
    name: "Cụm công nghiệp Tân Biên",
    district: "Tân Biên",
    area: 98,
    leased: 41,
    enterprises: 12,
    sectors: "Năng lượng – Chế biến",
    occupancy: 42,
    status: "pending",
    x: 34,
    y: 22,
    infrastructure: [
      { name: "Giao thông", level: 64, note: "Đang mở rộng đường vào" },
      { name: "Điện", level: 88, note: "Gần nguồn điện mặt trời" },
      { name: "Nước", level: 60, note: "Công suất 3.000 m³/ngày đêm" },
      { name: "Viễn thông", level: 70, note: "Cáp quang 2 nhà mạng" },
      { name: "Thoát nước", level: 55, note: "Giai đoạn đầu tư" },
      { name: "Xử lý nước thải", level: 48, note: "Đang xây dựng" },
    ],
  },
  {
    id: "ccn-05",
    name: "Cụm công nghiệp Châu Thành",
    district: "Châu Thành",
    area: 132,
    leased: 95,
    enterprises: 24,
    sectors: "Dệt may – Cơ khí",
    occupancy: 72,
    status: "approved",
    x: 56,
    y: 40,
    infrastructure: [
      { name: "Giao thông", level: 80, note: "Kết nối ĐT781" },
      { name: "Điện", level: 86, note: "Trạm 110kV" },
      { name: "Nước", level: 79, note: "Công suất 7.000 m³/ngày đêm" },
      { name: "Viễn thông", level: 82, note: "Cáp quang 3 nhà mạng" },
      { name: "Thoát nước", level: 70, note: "Hoàn thiện 80%" },
      { name: "Xử lý nước thải", level: 74, note: "XLNT 3.500 m³/ngày" },
    ],
  },
  {
    id: "ccn-06",
    name: "Cụm công nghiệp Thành phố Tây Ninh",
    district: "TP. Tây Ninh",
    area: 76,
    leased: 68,
    enterprises: 27,
    sectors: "Thương mại – Điện tử",
    occupancy: 89,
    status: "locked",
    x: 68,
    y: 62,
    infrastructure: [
      { name: "Giao thông", level: 94, note: "Trung tâm đô thị" },
      { name: "Điện", level: 96, note: "Nguồn kép" },
      { name: "Nước", level: 92, note: "Cấp nước đô thị" },
      { name: "Viễn thông", level: 95, note: "Cáp quang 4 nhà mạng" },
      { name: "Thoát nước", level: 88, note: "Đồng bộ đô thị" },
      { name: "Xử lý nước thải", level: 85, note: "Đấu nối NM XLNT TP" },
    ],
  },
];

export const SURVEYS: SurveyRecord[] = [
  { id: "PDT-2026-001", subject: "Công ty TNHH Công nghiệp Tây Ninh", district: "Trảng Bàng", officer: "Lê Văn Cường", date: "12/06/2026", status: "approved" },
  { id: "PDT-2026-002", subject: "Công ty CP Năng lượng Mặt Trời Tây Ninh", district: "Tân Biên", officer: "Trần Thị Hạnh", date: "15/06/2026", status: "reviewed" },
  { id: "PDT-2026-003", subject: "Hộ SXKD Nguyễn Văn Tám", district: "Gò Dầu", officer: "Phạm Đức Duy", date: "20/06/2026", status: "need_more" },
  { id: "PDT-2026-004", subject: "Công ty TNHH Dệt may Châu Thành", district: "Châu Thành", officer: "Lê Văn Cường", date: "28/06/2026", status: "doing" },
  { id: "PDT-2026-005", subject: "Công ty CP Cao su Tây Ninh Phát", district: "Tân Biên", officer: "Nguyễn Thị Lan", date: "02/07/2026", status: "new" },
  { id: "PDT-2026-006", subject: "Công ty CP Cơ khí Đông Nam", district: "Bến Cầu", officer: "Phạm Đức Duy", date: "08/07/2026", status: "approved" },
];

export const ENERGY_SOURCES: EnergySource[] = [
  { id: "NL-01", name: "Điện mặt trời Tân Biên 1", type: "Điện mặt trời", capacity: 120, output: 168, district: "Tân Biên", status: "locked" },
  { id: "NL-02", name: "Điện mặt trời mái nhà CCN Trảng Bàng", type: "ĐMT mái nhà", capacity: 32, output: 41, district: "Trảng Bàng", status: "approved" },
  { id: "NL-03", name: "Nhà máy điện sinh khối Gò Dầu", type: "Sinh khối", capacity: 45, output: 260, district: "Gò Dầu", status: "approved" },
  { id: "NL-04", name: "Thủy điện nhỏ Châu Thành", type: "Thủy điện", capacity: 12, output: 48, district: "Châu Thành", status: "pending" },
  { id: "NL-05", name: "Điện rác Bến Cầu", type: "Điện rác", capacity: 18, output: 96, district: "Bến Cầu", status: "checking" },
];

export const ENERGY_TREND = [
  { month: "T1", output: 412, capacity: 205 },
  { month: "T2", output: 398, capacity: 208 },
  { month: "T3", output: 452, capacity: 214 },
  { month: "T4", output: 478, capacity: 219 },
  { month: "T5", output: 502, capacity: 224 },
  { month: "T6", output: 531, capacity: 227 },
];

export const PRODUCTS: ProductRecord[] = [
  { id: "SP-01", name: "Cao su khối SVR 3L", group: "Cao su", market: "Trung Quốc, EU", standard: "TCVN 3769", certificate: "ISO 9001", trend: 4.2, status: "approved" },
  { id: "SP-02", name: "Kết cấu thép công nghiệp", group: "Sản phẩm cơ khí", market: "Hoa Kỳ, Nhật Bản", standard: "ASTM A36", certificate: "ISO 3834", trend: 2.6, status: "locked" },
  { id: "SP-03", name: "Bo mạch điện tử dân dụng", group: "Điện tử", market: "Hàn Quốc, ASEAN", standard: "IPC-A-610", certificate: "ISO 14001", trend: -1.4, status: "approved" },
  { id: "SP-04", name: "Tinh bột khoai mì", group: "Nông sản chế biến", market: "Trung Quốc, EU", standard: "TCVN 10546", certificate: "HACCP", trend: 6.8, status: "locked" },
  { id: "SP-05", name: "Vải dệt kim", group: "Dệt may", market: "EU, Hoa Kỳ", standard: "OEKO-TEX", certificate: "BSCI", trend: 1.1, status: "pending" },
  { id: "SP-06", name: "Hạt điều nhân", group: "Nông sản chế biến", market: "Hoa Kỳ, EU", standard: "TCVN 4850", certificate: "HACCP", trend: -3.2, status: "need_more" },
];

export const PRICE_TREND = [
  { month: "T1", caosu: 38.2, nongsan: 12.4, detmay: 26.1 },
  { month: "T2", caosu: 39.1, nongsan: 12.9, detmay: 25.8 },
  { month: "T3", caosu: 41.4, nongsan: 13.6, detmay: 26.7 },
  { month: "T4", caosu: 40.8, nongsan: 14.2, detmay: 27.4 },
  { month: "T5", caosu: 42.6, nongsan: 14.8, detmay: 27.1 },
  { month: "T6", caosu: 44.1, nongsan: 15.4, detmay: 28.3 },
];

export const TRADES: TradeRecord[] = [
  { id: "TR-01", hs: "4001.21", name: "Cao su tự nhiên", enterprise: "Công ty CP Cao su Tây Ninh Phát", market: "Trung Quốc", exportValue: 128.4, importValue: 4.2, period: "Quý II/2026" },
  { id: "TR-02", hs: "8479.89", name: "Máy móc cơ khí", enterprise: "Công ty CP Cơ khí Đông Nam", market: "Hoa Kỳ", exportValue: 86.1, importValue: 32.7, period: "Quý II/2026" },
  { id: "TR-03", hs: "8534.00", name: "Bảng mạch in", enterprise: "Công ty TNHH Điện tử Trảng Bàng", market: "Hàn Quốc", exportValue: 174.5, importValue: 91.3, period: "Quý II/2026" },
  { id: "TR-04", hs: "1108.14", name: "Tinh bột sắn", enterprise: "Công ty TNHH Chế biến Nông sản Thành Công", market: "EU", exportValue: 64.8, importValue: 1.1, period: "Quý II/2026" },
  { id: "TR-05", hs: "6006.32", name: "Vải dệt kim", enterprise: "Công ty TNHH Dệt may Châu Thành", market: "EU", exportValue: 142.9, importValue: 58.6, period: "Quý II/2026" },
  { id: "TR-06", hs: "8541.43", name: "Tấm pin mặt trời", enterprise: "Công ty CP Năng lượng Mặt Trời Tây Ninh", market: "ASEAN", exportValue: 39.2, importValue: 74.5, period: "Quý II/2026" },
];

export const TRADE_TREND = [
  { month: "T1", xk: 182, nk: 121 },
  { month: "T2", xk: 168, nk: 118 },
  { month: "T3", xk: 205, nk: 134 },
  { month: "T4", xk: 214, nk: 142 },
  { month: "T5", xk: 228, nk: 139 },
  { month: "T6", xk: 246, nk: 151 },
];

export const PROMOTIONS: PromotionProgram[] = [
  { id: "XT-01", name: "Hội chợ Công Thương khu vực Đông Nam Bộ 2026", organizer: "Sở Công Thương", time: "12–16/05/2026", enterprises: 86, budget: 2400, result: "412 hợp đồng ghi nhớ", status: "locked", kind: "Hội chợ" },
  { id: "XT-02", name: "Triển lãm sản phẩm công nghiệp nông thôn tiêu biểu", organizer: "Trung tâm Khuyến công", time: "08–12/06/2026", enterprises: 54, budget: 1250, result: "178 kết nối", status: "approved", kind: "Triển lãm" },
  { id: "XT-03", name: "Hội nghị kết nối giao thương Việt Nam – EU", organizer: "Sở Công Thương", time: "20/06/2026", enterprises: 32, budget: 780, result: "24 biên bản hợp tác", status: "approved", kind: "Kết nối giao thương" },
  { id: "XT-04", name: "Chương trình khuyến mại tập trung quý III/2026", organizer: "Phòng QLTM", time: "01/07–30/09/2026", enterprises: 148, budget: 620, result: "Đang triển khai", status: "pending", kind: "Khuyến mại" },
];

export const MASTER_RECORDS: MasterRecord[] = [
  { id: "MD-001", type: "Doanh nghiệp", name: "Danh mục doanh nghiệp ngành Công Thương", source: "LGSP – ĐKKD", owner: "Phòng QLCN", updatedAt: "05/08/2026", status: "locked" },
  { id: "MD-002", type: "Cơ sở SXKD", name: "Danh mục cơ sở sản xuất kinh doanh", source: "Điều tra 2026", owner: "Phòng QLCN", updatedAt: "02/08/2026", status: "approved" },
  { id: "MD-003", type: "Sản phẩm", name: "Danh mục sản phẩm công nghiệp", source: "Nhập liệu nội bộ", owner: "Phòng QLTM", updatedAt: "30/07/2026", status: "pending" },
  { id: "MD-004", type: "Giấy phép", name: "CSDL giấy phép ngành", source: "Cổng DVC", owner: "Văn phòng Sở", updatedAt: "04/08/2026", status: "approved" },
  { id: "MD-005", type: "Địa bàn", name: "Danh mục đơn vị hành chính", source: "NDXP", owner: "Trung tâm CNTT", updatedAt: "01/07/2026", status: "locked" },
  { id: "MD-006", type: "Năng lượng", name: "Hồ sơ nguồn năng lượng", source: "Điều tra năng lượng", owner: "Phòng QLNL", updatedAt: "28/07/2026", status: "checking" },
  { id: "MD-007", type: "Tài liệu", name: "Kho tài liệu số hóa", source: "OCR/AI", owner: "Trung tâm CNTT", updatedAt: "06/08/2026", status: "draft" },
];

export const QUALITY_ISSUES: QualityIssue[] = [
  { id: "Q-01", field: "Mã số thuế", issue: "Sai định dạng", records: 46, severity: "Cao", assignee: "Nguyễn Thị Lan", status: "checking" },
  { id: "Q-02", field: "Ngành nghề kinh doanh", issue: "Sai mã chuẩn VSIC", records: 128, severity: "Trung bình", assignee: "Phạm Đức Duy", status: "need_more" },
  { id: "Q-03", field: "Địa chỉ cơ sở", issue: "Thiếu dữ liệu", records: 89, severity: "Trung bình", assignee: "Lê Văn Cường", status: "checking" },
  { id: "Q-04", field: "Tên doanh nghiệp", issue: "Trùng bản ghi", records: 34, severity: "Cao", assignee: "Trần Thị Hạnh", status: "pending" },
  { id: "Q-05", field: "Công suất thiết kế", issue: "Thiếu dữ liệu", records: 23, severity: "Thấp", assignee: "Nguyễn Thị Lan", status: "approved" },
];

export const WORKFLOW_ITEMS: WorkflowItem[] = [
  {
    id: "WF-01", name: "Báo cáo sản xuất công nghiệp T6/2026", unit: "Phòng QLCN", updatedBy: "Nguyễn Thị Lan", time: "06/08/2026 08:12", source: "Nhập liệu", stage: "new",
    history: [{ actor: "Nguyễn Thị Lan", role: "Chuyên viên", action: "Tạo bộ dữ liệu", time: "06/08/2026 08:12" }],
  },
  {
    id: "WF-02", name: "Cập nhật hồ sơ CCN Bến Cầu", unit: "Phòng QLCN", updatedBy: "Phạm Đức Duy", time: "05/08/2026 15:40", source: "OCR/AI", stage: "checking",
    history: [
      { actor: "Phạm Đức Duy", role: "Chuyên viên", action: "Trích xuất OCR/AI", time: "05/08/2026 14:02" },
      { actor: "Trần Thị Hạnh", role: "Kiểm tra viên", action: "Đang kiểm tra chất lượng", time: "05/08/2026 15:40" },
    ],
  },
  {
    id: "WF-03", name: "Danh mục sản phẩm chủ lực 2026", unit: "Phòng QLTM", updatedBy: "Đỗ Thị Minh", time: "04/08/2026 09:25", source: "Nhập liệu", stage: "pending",
    history: [
      { actor: "Đỗ Thị Minh", role: "Chuyên viên", action: "Cập nhật dữ liệu", time: "03/08/2026 10:11" },
      { actor: "Lê Văn Cường", role: "Kiểm duyệt", action: "Đã kiểm duyệt, trình phê duyệt", time: "04/08/2026 09:25" },
    ],
  },
  {
    id: "WF-04", name: "Số liệu xuất nhập khẩu quý II/2026", unit: "Phòng QLTM", updatedBy: "Vũ Hải Nam", time: "02/08/2026 16:30", source: "NDXP", stage: "approved",
    history: [
      { actor: "Vũ Hải Nam", role: "Chuyên viên", action: "Đồng bộ từ NDXP", time: "01/08/2026 07:00" },
      { actor: "Lê Văn Cường", role: "Kiểm duyệt", action: "Kiểm duyệt đạt", time: "02/08/2026 11:20" },
      { actor: "Nguyễn Văn A", role: "Lãnh đạo Sở", action: "Phê duyệt", time: "02/08/2026 16:30" },
    ],
  },
  {
    id: "WF-05", name: "Hồ sơ năng lượng quý I/2026", unit: "Phòng QLNL", updatedBy: "Trần Thị Hoa", time: "12/07/2026 10:05", source: "Điều tra", stage: "locked",
    history: [
      { actor: "Trần Thị Hoa", role: "Cán bộ điều tra", action: "Nhập phiếu điều tra", time: "20/06/2026 09:00" },
      { actor: "Lê Văn Cường", role: "Kiểm duyệt", action: "Kiểm duyệt đạt", time: "05/07/2026 14:12" },
      { actor: "Nguyễn Văn A", role: "Lãnh đạo Sở", action: "Phê duyệt", time: "10/07/2026 08:40" },
      { actor: "Hệ thống", role: "Tự động", action: "Khóa kỳ báo cáo", time: "12/07/2026 10:05" },
    ],
  },
];

export const INTEGRATIONS: IntegrationRow[] = [
  { id: "IN-01", system: "LGSP", api: "/lgsp/enterprise/sync", lastSync: "06/08/2026 06:00", success: 12840, failed: 12, latency: 182, status: "connected" },
  { id: "IN-02", system: "NDXP", api: "/ndxp/trade/statistics", lastSync: "06/08/2026 05:30", success: 8420, failed: 5, latency: 240, status: "connected" },
  { id: "IN-03", system: "QLVBĐH", api: "/qlvb/document/push", lastSync: "06/08/2026 07:15", success: 3260, failed: 2, latency: 128, status: "connected" },
  { id: "IN-04", system: "Cổng DVC", api: "/dvc/status", lastSync: "06/08/2026 07:40", success: 5410, failed: 351, latency: 410, status: "connected" },
  { id: "IN-05", system: "CSDL chuyên ngành", api: "/industry/sync", lastSync: "05/08/2026 22:10", success: 1920, failed: 176, latency: 620, status: "limited" },
];

export const INTEGRATION_CARDS = [
  { name: "LGSP", desc: "Nền tảng tích hợp chia sẻ dữ liệu cấp tỉnh", state: "CONNECTED" as const },
  { name: "NDXP", desc: "Nền tảng tích hợp chia sẻ dữ liệu quốc gia", state: "CONNECTED" as const },
  { name: "QLVBĐH", desc: "Hệ thống quản lý văn bản và điều hành", state: "CONNECTED" as const },
  { name: "Cổng DVC", desc: "Cổng dịch vụ công trực tuyến", state: "CONNECTED" as const },
  { name: "CSDL chuyên ngành", desc: "Cơ sở dữ liệu chuyên ngành Bộ Công Thương", state: "LIMITED" as const },
];

export const USERS: UserRow[] = [
  { id: "U-01", name: "Nguyễn Văn A", account: "nguyenvana", unit: "Ban Giám đốc Sở", role: "Lãnh đạo Sở", lastLogin: "06/08/2026 07:42", status: "active" },
  { id: "U-02", name: "Lê Văn Cường", account: "levancuong", unit: "Phòng QLCN", role: "Lãnh đạo phòng", lastLogin: "06/08/2026 07:05", status: "active" },
  { id: "U-03", name: "Nguyễn Thị Lan", account: "nguyenthilan", unit: "Phòng QLCN", role: "Chuyên viên", lastLogin: "05/08/2026 16:20", status: "active" },
  { id: "U-04", name: "Phạm Đức Duy", account: "phamducduy", unit: "Trung tâm CNTT", role: "Cán bộ GIS", lastLogin: "05/08/2026 14:11", status: "active" },
  { id: "U-05", name: "Trần Thị Hạnh", account: "tranthihanh", unit: "Phòng QLNL", role: "Cán bộ điều tra", lastLogin: "04/08/2026 09:34", status: "active" },
  { id: "U-06", name: "Vũ Hải Nam", account: "vuhainam", unit: "Phòng QLTM", role: "Chuyên viên", lastLogin: "03/08/2026 10:02", status: "locked" },
];

export const AUDIT_LOGS: AuditRow[] = [
  { id: "L-01", time: "06/08/2026 08:32", user: "Nguyễn Văn A", action: "APPROVE", module: "Giấy phép", object: "GP-2026-001", ip: "10.1.1.15", result: "SUCCESS" },
  { id: "L-02", time: "06/08/2026 08:14", user: "Nguyễn Thị Lan", action: "CREATE", module: "Quản trị dữ liệu", object: "WF-01", ip: "10.1.2.42", result: "SUCCESS" },
  { id: "L-03", time: "06/08/2026 07:58", user: "Phạm Đức Duy", action: "UPDATE", module: "GIS", object: "CCN Bến Cầu", ip: "10.1.2.51", result: "SUCCESS" },
  { id: "L-04", time: "05/08/2026 22:10", user: "system", action: "SYNC", module: "Tích hợp", object: "/industry/sync", ip: "10.1.0.9", result: "FAILED" },
  { id: "L-05", time: "05/08/2026 16:40", user: "Lê Văn Cường", action: "REJECT", module: "Workflow", object: "WF-02", ip: "10.1.1.22", result: "SUCCESS" },
  { id: "L-06", time: "05/08/2026 09:12", user: "Vũ Hải Nam", action: "LOGIN", module: "Hệ thống", object: "web", ip: "10.1.3.77", result: "FAILED" },
];

export const REPORTS = [
  { id: "BC-01", name: "Báo cáo tình hình sản xuất công nghiệp tháng", period: "Tháng 7/2026", unit: "Phòng QLCN", format: "DOCX", status: "locked" as const },
  { id: "BC-02", name: "Báo cáo xuất nhập khẩu quý", period: "Quý II/2026", unit: "Phòng QLTM", format: "XLSX", status: "approved" as const },
  { id: "BC-03", name: "Báo cáo cụm công nghiệp", period: "6 tháng đầu 2026", unit: "Phòng QLCN", format: "PDF", status: "approved" as const },
  { id: "BC-04", name: "Báo cáo năng lượng và tiết kiệm năng lượng", period: "Quý II/2026", unit: "Phòng QLNL", format: "DOCX", status: "pending" as const },
  { id: "BC-05", name: "Báo cáo xúc tiến thương mại", period: "6 tháng đầu 2026", unit: "TT Khuyến công", format: "PDF", status: "approved" as const },
];

export const TASKS = [
  { id: "T-01", name: "Phê duyệt báo cáo sản xuất công nghiệp T6/2026", due: "Hôm nay", tone: "warning" as const },
  { id: "T-02", name: "Kiểm tra 46 bản ghi sai định dạng mã số thuế", due: "08/08/2026", tone: "danger" as const },
  { id: "T-03", name: "Rà soát 37 giấy phép sắp hết hạn", due: "10/08/2026", tone: "warning" as const },
  { id: "T-04", name: "Cập nhật hạ tầng CCN Tân Biên", due: "12/08/2026", tone: "gov" as const },
];

export const DRILLDOWN = {
  province: { name: "Tỉnh Tây Ninh", enterprises: 2486, revenue: 18420 },
  districts: [
    { name: "Trảng Bàng", enterprises: 684, revenue: 6120 },
    { name: "Gò Dầu", enterprises: 412, revenue: 3180 },
    { name: "Châu Thành", enterprises: 386, revenue: 2940 },
    { name: "Bến Cầu", enterprises: 248, revenue: 1620 },
    { name: "Tân Biên", enterprises: 296, revenue: 2010 },
    { name: "TP. Tây Ninh", enterprises: 460, revenue: 2550 },
  ],
};

// Kết quả trích xuất AI (mock) cho màn hình OCR/AI
export const OCR_EXTRACTION = [
  { field: "Tên đơn vị báo cáo", value: "Sở Công Thương Tây Ninh", confidence: 98 },
  { field: "Kỳ báo cáo", value: "Tháng 6 năm 2026", confidence: 97 },
  { field: "Chỉ số sản xuất công nghiệp (IIP)", value: "113,6%", confidence: 95 },
  { field: "Giá trị sản xuất công nghiệp", value: "10.680 tỷ đồng", confidence: 94 },
  { field: "Số doanh nghiệp hoạt động", value: "2.486", confidence: 96 },
  { field: "Kim ngạch xuất khẩu", value: "246 triệu USD", confidence: 92 },
  { field: "Kim ngạch nhập khẩu", value: "151 triệu USD", confidence: 91 },
  { field: "Sản lượng điện thương phẩm", value: "531 triệu kWh", confidence: 89 },
];

export const ARCHITECTURE_LAYERS = [
  {
    name: "Lớp thu nhận dữ liệu",
    desc: "Số hóa hồ sơ giấy, nhập liệu trực tuyến, biểu mẫu điều tra, tiếp nhận từ hệ thống ngoài.",
    items: ["OCR/AI bóc tách", "Form nhập liệu", "Điều tra hiện trường", "API/ETL"],
  },
  {
    name: "Lớp chuẩn hóa & quản trị dữ liệu",
    desc: "Chuẩn hóa danh mục dùng chung, đối soát trùng lặp, kiểm tra chất lượng, gán phiên bản dữ liệu.",
    items: ["Master Data", "Data Quality", "Mapping danh mục", "Versioning"],
  },
  {
    name: "Lớp phê duyệt & bảo mật",
    desc: "Workflow trình – duyệt – khóa kỳ, phân quyền theo vai trò và địa bàn, lưu vết toàn bộ thao tác.",
    items: ["Workflow", "RBAC theo địa bàn", "Audit log", "Khóa kỳ báo cáo"],
  },
  {
    name: "Lớp CSDL ngành dùng chung",
    desc: "Hồ sơ số cốt lõi về doanh nghiệp, cơ sở SXKD, sản phẩm, giấy phép, dự án, cụm công nghiệp, năng lượng.",
    items: ["Doanh nghiệp", "Cụm công nghiệp", "Giấy phép", "Năng lượng", "Sản phẩm"],
  },
  {
    name: "Lớp khai thác & điều hành",
    desc: "Dashboard lãnh đạo, BI drill-down, GIS, kho báo cáo tự động và cổng tra cứu công khai.",
    items: ["Dashboard", "BI/Drill-down", "GIS", "Kho báo cáo", "Cổng công khai"],
  },
];

export const PLATFORM_PRINCIPLES = [
  {
    title: "Nhập một lần – dùng nhiều nơi",
    desc: "Mỗi dữ liệu chỉ được nhập và chuẩn hóa một lần tại phân hệ chủ quản, sau đó chia sẻ cho toàn bộ phân hệ nghiệp vụ và báo cáo, tránh trùng lặp và số liệu lệch nhau.",
  },
  {
    title: "Chỉ số liệu đã phê duyệt mới lên báo cáo",
    desc: "Dữ liệu phải đi qua vòng đời Nhập – Chuẩn hóa – Trình duyệt – Phê duyệt – Khóa kỳ. Báo cáo điều hành chỉ lấy dữ liệu ở trạng thái đã phê duyệt hoặc đã khóa kỳ.",
  },
  {
    title: "Phân quyền theo vai trò và địa bàn",
    desc: "Mỗi vai trò chỉ thấy đúng phân hệ và phạm vi địa bàn được giao. Mọi thao tác thêm, sửa, duyệt đều được lưu vết phục vụ kiểm tra, thanh tra.",
  },
];
