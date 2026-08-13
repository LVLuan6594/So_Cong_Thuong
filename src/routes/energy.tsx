import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Cable,
  Cloud,
  Factory,
  Leaf,
  PlugZap,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EnergyEmpty,
  EnergyError,
  EnergyFilterBar,
  EnergyLoading,
  EnergyStatusBadge,
  EntityDetailDrawer,
  FieldGrid,
  ModulePreviewGrid,
  ENERGY_DISTRICTS,
  ENERGY_MODULES,
  ENERGY_PERIODS,
} from "@/components/energy/EnergyShared";
import { EnergyMap, type EnergyMapEntity } from "@/components/energy/EnergyMap";
import {
  getEnergyGisData,
  getEnergyOverview,
  getGridIncidents,
  getPowerProjects,
  getSubstations,
} from "@/lib/energy-service";
import type { GridIncident, PowerProject, Substation } from "@/lib/energy-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/energy")({
  head: () => ({
    meta: [
      { title: "Tổng quan năng lượng | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content:
          "Dashboard tổng quan phân hệ Nguồn năng lượng tái tạo: nguồn điện, lưới điện, phụ tải, NLTT, an toàn lưới, carbon và trạm sạc.",
      },
    ],
  }),
  component: Page,
});

const CHART_COLORS = ["#1565C0", "#1976D2", "#00897B", "#2E7D32", "#E59A23", "#7C3AED"];
const INCIDENT_COLORS = {
  severe: "#C62828",
  high: "#E59A23",
  medium: "#F2C94C",
  resolved: "#2E7D32",
};

