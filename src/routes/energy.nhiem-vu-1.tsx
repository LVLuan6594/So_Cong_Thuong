import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Cable, LayoutDashboard, Layers3, Network } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { GridMap } from "@/components/grid/GridMap";
import type { GridEntity, GridMode } from "@/components/grid/GridMap";
import { GridEntityDrawer } from "@/components/grid/GridEntityDrawer";
import { GridKpiRow } from "@/components/grid/GridKpiRow";
import { GridCharts } from "@/components/grid/GridCharts";
import { GridTables } from "@/components/grid/GridTables";
import { GridAIPanel } from "@/components/grid/GridAIPanel";
import { GridAiForecast } from "@/components/grid/GridAiForecast";
import { RenewableAbsorptionPanel } from "@/components/grid/RenewableAbsorptionPanel";
import { NewLoadPointTool } from "@/components/grid/NewLoadPointTool";
import { EnergyReportExport } from "@/components/grid/EnergyReportExport";
import { getLoadHistoryAll, getTask1GridData } from "@/lib/grid-service";
import { EnergyError, EnergyLoading } from "@/components/energy/EnergyShared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Task1Search {
  mode?: "station" | "grid" | "all";
}

type TabKey = "overview" | "ai";

const MODE_META: Record<GridMode, { title: string; description: string; icon: typeof Cable }> = {
  all: {
    title: "CSDL đường dây đấu nối & trạm biến áp",
    description:
      "Trạm biến áp, đường dây, trụ điện, điểm đấu nối, khả năng mang tải và quy hoạch lưới điện tỉnh Tây Ninh.",
    icon: Layers3,
  },
  station: {
    title: "Trạm biến áp — CSDL đường dây đấu nối & trạm biến áp",
    description:
      "Hồ sơ trạm 500/220/110/22kV: máy biến áp, điểm đấu nối, vùng cấp điện, công suất và hệ số tải.",
    icon: Network,
  },
  grid: {
    title: "Lưới điện — CSDL đường dây đấu nối & trạm biến áp",
    description:
      "Tuyến truyền tải, trụ điện, hành lang an toàn, tổn thất và dự báo tải các tuyến đang vận hành.",
    icon: Cable,
  },
};

export const Route = createFileRoute("/energy/nhiem-vu-1")({
  validateSearch: (search: Record<string, unknown>): Task1Search => {
    const mode = search["mode"];
    return mode === "station" || mode === "grid" ? { mode } : {};
  },
  head: () => ({ meta: [{ title: "Nhiệm vụ 1 | CSDL lưới điện & trạm biến áp" }] }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const mode: GridMode = search.mode ?? "all";
  const meta = MODE_META[mode];

  const [selected, setSelected] = useState<GridEntity | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const selectedKey = selected ? `${selected.kind}:${selected.item.id}` : null;

  const dataQuery = useQuery({ queryKey: ["grid", "task1"], queryFn: getTask1GridData });
  const historyQuery = useQuery({ queryKey: ["grid", "load-history"], queryFn: getLoadHistoryAll });

  if (dataQuery.isLoading || historyQuery.isLoading) return <EnergyLoading />;
  if (dataQuery.isError) return <EnergyError onRetry={() => dataQuery.refetch()} />;
  const data = dataQuery.data;
  if (!data) return <EnergyError onRetry={() => dataQuery.refetch()} />;

  const history = historyQuery.data ?? [];

  return (
    <div>
      <PageHeader
        variant="panel"
        icon={meta.icon}
        title={meta.title}
        description={meta.description}
        crumbs={[{ label: "Năng lượng", to: "/energy" }, { label: "Nhiệm vụ 1" }]}
        actions={
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {(
              [
                { id: "all", label: "Toàn bộ" },
                { id: "station", label: "Trạm điện" },
                { id: "grid", label: "Lưới điện" },
              ] as { id: GridMode; label: string }[]
            ).map((m) => (
              <Link
                key={m.id}
                to="/energy/nhiem-vu-1"
                search={m.id === "all" ? {} : { mode: m.id }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  mode === m.id
                    ? "bg-gov text-white shadow-sm"
                    : "text-muted-foreground hover:text-navy",
                )}
              >
                {m.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="mx-2 mb-6 space-y-4 sm:mx-4 lg:mx-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="size-4" />
              Tổng quan &amp; Dữ liệu
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <BrainCircuit className="size-4" />
              AI hỗ trợ dự báo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3 space-y-4">
            <GridKpiRow overview={data.overview} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <GridMap
                  data={data}
                  mode={mode}
                  selectedKey={selectedKey}
                  onSelectEntity={setSelected}
                  height={560}
                />
              </div>
              <GridAIPanel warnings={data.warnings} onOpenAi={() => setTab("ai")} />
            </div>

            <GridCharts substations={data.substations} lines={data.lines} history={history} />

            <GridTables
              substations={data.substations}
              lines={data.lines}
              poles={data.poles}
              planned={data.planned}
              onSelect={setSelected}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-3 space-y-4">
            <RenewableAbsorptionPanel substations={data.substations} lines={data.lines} />
            <GridAiForecast
              substations={data.substations}
              lines={data.lines}
              loadAreas={data.loadAreas}
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <NewLoadPointTool substations={data.substations} />
              <EnergyReportExport />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GridEntityDrawer entity={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
