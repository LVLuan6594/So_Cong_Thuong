import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Download,
  Factory,
  FileCheck2,
  Map as MapIcon,
  Plug,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { AlertCard } from "@/components/common/AlertCard";
import { FilterBar } from "@/components/common/FilterBar";
import { DataTable, type Column } from "@/components/common/DataTable";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { GISMapCard } from "@/components/common/GISMapCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { DISTRICTS, PERIODS, SECTORS, STATUS_LABEL } from "@/lib/constants";
import type { Enterprise } from "@/lib/types";
import {
  CLUSTERS,
  DATA_STATE_CHART,
  DRILLDOWN,
  ENTERPRISES,
  EXPORT_MARKET_CHART,
  IIP_CHART,
  OPERATION_ALERTS,
  OVERVIEW_KPI,
  SECTOR_CHART,
} from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard tổng quan ngành Công Thương" },
      {
        name: "description",
        content:
          "Dashboard điều hành: KPI ngành, chỉ số sản xuất công nghiệp, cơ cấu thị trường xuất khẩu và cảnh báo điều hành.",
      },
      { property: "og:title", content: "Dashboard tổng quan ngành Công Thương" },
      {
        property: "og:description",
        content: "KPI, biểu đồ và cảnh báo điều hành dữ liệu ngành Công Thương.",
      },
    ],
  }),
  component: DashboardPage,
});

const KPI_ICONS = [Building2, Factory, MapIcon, Zap, FileCheck2, CalendarClock];
const ALERT_ICONS = [CalendarClock, FileCheck2, AlertTriangle, CalendarClock, Plug];
const PIE_COLORS = ["var(--success)", "var(--gov)", "var(--warning)", "var(--destructive)"];
const MARKET_COLORS = [
  "var(--gov)",
  "var(--teal)",
  "var(--success)",
  "var(--warning)",
  "var(--analytics)",
  "var(--muted-foreground)",
];

const DATA_STATES = ["Tất cả trạng thái", "Đã phê duyệt", "Đã khóa kỳ", "Chờ duyệt", "Cần bổ sung"];

// ===== Bộ lọc thay đổi dữ liệu (mock engine) =====
const PROVINCE_ENTERPRISES = 2486;

const PERIOD_FACTORS: Record<string, number> = {
  "Quý II/2026": 1,
  "Quý I/2026": 0.985,
  "Năm 2025": 0.96,
  "Năm 2024": 0.9,
};

const PREV_PERIOD_FACTOR: Record<string, number> = {
  "Quý II/2026": 0.985,
  "Quý I/2026": 0.96,
  "Năm 2025": 0.9,
  "Năm 2024": 1,
};

const KPI_BASE: Record<string, number> = {
  ent: 2486,
  fac: 3174,
  ccn: 26,
  energy: 48,
  lic: 1827,
  exp: 37,
};

