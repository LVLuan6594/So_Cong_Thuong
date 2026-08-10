import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Factory,
  FileCheck2,
  Map as MapIcon,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { DataLifecycle } from "@/components/common/DataLifecycle";
import { GISMapCard } from "@/components/common/GISMapCard";
import { ActivityTimeline } from "@/components/common/Timelines";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QUICK_ACTIONS } from "@/lib/nav";
import { useRole } from "@/lib/role-context";
import {
  CLUSTERS,
  DATA_STATE_CHART,
  OPERATION_ALERTS,
  OVERVIEW_KPI,
  SECTOR_CHART,
  TASKS,
} from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trung tâm điều hành dữ liệu ngành Công Thương" },
      {
        name: "description",
        content:
          "Trang tổng quan: KPI ngành, cảnh báo điều hành, bản đồ cụm công nghiệp và công việc cần xử lý.",
      },
      { property: "og:title", content: "Trung tâm điều hành dữ liệu ngành Công Thương" },
      {
        property: "og:description",
        content: "Tổng quan dữ liệu ngành Công Thương: KPI, cảnh báo, GIS và nhiệm vụ.",
      },
    ],
  }),
  component: Landing,
});

const KPI_ICONS = [Building2, Factory, MapIcon, Zap, FileCheck2, CalendarClock];
const PIE_COLORS = ["var(--success)", "var(--gov)", "var(--warning)", "var(--destructive)"];

function Landing() {
  const { role } = useRole();

  return (
    <>
      <PageHeader
        title="Xin chào, Nguyễn Văn A"
        description={`Trung tâm điều hành dữ liệu ngành Công Thương · Vai trò hiện tại: ${role.name}`}
        crumbs={[{ label: "Tổng quan" }]}
        actions={
          <Button asChild>
            <Link to="/dashboard">
              Mở dashboard lãnh đạo <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="gov-card flex items-center gap-3 p-4 transition-colors hover:border-gov/50 hover:bg-surface"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-gov/10">
                <a.icon className="size-5 text-gov" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-navy">{a.label}</span>
              <ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))}
        </section>

        <DataLifecycle />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {OVERVIEW_KPI.map((k, i) => (
            <StatCard
              key={k.id}
              label={k.label}
              value={k.value}
              delta={k.delta}
              icon={KPI_ICONS[i]!}
              tone={k.tone}
            />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Doanh nghiệp theo lĩnh vực" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTOR_CHART}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="value" name="Doanh nghiệp" fill="var(--gov)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tình trạng dữ liệu" subtitle="Theo vòng đời phê duyệt">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={DATA_STATE_CHART} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90}>
                  {DATA_STATE_CHART.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1 text-xs">
              {DATA_STATE_CHART.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {d.name}
                  </span>
                  <span className="font-medium tabular-nums">{d.value}</span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy">
            Cảnh báo điều hành
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {OPERATION_ALERTS.map((a) => (
              <Link key={a.id} to="/dashboard" className="contents">
                <AlertCard value={a.value} label={a.label} tone={a.tone} />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <GISMapCard clusters={CLUSTERS} height={360} />
          </div>
          <div className="space-y-4">
            <ChartCard title="Công việc cần xử lý" subtitle="Theo phân công của bạn">
              <ActivityTimeline
                items={TASKS.map((t) => ({ title: t.name, time: `Hạn: ${t.due}` }))}
              />
            </ChartCard>
            <ChartCard title="Tiến độ số hóa quý II/2026">
              <div className="space-y-3">
                {[
                  { name: "Hồ sơ doanh nghiệp", v: 92 },
                  { name: "Cụm công nghiệp", v: 78 },
                  { name: "Giấy phép", v: 86 },
                  { name: "Hồ sơ năng lượng", v: 64 },
                ].map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="font-medium tabular-nums">{p.v}%</span>
                    </div>
                    <Progress value={p.v} className="mt-1 h-2" />
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </section>
      </div>
    </>
  );
}
