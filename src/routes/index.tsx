import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  Building2,
  CalendarRange,
  ChevronRight,
  FileCheck2,
  Gauge,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Map as MapIcon,
  RefreshCw,
  ShieldCheck,
  Ship,
  Store,
  Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ClusterMap } from "@/components/common/ClusterMap";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardModule, KpiMiniCard } from "@/components/dashboard/DashboardModule";
import { MiniBarChart, MiniDonutChart, MiniTrendChart } from "@/components/dashboard/MiniCharts";
import { AlertItem, ProgressMetric, TaskItem } from "@/components/dashboard/Metrics";
import { cn } from "@/lib/utils";
import { DISTRICTS, LIFECYCLE_STEPS, PERIODS } from "@/lib/constants";
import {
  CLUSTERS,
  DATA_STATE_CHART,
  PRICE_TREND,
  PROMOTIONS,
  SECTOR_CHART,
  TASKS,
  TRADE_TREND,
} from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tổng quan ngành Công Thương | Nền tảng số hóa dữ liệu ngành Công Thương" },
      {
        name: "description",
        content:
          "Trung tâm điều hành dữ liệu ngành Công Thương — toàn cảnh các phân hệ CSDL, GIS, năng lượng, thị trường, xuất nhập khẩu, xúc tiến thương mại.",
      },
      { property: "og:title", content: "Tổng quan ngành Công Thương" },
      {
        property: "og:description",
        content:
          "Trung tâm điều hành dữ liệu ngành Công Thương — bản đồ phân hệ + số liệu tổng hợp.",
      },
    ],
  }),
  component: OverviewPage,
});

const PIE_COLORS = ["var(--success)", "var(--gov)", "var(--warning)", "var(--destructive)"];
const ACTIVE_LIFECYCLE_STEP = 7; // Khóa kỳ

const ENERGY_PROGRESS = [
  { name: "Điện mặt trời", v: 78 },
  { name: "Sinh khối", v: 64 },
  { name: "Điện rác", v: 45 },
];

const LICENSE_STATUS = [
  { label: "Hiệu lực", v: "1.827", cls: "text-success" },
  { label: "Sắp hết hạn", v: "37", cls: "text-warning" },
  { label: "Hết hạn", v: "96", cls: "text-muted-foreground" },
];

const OPERATION_ALERTS = [
  { count: 37, label: "Giấy phép sắp hết hạn", tone: "warning" as const },
  { count: 12, label: "Hồ sơ chờ phê duyệt", tone: "gov" as const },
  { count: 8, label: "Bộ dữ liệu có lỗi", tone: "danger" as const },
  { count: 4, label: "Nhiệm vụ chậm tiến độ", tone: "orange" as const },
  { count: 3, label: "API tích hợp bất thường", tone: "danger" as const },
];

const DIGITIZATION = [
  { label: "Hồ sơ doanh nghiệp", v: 92 },
  { label: "Cụm công nghiệp", v: 78 },
  { label: "Giấy phép", v: 86 },
  { label: "Hồ sơ năng lượng", v: 64 },
];