const KPI_DELTA_WEIGHT: Record<string, number> = {
  ent: 1,
  fac: 0.9,
  ccn: 0.5,
  energy: 1.1,
  lic: 0.7,
  exp: 0.8,
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function vary(seed: string, amount: number, isDefault: boolean): number {
  if (isDefault) return 1;
  return 1 + (hashSeed(seed) - 0.5) * 2 * amount;
}

function fmtNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function fmtDelta(d: number): string {
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1).replace(".", ",")}%`;
}

function DashboardPage() {
  const [period, setPeriod] = useState(PERIODS[0]!);
  const [district, setDistrict] = useState(DISTRICTS[0]!);
  const [sector, setSector] = useState(SECTORS[0]!);
  const [dataState, setDataState] = useState(DATA_STATES[0]!);
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);

  const alert = OPERATION_ALERTS.find((a) => a.id === alertId) ?? null;

  const isDefault =
    period === PERIODS[0] &&
    district === DISTRICTS[0] &&
    sector === SECTORS[0] &&
    dataState === DATA_STATES[0];

  const periodFactor = PERIOD_FACTORS[period] ?? 1;
  const districtRow =
    district === DISTRICTS[0] ? null : DRILLDOWN.districts.find((d) => d.name === district);
  const districtFactor = districtRow ? districtRow.enterprises / PROVINCE_ENTERPRISES : 1;
  const sectorRow =
    sector === SECTORS[0]
      ? null
      : SECTOR_CHART.find((s) => s.name === sector || sector.startsWith(s.name.slice(0, 6)));
  const sectorFactor = sectorRow ? sectorRow.value / PROVINCE_ENTERPRISES : 1;

  const isSectorSelected = (name: string) =>
    sector !== SECTORS[0] && (sector === name || sector.startsWith(name.slice(0, 6)));

  const kpis = useMemo(
    () =>
      OVERVIEW_KPI.map((k) => {
        const base = KPI_BASE[k.id] ?? 0;
        let factor = periodFactor * districtFactor;
        if (k.id === "ent" || k.id === "fac" || k.id === "lic" || k.id === "exp") {
          factor *= sectorFactor;
        }
        const value = Math.round(
          base * factor * vary(`${k.id}|${district}|${period}|${sector}`, 0.05, isDefault),
        );
        const delta = isDefault
          ? k.delta
          : (() => {
              const prev = PREV_PERIOD_FACTOR[period] ?? 1;
              const growth =
                ((periodFactor - prev) / prev) *
                100 *
                (KPI_DELTA_WEIGHT[k.id] ?? 1) *
                (0.7 + 0.3 * districtFactor + 0.3 * sectorFactor);
              return fmtDelta(growth);
            })();
        return { ...k, value: fmtNumber(value), delta };
      }),
    [period, district, sector, isDefault, periodFactor, districtFactor, sectorFactor],
  );

  const sectorChart = useMemo(
    () =>
      SECTOR_CHART.map((s) => ({
        ...s,
        value: Math.round(s.value * (isDefault ? 1 : periodFactor * districtFactor)),
      })),
    [isDefault, periodFactor, districtFactor],
  );

  const iipChart = useMemo(
    () =>
      IIP_CHART.map((r) => ({
        ...r,
        output: Math.round(r.output * (isDefault ? 1 : periodFactor * districtFactor)),
        iip: isDefault
          ? r.iip
          : Math.round(r.iip * (0.88 + 0.12 * periodFactor) * (0.94 + 0.06 * districtFactor) * 10) /
            10,
      })),
    [isDefault, periodFactor, districtFactor],
  );

  const exportChart = useMemo(
    () =>
      EXPORT_MARKET_CHART.map((m) => ({
        ...m,
        value: Math.round(
          m.value *
            (isDefault
              ? 1
              : periodFactor *
                districtFactor *
                vary(`${m.name}|${district}|${period}|${sector}`, 0.18, isDefault)),
        ),
      })),
    [period, district, sector, isDefault, periodFactor, districtFactor],
  );

  const dataStateChart = useMemo(
    () =>
      DATA_STATE_CHART.map((d) => ({
        ...d,
        value: Math.round(d.value * (isDefault ? 1 : periodFactor * districtFactor)),
        highlight: dataState !== DATA_STATES[0] && d.name === dataState,
      })),
    [dataState, isDefault, periodFactor, districtFactor],
  );

  const alerts = useMemo(
    () =>
      OPERATION_ALERTS.map((a) => {
        const districtSensitive = a.id === "al-1" || a.id === "al-2";
        const value = isDefault
          ? a.value
          : Math.max(
              1,
              Math.round(a.value * periodFactor * (districtSensitive ? districtFactor : 1)),
            );
        return { ...a, value };
      }),
    [isDefault, periodFactor, districtFactor],
  );

  const rows = useMemo(() => {
    return ENTERPRISES.filter((e) => {
      if (district !== DISTRICTS[0] && e.district !== district) return false;
      if (sector !== SECTORS[0] && e.sector !== sector) return false;
      if (dataState !== DATA_STATES[0] && STATUS_LABEL[e.dataStatus] !== dataState) return false;
      if (kpiFilter === "exp" && e.links.licenses < 5) return false;
      if (kpiFilter === "energy" && e.links.energy === 0) return false;
      return true;
    });
  }, [district, sector, dataState, kpiFilter]);

  const columns: Column<Enterprise>[] = [
    {
      key: "name",
      header: "Doanh nghiệp",
      sortable: true,
      render: (r) => (
        <Link
          to="/enterprises/$id"
          params={{ id: r.id }}
          className="font-medium text-gov hover:underline"
        >
          {r.name}
        </Link>
      ),
    },
    { key: "taxCode", header: "MST", sortable: true },
    { key: "sector", header: "Lĩnh vực", sortable: true },
    { key: "district", header: "Địa bàn", sortable: true },
    {
      key: "revenue",
      header: "Doanh thu (tỷ)",
      sortable: true,
      className: "text-right tabular-nums",
    },
    {
      key: "dataStatus",
      header: "Trạng thái dữ liệu",
      render: (r) => <StatusBadge status={r.dataStatus} />,
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Button asChild variant="outline" size="sm">
          <Link to="/enterprises/$id" params={{ id: r.id }}>
            Xem chi tiết
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Tổng quan ngành Công Thương"
        description="Số liệu tổng hợp từ dữ liệu đã phê duyệt và đã khóa kỳ. Nhấn vào KPI hoặc biểu đồ để lọc dữ liệu chi tiết."
        crumbs={[{ label: "Điều hành" }, { label: "Dashboard lãnh đạo" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Đã xuất báo cáo tổng quan (DOCX)")}
            >
              <Download className="size-4" /> Xuất báo cáo
            </Button>
            <Button asChild>
              <Link to="/analytics">Mở BI</Link>
            </Button>
          </>
        }
      />

      <div className="space-y-5 p-4 sm:p-6">
        <FilterBar
          filters={[
            { label: "Kỳ báo cáo", value: period, options: PERIODS, onChange: setPeriod },
            { label: "Địa bàn", value: district, options: DISTRICTS, onChange: setDistrict },
            { label: "Lĩnh vực", value: sector, options: SECTORS, onChange: setSector },
            {
              label: "Trạng thái dữ liệu",
              value: dataState,
              options: DATA_STATES,
              onChange: setDataState,
            },
          ]}
        >
          <Button
            variant="outline"
            onClick={() => {
              setDistrict(DISTRICTS[0]!);
              setSector(SECTORS[0]!);
              setDataState(DATA_STATES[0]!);
              setKpiFilter(null);
            }}
          >
            Xóa lọc
          </Button>
        </FilterBar>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((k, i) => (
            <StatCard
              key={k.id}
              label={k.label}
              value={k.value}
              delta={k.delta}
              icon={KPI_ICONS[i]!}
              tone={k.tone}
              active={kpiFilter === k.id}
              onClick={() => setKpiFilter((f) => (f === k.id ? null : k.id))}
            />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Doanh nghiệp theo lĩnh vực"
            subtitle="Nhấn cột để drill-down theo lĩnh vực"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sectorChart}
                onClick={(e) => {
                  const name = e?.activeLabel;
                  if (typeof name === "string") {
                    const match = SECTORS.find((s) => name.startsWith(s.slice(0, 6)));
                    setSector(match ?? SECTORS[0]!);
                    toast.info(`Drill-down: ${name}`);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="value" name="Doanh nghiệp" radius={[4, 4, 0, 0]}>
                  {sectorChart.map((s, i) => (
                    <Cell
                      key={i}
                      fill="var(--gov)"
                      fillOpacity={sector === SECTORS[0] || isSectorSelected(s.name) ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Tình hình sản xuất công nghiệp"
            subtitle="IIP (%) và giá trị sản xuất (tỷ đồng)"
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={iipChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="l" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis
                  yAxisId="r"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="iip"
                  name="IIP (%)"
                  stroke="var(--gov)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="output"
                  name="Giá trị SX (tỷ)"
                  stroke="var(--teal)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Cơ cấu thị trường xuất khẩu" subtitle="Tỷ trọng kim ngạch (%)">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={exportChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={100}
                >
                  {exportChart.map((_, i) => (
                    <Cell key={i} fill={MARKET_COLORS[i % MARKET_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tình trạng dữ liệu" subtitle="Phân bố theo trạng thái phê duyệt">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dataStateChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={100}
                >
                  {dataStateChart.map((d, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      fillOpacity={dataState === DATA_STATES[0] || d.highlight ? 1 : 0.3}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy">
            Cảnh báo điều hành
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {alerts.map((a, i) => (
              <AlertCard
                key={a.id}
                value={a.value}
                label={a.label}
                tone={a.tone}
                icon={ALERT_ICONS[i]!}
                onClick={() => setAlertId(a.id)}
              />
            ))}
          </div>
        </section>

        <GISMapCard clusters={CLUSTERS} height={400} />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
            Dữ liệu doanh nghiệp liên quan
          </h2>
          <DataTable
            columns={columns}
            rows={rows}
            searchPlaceholder="Tìm theo tên doanh nghiệp, MST, địa bàn..."
          />
        </section>
      </div>

      <DetailDrawer
        open={!!alert}
        onOpenChange={(v) => !v && setAlertId(null)}
        title={alert?.label ?? ""}
        description={alert?.detail}
      >
        <ul className="space-y-2">
          {alert?.items.map((i) => (
            <li key={i} className="rounded-md border border-border bg-surface p-3 text-sm">
              {i}
            </li>
          ))}
        </ul>
        <Button className="w-full" onClick={() => toast.success("Đã tạo nhiệm vụ xử lý cảnh báo")}>
          Tạo nhiệm vụ xử lý
        </Button>
      </DetailDrawer>
    </>
  );
}