function Page() {
  const [period, setPeriod] = useState(ENERGY_PERIODS[0]!);
  const [district, setDistrict] = useState(ENERGY_DISTRICTS[0]!);
  const [chartMode, setChartMode] = useState("month");
  const [selectedSubstation, setSelectedSubstation] = useState<Substation | null>(null);
  const [selectedProject, setSelectedProject] = useState<PowerProject | null>(null);
  const [selectedMapEntity, setSelectedMapEntity] = useState<EnergyMapEntity | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["energy", "overview", period, district],
    queryFn: getEnergyOverview,
  });
  const substationsQuery = useQuery({
    queryKey: ["energy", "substations"],
    queryFn: getSubstations,
  });
  const projectsQuery = useQuery({ queryKey: ["energy", "projects"], queryFn: getPowerProjects });
  const incidentsQuery = useQuery({ queryKey: ["energy", "incidents"], queryFn: getGridIncidents });
  const gisQuery = useQuery({ queryKey: ["energy", "gis"], queryFn: getEnergyGisData });

  const isLoading =
    overviewQuery.isLoading ||
    substationsQuery.isLoading ||
    projectsQuery.isLoading ||
    incidentsQuery.isLoading ||
    gisQuery.isLoading;
  const hasError =
    overviewQuery.isError ||
    substationsQuery.isError ||
    projectsQuery.isError ||
    incidentsQuery.isError ||
    gisQuery.isError;

  const refetchAll = () => {
    void Promise.all([
      overviewQuery.refetch(),
      substationsQuery.refetch(),
      projectsQuery.refetch(),
      incidentsQuery.refetch(),
      gisQuery.refetch(),
    ]);
    toast.success("Đã làm mới dữ liệu năng lượng");
  };

  const overview = overviewQuery.data;
  const substations = substationsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const incidents = incidentsQuery.data ?? [];
  const gisData = gisQuery.data;

  const scopedSubstations = useMemo(
    () =>
      filterByDistrict(substations, district).sort(
        (a, b) => (b.loadFactor ?? 0) - (a.loadFactor ?? 0),
      ),
    [district, substations],
  );
  const scopedProjects = useMemo(() => filterByDistrict(projects, district), [district, projects]);
  const activeIncidents = useMemo(
    () =>
      filterByDistrict(incidents, district).filter(
        (i) => !["Hoàn thành", "Đã xử lý"].includes(i.progress ?? ""),
      ),
    [district, incidents],
  );

  const outputData = useMemo(() => {
    if (!overview) return [];
    if (chartMode === "quarter") {
      return [
        { month: "Q1", previous: 4340, current: 4385 },
        { month: "Q2", previous: 7060, current: 5580 },
        { month: "Q3", previous: 7180, current: 6045 },
        { month: "Q4", previous: 7060, current: 5910 },
      ];
    }
    if (chartMode === "year") {
      return [
        { month: "2024", previous: 23840, current: 24860 },
        { month: "2025", previous: 24860, current: 26842 },
        { month: "2026", previous: 26842, current: 28420 },
      ];
    }
    return overview.outputComparison;
  }, [chartMode, overview]);

  if (isLoading) return <EnergyLoading />;
  if (hasError || !overview || !gisData) return <EnergyError onRetry={refetchAll} />;

  const totalIncidents = overview.incidentBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <PageHeader
        title="Tổng quan năng lượng"
        description="Quản lý toàn diện dữ liệu năng lượng: Nguồn điện - Lưới điện - Phụ tải - Năng lượng tái tạo - Tiết kiệm năng lượng - An toàn lưới điện - Phát thải carbon - Trạm sạc điện"
        crumbs={[{ label: "Nguồn năng lượng tái tạo" }, { label: "Tổng quan năng lượng" }]}
        variant="panel"
        icon={Zap}
        actions={
          <EnergyFilterBar
            period={period}
            district={district}
            onPeriodChange={setPeriod}
            onDistrictChange={setDistrict}
            onRefresh={refetchAll}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 2xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Tổng công suất nguồn"
              value={`${fmt(overview.kpis.totalCapacityMw)} MW`}
              delta="▲ 8,2% so với Q1/2026"
              icon={Factory}
              tone="gov"
            />
            <StatCard
              label="Sản lượng điện"
              value={`${fmt(overview.kpis.electricityOutputGwh)} GWh`}
              delta="▲ 6,7%"
              icon={Zap}
              tone="gov"
            />
            <StatCard
              label="Tỷ lệ NLTT"
              value={`${overview.kpis.renewableRatioPct}%`}
              delta="▲ 5,3%"
              icon={Leaf}
              tone="success"
            />
            <StatCard
              label="Trạm biến áp"
              value={overview.kpis.substations}
              delta="▲ 4 trạm mới"
              icon={Cable}
              tone="teal"
            />
            <StatCard
              label="Trạm quá tải"
              value={overview.kpis.overloadedSubstations}
              delta="▼ 3 trạm"
              icon={AlertTriangle}
              tone="danger"
            />
            <StatCard
              label="Sự cố đang xử lý"
              value={overview.kpis.incidentsActive}
              delta="▼ 2 sự cố"
              icon={ShieldAlert}
              tone="danger"
            />
            <StatCard
              label="Phát thải CO2e"
              value={`${overview.kpis.co2eKilotons} tấn`}
              delta="▼ 2,1%"
              icon={Cloud}
              tone="analytics"
            />
            <StatCard
              label="Trạm sạc điện"
              value={overview.kpis.chargingStations}
              delta="▲ 12 trạm mới"
              icon={PlugZap}
              tone="success"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="Cơ cấu nguồn điện theo công suất">
              <div className="grid min-h-64 grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
                <div className="relative min-h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.sourceMix}
                        dataKey="capacityMw"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {overview.sourceMix.map((item, index) => (
                          <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${fmt(value)} MW`, "Công suất"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-2xl font-bold text-navy">
                        {fmt(overview.kpis.totalCapacityMw)}
                      </p>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">MW</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  {overview.sourceMix.map((item, index) => {
                    const pct = (item.capacityMw / overview.kpis.totalCapacityMw) * 100;
                    return (
                      <p
                        key={item.name}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 rounded-sm"
                            style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="truncate text-navy">{item.name}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {fmt(item.capacityMw)} MW ({pct.toFixed(1)}%)
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Sản lượng điện (GWh)"
              actions={
                <Select value={chartMode} onValueChange={setChartMode}>
                  <SelectTrigger className="h-8 w-[120px] bg-card text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Theo tháng</SelectItem>
                    <SelectItem value="quarter">Theo quý</SelectItem>
                    <SelectItem value="year">Theo năm</SelectItem>
                  </SelectContent>
                </Select>
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={outputData} margin={{ left: -18, right: 12, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Năm trước"
                    stroke="#1565C0"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Năm hiện tại"
                    stroke="#00897B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Tiêu thụ điện (GWh)"
              actions={
                <Select defaultValue="sector">
                  <SelectTrigger className="h-8 w-[140px] bg-card text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sector">Theo lĩnh vực</SelectItem>
                    <SelectItem value="district">Theo địa bàn</SelectItem>
                  </SelectContent>
                </Select>
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={overview.consumptionBySector}
                  margin={{ left: -18, right: 12, top: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="sector"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    interval={0}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" name="Tiêu thụ" fill="#1565C0" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Top 5 trạm biến áp tải cao">
              <SimpleSubstationTable
                rows={scopedSubstations.slice(0, 5)}
                onSelect={setSelectedSubstation}
              />
            </ChartCard>

            <ChartCard
              title="Dự án nổi bật"
              actions={
                <Button asChild variant="ghost" size="sm" className="text-gov">
                  <Link to={"/energy/projects" as never}>Xem chi tiết</Link>
                </Button>
              }
            >
              <ProjectTable rows={scopedProjects.slice(0, 5)} onSelect={setSelectedProject} />
            </ChartCard>

            <ChartCard title="Tình hình sự cố">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.incidentBreakdown}
                      dataKey="value"
                      innerRadius={46}
                      outerRadius={72}
                    >
                      {overview.incidentBreakdown.map((item) => (
                        <Cell key={item.severity} fill={INCIDENT_COLORS[item.severity]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-2xl font-bold text-navy">{totalIncidents}</p>
                    <p className="text-xs text-muted-foreground">Tổng số</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {overview.incidentBreakdown.map((item) => (
                  <button
                    key={item.severity}
                    type="button"
                    onClick={() => toast.info(`Đã lọc nhóm sự cố: ${item.label}`)}
                    className="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs hover:bg-surface"
                  >
                    <span>{item.label}</span>
                    <span className="font-semibold text-navy">{item.value}</span>
                  </button>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Bản đồ tổng hợp năng lượng"
              className="xl:col-span-2"
              actions={
                <Button asChild variant="ghost" size="sm" className="text-gov">
                  <Link to={"/energy/gis" as never}>Xem GIS</Link>
                </Button>
              }
            >
              <div className="-m-4 overflow-hidden rounded-b-lg">
                <EnergyMap
                  data={gisData}
                  compact
                  height={292}
                  selectedKey={
                    selectedMapEntity
                      ? `${selectedMapEntity.kind}:${selectedMapEntity.item.id}`
                      : null
                  }
                  onSelectEntity={setSelectedMapEntity}
                />
              </div>
            </ChartCard>
          </section>

          <ModulePreviewGrid />

          <section className="rounded-lg border border-dashed border-teal/60 bg-card px-5 py-4">
            <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-navy">
              Giá trị phân hệ mang lại
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              {[
                "Quản lý toàn diện dữ liệu năng lượng trên nền tảng số & GIS",
                "Hỗ trợ ra quyết định nhanh chóng, chính xác dựa trên dữ liệu",
                "Giám sát vận hành, cảnh báo sớm quá tải & sự cố",
                "Thúc đẩy phát triển năng lượng tái tạo, giảm phát thải carbon",
                "Minh bạch thông tin, phục vụ quản lý điều hành hiệu quả",
              ].map((item) => (
                <p
                  key={item}
                  className="rounded-md bg-surface px-3 py-2 text-center text-xs font-medium text-navy"
                >
                  {item}
                </p>
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden space-y-2 2xl:block">
          <div className="gov-card overflow-hidden">
            <h2 className="bg-navy px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white">
              Các module chính
            </h2>
            <div className="divide-y divide-border">
              {ENERGY_MODULES.map((item, index) => (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "flex gap-3 px-3 py-3 transition-colors hover:bg-surface",
                    item.to === "/energy" && "bg-gov/5",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-gov/20 bg-gov/10 text-gov">
                    <item.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy">
                      {index + 1}. {item.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <EntityDetailDrawer
        open={!!selectedSubstation}
        onOpenChange={(value) => !value && setSelectedSubstation(null)}
        title="Hồ sơ trạm biến áp"
        description={selectedSubstation?.name}
      >
        {selectedSubstation ? <SubstationDetail item={selectedSubstation} /> : null}
      </EntityDetailDrawer>

      <EntityDetailDrawer
        open={!!selectedProject}
        onOpenChange={(value) => !value && setSelectedProject(null)}
        title="Hồ sơ dự án nguồn điện"
        description={selectedProject?.name}
      >
        {selectedProject ? <ProjectDetail item={selectedProject} /> : null}
      </EntityDetailDrawer>

      <EntityDetailDrawer
        open={!!selectedMapEntity}
        onOpenChange={(value) => !value && setSelectedMapEntity(null)}
        title="Hồ sơ GIS năng lượng"
        description={
          selectedMapEntity
            ? "name" in selectedMapEntity.item
              ? selectedMapEntity.item.name
              : selectedMapEntity.item.code
            : undefined
        }
      >
        {selectedMapEntity ? <MapEntityDetail entity={selectedMapEntity} /> : null}
      </EntityDetailDrawer>
    </>
  );
}

function filterByDistrict<T extends { district?: string }>(rows: T[], district: string) {
  if (district === "Toàn tỉnh") return rows;
  return rows.filter((row) => row.district === district);
}

function fmt(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

function loadColor(value = 0) {
  if (value >= 120) return "text-destructive";
  if (value >= 100) return "text-warning";
  return "text-success";
}

function SimpleSubstationTable({
  rows,
  onSelect,
}: {
  rows: Substation[];
  onSelect: (row: Substation) => void;
}) {
  if (!rows.length) return <EnergyEmpty title="Chưa có dữ liệu trạm biến áp" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3">Trạm biến áp</th>
            <th className="py-2 pr-3">Cấp điện áp</th>
            <th className="py-2 pr-3">Mức tải</th>
            <th className="py-2">Hệ số tải</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-t border-border hover:bg-surface"
            >
              <td className="py-2 pr-3 font-medium text-navy">{row.name}</td>
              <td className="py-2 pr-3 text-muted-foreground">{row.voltageLevel}</td>
              <td className={cn("py-2 pr-3 font-semibold tabular-nums", loadColor(row.loadFactor))}>
                {row.loadFactor ?? 0}%
              </td>
              <td className={cn("py-2 font-semibold tabular-nums", loadColor(row.loadFactor))}>
                {((row.loadFactor ?? 0) / 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectTable({
  rows,
  onSelect,
}: {
  rows: PowerProject[];
  onSelect: (row: PowerProject) => void;
}) {
  if (!rows.length) return <EnergyEmpty title="Chưa có dữ liệu dự án" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3">Dự án</th>
            <th className="py-2 pr-3">Loại nguồn</th>
            <th className="py-2 pr-3">Công suất</th>
            <th className="py-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-t border-border hover:bg-surface"
            >
              <td className="py-2 pr-3 font-medium text-navy">{row.name}</td>
              <td className="py-2 pr-3 text-muted-foreground">{row.type}</td>
              <td className="py-2 pr-3 font-semibold tabular-nums text-navy">
                {row.designCapacityMw ?? 0} MW
              </td>
              <td className="py-2">
                <EnergyStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubstationDetail({ item }: { item: Substation }) {
  return (
    <div className="space-y-4">
      <EnergyStatusBadge status={item.status} />
      <FieldGrid
        items={[
          { label: "Mã trạm", value: item.code },
          { label: "Loại trạm", value: item.type },
          { label: "Cấp điện áp", value: item.voltageLevel },
          { label: "Địa chỉ", value: item.address },
          { label: "Đơn vị quản lý", value: item.operator },
          { label: "Công suất thiết kế", value: `${item.designCapacity ?? 0} MVA` },
          { label: "Công suất vận hành", value: `${item.operatingCapacity ?? 0} MVA` },
          { label: "Khả năng mang tải", value: `${item.availableCapacity ?? 0} MVA` },
          { label: "Hệ số tải", value: `${item.loadFactor ?? 0}%` },
          { label: "Số MBA", value: item.transformerCount },
          { label: "Loại MBA", value: item.transformerType },
          { label: "Khu vực cấp điện", value: item.supplyArea },
          {
            label: "Tọa độ",
            value:
              item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : undefined,
          },
        ]}
      />
    </div>
  );
}

function ProjectDetail({ item }: { item: PowerProject }) {
  return (
    <div className="space-y-4">
      <EnergyStatusBadge status={item.status} />
      <FieldGrid
        items={[
          { label: "Mã dự án", value: item.code },
          { label: "Loại nguồn", value: item.type },
          { label: "Công suất", value: `${item.designCapacityMw ?? 0} MW` },
          { label: "Công suất thực tế", value: `${item.actualOutputMw ?? 0} MW` },
          { label: "Sản lượng", value: `${item.outputGWh ?? 0} GWh` },
          { label: "Chủ đầu tư", value: item.investor },
          { label: "Trạm đấu nối", value: item.substationCode },
          { label: "Điện áp", value: item.gridVoltage },
          { label: "Địa bàn", value: item.district },
          {
            label: "Tọa độ",
            value:
              item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : undefined,
          },
        ]}
      />
    </div>
  );
}

function MapEntityDetail({ entity }: { entity: EnergyMapEntity }) {
  if (entity.kind === "substation") return <SubstationDetail item={entity.item} />;
  if (entity.kind === "project") return <ProjectDetail item={entity.item} />;
  if (entity.kind === "incident") {
    const item: GridIncident = entity.item;
    return (
      <FieldGrid
        items={[
          { label: "Mã sự cố", value: item.code },
          { label: "Loại", value: item.type },
          { label: "Thời gian", value: item.time },
          { label: "Địa điểm", value: item.location },
          { label: "Ảnh hưởng", value: item.affectedArea },
          { label: "Khách hàng bị ảnh hưởng", value: item.customersAffected },
          { label: "Đội xử lý", value: item.handler },
          { label: "Tiến độ", value: item.progress },
          { label: "Thời gian khôi phục", value: item.recoveryTime },
        ]}
      />
    );
  }
  return (
    <FieldGrid
      items={Object.entries(entity.item)
        .filter(([, value]) => typeof value !== "object")
        .slice(0, 12)
        .map(([label, value]) => ({ label, value: String(value ?? "") }))}
    />
  );
}