function OverviewPage() {
  const [period, setPeriod] = useState(PERIODS[0]!);
  const [unit, setUnit] = useState(DISTRICTS[0]!);

  return (
    <>
      <PageHeader
        title="Tổng quan ngành Công Thương"
        description="Trung tâm điều hành dữ liệu ngành Công Thương · Toàn cảnh các phân hệ trên một màn hình."
        crumbs={[{ label: "Điều hành" }, { label: "Tổng quan" }]}
        variant="panel"
        icon={LayoutDashboard}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-surface p-1">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-8 gap-2 border-transparent bg-transparent shadow-none hover:bg-surface-strong">
                  <CalendarRange className="size-3.5 text-gov" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="mx-1 h-5 w-px bg-border" />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-8 gap-2 border-transparent bg-transparent shadow-none hover:bg-surface-strong">
                  <Building2 className="size-3.5 text-gov" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => toast.success("Đã làm mới dữ liệu tổng quan")}>
              <RefreshCw className="size-4" /> Làm mới dữ liệu
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {/* Module 01 – CSDL NGÀNH */}
        <DashboardModule
          title="CSDL ngành"
          subtitle="Hồ sơ số cốt lõi · Master Data"
          icon={Boxes}
          tone="blue"
          to="/industry-database"
          actionLabel="Mở CSDL ngành"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="Tổng doanh nghiệp" value="2.486" />
            <KpiMiniCard label="Cơ sở SXKD" value="3.174" />
            <KpiMiniCard label="Bộ dữ liệu" value="128" />
            <KpiMiniCard label="Dữ liệu chính thức" value="1.842" />
          </div>
          <MiniBarChart data={SECTOR_CHART} name="Doanh nghiệp" height={120} />
        </DashboardModule>

        {/* Module 02 – CỤM CÔNG NGHIỆP / GIS */}
        <DashboardModule
          title="Cụm công nghiệp / GIS"
          subtitle="Dữ liệu không gian · Tây Ninh"
          icon={MapIcon}
          tone="teal"
          to="/industrial-clusters"
          actionLabel="Mở bản đồ GIS"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="Cụm công nghiệp" value="26" />
            <KpiMiniCard label="Đang hoạt động" value="18" />
            <KpiMiniCard label="Đang đầu tư" value="8" />
            <KpiMiniCard label="Lấp đầy TB" value="68%" />
          </div>
          <ClusterMap clusters={CLUSTERS} height={190} />
        </DashboardModule>

        {/* Module 03 – ĐIỀU TRA & NĂNG LƯỢNG */}
        <DashboardModule
          title="Nguồn năng lượng tái tạo"
          subtitle="Hồ sơ năng lượng · khảo sát"
          icon={Zap}
          tone="cyan"
          to="/energy"
          actionLabel="Nguồn năng lượng tái tạo"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="Dự án năng lượng" value="48" />
            <KpiMiniCard label="Đang hoạt động" value="31" />
            <KpiMiniCard label="Đang triển khai" value="17" />
            <KpiMiniCard label="Hồ sơ năng lượng" value="96" />
          </div>
          <div className="space-y-2.5">
            {ENERGY_PROGRESS.map((p) => (
              <ProgressMetric key={p.name} label={p.name} value={p.v} barClass="bg-cyan-500" />
            ))}
          </div>
        </DashboardModule>

        {/* Module 04 – THỊ TRƯỜNG & SẢN PHẨM */}
        <DashboardModule
          title="Thị trường & Sản phẩm"
          subtitle="Quản lý nhóm hàng · giá cả"
          icon={Store}
          tone="green"
          to="/market"
          actionLabel="Thị trường & sản phẩm"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="Nhóm sản phẩm" value="12" />
            <KpiMiniCard label="Sản phẩm quản lý" value="486" />
            <KpiMiniCard label="Điểm kinh doanh" value="2.140" />
            <KpiMiniCard label="Biến động giá" value="3" valueClassName="text-warning" />
          </div>
          <MiniTrendChart
            data={PRICE_TREND}
            lines={[
              { key: "caosu", name: "Cao su", color: "var(--gov)" },
              { key: "nongsan", name: "Nông sản", color: "var(--teal)" },
              { key: "detmay", name: "Dệt may", color: "var(--warning)" },
            ]}
            height={105}
          />
          <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning">
            <AlertTriangle className="size-3.5 shrink-0" />
            03 nhóm hàng có biến động giá đáng chú ý
          </div>
        </DashboardModule>

        {/* Module 05 – XUẤT NHẬP KHẨU */}
        <DashboardModule
          title="Xuất nhập khẩu"
          subtitle="Kim ngạch theo tháng · Quý II/2026"
          icon={Ship}
          tone="indigo"
          to="/import-export"
          actionLabel="Xuất nhập khẩu"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="DN xuất nhập khẩu" value="184" />
            <KpiMiniCard label="Kim ngạch XK" value="246 tr USD" />
            <KpiMiniCard label="Kim ngạch NK" value="151 tr USD" />
            <KpiMiniCard label="Thị trường" value="42" />
          </div>
          <MiniTrendChart
            data={TRADE_TREND}
            lines={[
              { key: "xk", name: "Xuất khẩu", color: "var(--gov)" },
              { key: "nk", name: "Nhập khẩu", color: "var(--muted-foreground)" },
            ]}
            height={105}
          />
        </DashboardModule>

        {/* Module 06 – XÚC TIẾN THƯƠNG MẠI */}
        <DashboardModule
          title="Xúc tiến thương mại"
          subtitle="Hội chợ · triển lãm · kết nối"
          icon={Globe2}
          tone="orange"
          to="/trade-promotion"
          actionLabel="Xúc tiến thương mại"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="Chương trình" value="18" />
            <KpiMiniCard label="Sự kiện" value="42" />
            <KpiMiniCard label="DN tham gia" value="320" />
            <KpiMiniCard label="Nhiệm vụ thực hiện" value="6" />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Chương trình gần nhất
            </p>
            <ul className="space-y-1.5">
              {PROMOTIONS.slice(0, 3).map((p) => (
                <li key={p.id} className="rounded-md border border-border bg-surface px-2.5 py-1.5">
                  <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.time} · {p.enterprises} DN
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </DashboardModule>

        {/* Module 07 – GIẤY PHÉP & HỒ SƠ */}
        <DashboardModule
          title="Giấy phép & Hồ sơ"
          subtitle="Hiệu lực · hết hạn · chờ duyệt"
          icon={FileCheck2}
          tone="emerald"
          to="/industry-database"
          actionLabel="Quản lý giấy phép"
        >
          <div className="grid grid-cols-2 gap-2">
            <KpiMiniCard label="Giấy phép hiệu lực" value="1.827" valueClassName="text-success" />
            <KpiMiniCard label="Sắp hết hạn" value="37" valueClassName="text-warning" />
            <KpiMiniCard label="Hồ sơ chờ duyệt" value="12" valueClassName="text-gov" />
            <KpiMiniCard label="Hết hạn" value="96" />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Trạng thái giấy phép
            </p>
            <div className="flex items-end gap-1.5">
              {LICENSE_STATUS.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-1 flex-col items-center rounded-md border border-border bg-surface py-2"
                >
                  <span className={cn("text-base font-semibold tabular-nums", s.cls)}>{s.v}</span>
                  <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DashboardModule>

        {/* Module 08 – CHẤT LƯỢNG DỮ LIỆU */}
        <DashboardModule
          title="Chất lượng dữ liệu"
          subtitle="Kiểm tra · đối soát · đánh giá"
          icon={ShieldCheck}
          tone="blue"
          to="/data-management"
          actionLabel="Quản trị dữ liệu"
        >
          <MiniDonutChart data={DATA_STATE_CHART} colors={PIE_COLORS} height={150} />
          <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 px-2.5 py-2 text-xs">
            <span className="text-muted-foreground">Tỷ lệ dữ liệu đạt yêu cầu</span>
            <span className="font-semibold tabular-nums text-success">81%</span>
          </div>
        </DashboardModule>

        {/* Module 10 – CẢNH BÁO ĐIỀU HÀNH */}
        <DashboardModule
          title="Cảnh báo điều hành"
          subtitle="Nhấn để xem chi tiết"
          icon={AlertTriangle}
          tone="slate"
          to="/dashboard"
          actionLabel="Xem dashboard điều hành"
        >
          <div className="grid grid-cols-1 gap-1.5">
            {OPERATION_ALERTS.map((a) => (
              <AlertItem
                key={a.label}
                count={a.count}
                label={a.label}
                tone={a.tone}
                to="/dashboard"
              />
            ))}
          </div>
        </DashboardModule>

        {/* Module 09 – VÒNG ĐỜI DỮ LIỆU */}
        <DashboardModule
          title="Vòng đời dữ liệu"
          subtitle="Nhập → Chuẩn hóa → Trình duyệt → Khóa kỳ → Khai thác"
          icon={Workflow}
          tone="slate"
          to="/workflow"
          actionLabel="Workflow & phê duyệt"
          className="sm:col-span-2"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            {LIFECYCLE_STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-[11px] font-medium",
                    i < ACTIVE_LIFECYCLE_STEP && "border-success/30 bg-success/10 text-success",
                    i === ACTIVE_LIFECYCLE_STEP &&
                      "border-gov bg-gov font-semibold text-gov-foreground shadow-sm",
                    i > ACTIVE_LIFECYCLE_STEP && "border-border bg-surface text-muted-foreground",
                  )}
                >
                  <span className="mr-1 tabular-nums opacity-70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </span>
                {i < LIFECYCLE_STEPS.length - 1 ? (
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                ) : null}
              </li>
            ))}
          </ol>
        </DashboardModule>

        {/* Module 11 – CÔNG VIỆC CẦN XỬ LÝ */}
        <DashboardModule
          title="Công việc cần xử lý"
          subtitle="Theo phân công của bạn"
          icon={ListChecks}
          tone="slate"
          to="/workflow"
          actionLabel="Xem tất cả"
        >
          <ul className="space-y-1.5">
            {TASKS.map((t) => (
              <TaskItem key={t.id} name={t.name} due={`Hạn: ${t.due}`} tone={t.tone} />
            ))}
          </ul>
        </DashboardModule>

        {/* BẢN ĐỒ GIS */}
        <DashboardModule
          title="Bản đồ GIS cụm công nghiệp"
          subtitle="OpenStreetMap · Tây Ninh"
          icon={MapIcon}
          tone="teal"
          to="/industrial-clusters"
          actionLabel="Mở bản đồ GIS đầy đủ"
          className="sm:col-span-2"
        >
          <ClusterMap clusters={CLUSTERS} height={320} />
        </DashboardModule>

        {/* Module 12 – TIẾN ĐỘ SỐ HÓA */}
        <DashboardModule
          title="Tiến độ số hóa"
          subtitle="Quý II/2026"
          icon={Gauge}
          tone="slate"
          to="/data-management"
          actionLabel="Xem chi tiết"
          className="sm:col-span-2 xl:col-span-1"
        >
          <div className="space-y-2.5">
            {DIGITIZATION.map((p) => (
              <ProgressMetric key={p.label} label={p.label} value={p.v} barClass="bg-gov" />
            ))}
          </div>
        </DashboardModule>
      </div>
    </>
  );
}
