import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BatteryCharging, Map as MapIcon, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EnergyEmpty,
  EnergyError,
  EnergyFilterBar,
  EnergyLoading,
  EnergyStatusBadge,
  EntityDetailDrawer,
  FieldGrid,
  ENERGY_DISTRICTS,
  ENERGY_PERIODS,
} from "@/components/energy/EnergyShared";
import {
  EnergyMap,
  type EnergyMapEntity,
  type EnergyMapExtraCircle,
  type EnergyMapExtraMarker,
  type EnergyMapLayerKey,
  type EnergyMapLayerOption,
} from "@/components/energy/EnergyMap";
import { ChargingAiPanel } from "@/components/charging/ChargingAiPanel";
import { ChargingCharts } from "@/components/charging/ChargingCharts";
import { ChargingKpiRow } from "@/components/charging/ChargingKpiRow";
import { ChargingTables } from "@/components/charging/ChargingTables";
import {
  getChargingDemandHistory,
  getChargingStations,
  getEnergyGisData,
} from "@/lib/energy-service";
import type { ChargingStation } from "@/lib/energy-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/energy/nhiem-vu-7")({
  head: () => ({
    meta: [{ title: "Nhiệm vụ 7 | Quản lý trạm sạc điện thông minh" }],
  }),
  component: Page,
});

const MAP_LAYER_OPTIONS: EnergyMapLayerOption[] = [
  { label: "Trạm sạc điện", keys: ["chargingStations"] },
  { label: "Lưới điện 22kV", keys: ["lines22"] },
  { label: "Trạm biến áp", keys: ["substations"] },
];

const MAP_INITIAL_LAYERS: EnergyMapLayerKey[] = ["chargingStations", "lines22"];

const EXTRA_LEGEND = [
  { color: "#2E7D32", label: "Trạm hoạt động" },
  { color: "#E59A23", label: "Trạm bảo trì" },
  { color: "#C62828", label: "Trạm quá tải / hết cổng" },
  { color: "#1565C0", label: "Trạm quy hoạch" },
  { color: "#7C3AED", label: "Trạm sạc đề xuất (AI)" },
];

const totalPorts = (s: ChargingStation) => s.ports.ccs2 + s.ports.chademo + s.ports.acType2;

function Page() {
  const [period, setPeriod] = useState(ENERGY_PERIODS[0]!);
  const [district, setDistrict] = useState(ENERGY_DISTRICTS[0]!);
  const [tab, setTab] = useState<"overview" | "ai">("overview");
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [selectedExtraKey, setSelectedExtraKey] = useState<string | null>(null);
  const [overloadOnly, setOverloadOnly] = useState(false);
  const [aiCircles, setAiCircles] = useState<EnergyMapExtraCircle[]>([]);
  const [aiMarkers, setAiMarkers] = useState<EnergyMapExtraMarker[]>([]);

  const stationsQuery = useQuery({
    queryKey: ["energy", "charging-stations"],
    queryFn: getChargingStations,
  });
  const gisQuery = useQuery({ queryKey: ["energy", "gis"], queryFn: getEnergyGisData });
  const demandQuery = useQuery({
    queryKey: ["energy", "charging-demand-history"],
    queryFn: getChargingDemandHistory,
  });

  const isLoading = stationsQuery.isLoading || gisQuery.isLoading || demandQuery.isLoading;
  const hasError = stationsQuery.isError || gisQuery.isError || demandQuery.isError;

  const stations = useMemo(() => stationsQuery.data ?? [], [stationsQuery.data]);

  const scopedStations = useMemo(
    () => (district === "Toàn tỉnh" ? stations : stations.filter((s) => s.district === district)),
    [district, stations],
  );

  const overloaded = useMemo(
    () =>
      stations.filter(
        (s) =>
          s.status.includes("Quá tải") || (s.freePorts === 0 && !s.status.includes("Quy hoạch")),
      ),
    [stations],
  );

  const gisData = useMemo(() => {
    if (!gisQuery.data) return gisQuery.data;
    if (district === "Toàn tỉnh") return gisQuery.data;
    return {
      ...gisQuery.data,
      chargingStations: gisQuery.data.chargingStations.filter((s) => s.district === district),
    };
  }, [district, gisQuery.data]);

  const overloadCircles = useMemo<EnergyMapExtraCircle[]>(
    () =>
      overloaded.map((s) => ({
        id: `overload-${s.id}`,
        lat: s.latitude ?? 11.3,
        lng: s.longitude ?? 106.1,
        radiusMeters: 4000,
        color: "#C62828",
        label: `Khu vực quá tải: ${s.name}`,
        popup: `<div style="color:#64748b;font-size:11px">${s.name} · ${s.powerKw} kW · cổng trống ${s.freePorts}/${totalPorts(s)}</div>`,
      })),
    [overloaded],
  );

  const mapCircles = useMemo(
    () => [...overloadCircles, ...aiCircles],
    [aiCircles, overloadCircles],
  );

  const chargingTone = useCallback((s: ChargingStation) => {
    if (s.status.includes("Quá tải") || (s.freePorts === 0 && !s.status.includes("Quy hoạch")))
      return { color: "#C62828", ring: true };
    if (s.status.includes("Bảo trì")) return { color: "#E59A23" };
    if (s.status.includes("Quy hoạch")) return { color: "#1565C0" };
    return { color: "#2E7D32" };
  }, []);

  const handleSelectMapEntity = useCallback((entity: EnergyMapEntity) => {
    if (entity.kind === "charging") setSelectedStation(entity.item);
  }, []);

  const handleCirclesChange = useCallback(
    (circles: EnergyMapExtraCircle[]) => setAiCircles(circles),
    [],
  );
  const handleMarkersChange = useCallback(
    (markers: EnergyMapExtraMarker[]) => setAiMarkers(markers),
    [],
  );
  const handleFocusStation = useCallback(
    (id: string) => {
      const station = stations.find((s) => s.id === id);
      if (station) setSelectedStation(station);
    },
    [stations],
  );
  const handleFocusExtra = useCallback((key: string) => setSelectedExtraKey(key), []);

  if (isLoading) return <EnergyLoading />;
  if (hasError || !gisData) return <EnergyError onRetry={() => void stationsQuery.refetch()} />;

  const displayedStations = overloadOnly
    ? scopedStations.filter(
        (s) =>
          s.status.includes("Quá tải") || (s.freePorts === 0 && !s.status.includes("Quy hoạch")),
      )
    : scopedStations;

  return (
    <>
      <PageHeader
        title="Nhiệm vụ 7 — Quản lý trạm sạc điện thông minh"
        description="Quản lý hiện trạng trạm sạc, hiển thị bản đồ số (vị trí, công suất, loại sạc, trạng thái, cổng trống, khu vực quá tải) và ứng dụng AI dự báo nhu cầu sạc, đề xuất vị trí trạm sạc mới."
        crumbs={[{ label: "Nguồn năng lượng tái tạo", to: "/energy" }, { label: "Nhiệm vụ 7" }]}
        variant="panel"
        icon={BatteryCharging}
        actions={
          <EnergyFilterBar
            period={period}
            district={district}
            onPeriodChange={setPeriod}
            onDistrictChange={setDistrict}
            onRefresh={() => {
              void stationsQuery.refetch();
              void gisQuery.refetch();
              void demandQuery.refetch();
            }}
          />
        }
      />

      <div className="space-y-5 p-4 sm:p-6">
        {/* 1. Bản đồ số trạm sạc (luôn hiển thị để xem cảnh báo AI) */}
        <section className="rounded-2xl border border-teal/25 bg-teal/[0.08] p-3 sm:p-4">
          <div className="gov-card overflow-hidden">
            <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gov/10 text-gov">
                <MapIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
                  Bản đồ số trạm sạc điện thông minh
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Vị trí trạm sạc, trạng thái hoạt động, cổng trống và khu vực quá tải. Nhấn vào
                  trạm/cảnh báo AI để xem chi tiết.
                </p>
              </div>
            </header>
            <EnergyMap
              data={gisData}
              height={520}
              layerOptions={MAP_LAYER_OPTIONS}
              initialLayers={MAP_INITIAL_LAYERS}
              selectedKey={selectedStation ? `charging:${selectedStation.id}` : null}
              selectedExtraKey={selectedExtraKey}
              chargingTone={chargingTone}
              extraCircles={mapCircles}
              extraMarkers={aiMarkers}
              extraLegend={EXTRA_LEGEND}
              onSelectEntity={handleSelectMapEntity}
            />
          </div>
        </section>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "overview" | "ai")} className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" className="gap-1.5">
              <PlugZap className="size-4" />
              Quản lý &amp; Dữ liệu
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <BatteryCharging className="size-4" />
              AI dự báo &amp; đề xuất
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-5">
            <ChargingKpiRow
              stations={scopedStations}
              onFilterOverload={() => setOverloadOnly((v) => !v)}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ChartCard
                title="Khu vực quá tải"
                subtitle="Trạm hết cổng trống / vượt công suất — ưu tiên đầu tư"
                className="xl:col-span-1"
              >
                {overloaded.length === 0 ? (
                  <EnergyEmpty title="Không có trạm quá tải" />
                ) : (
                  <div className="space-y-2">
                    {overloaded.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStation(s)}
                        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-destructive/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-navy">
                            {s.name}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {s.district} · {s.powerKw} kW · cổng trống {s.freePorts}/{totalPorts(s)}
                          </span>
                        </span>
                        <EnergyStatusBadge status={s.status} />
                      </button>
                    ))}
                  </div>
                )}
              </ChartCard>

              <div className="xl:col-span-2">
                <div className="gov-card mb-4 flex items-center gap-3 p-4">
                  <StatCard
                    label="Trạm quá tải"
                    value={overloaded.length}
                    delta="Cần bổ sung trạm/cổng sạc"
                    icon={AlertTriangle}
                    tone="danger"
                    onClick={() => setOverloadOnly((v) => !v)}
                    active={overloadOnly}
                  />
                  <div className="flex-1 text-xs leading-5 text-muted-foreground">
                    <p>
                      Khu vực quá tải được khoanh vùng trên bản đồ. Nhấn vào nút bên trái để lọc
                      danh sách chỉ hiển thị trạm quá tải/hết cổng.
                    </p>
                  </div>
                </div>
                <ChargingCharts stations={stations} demandHistory={demandQuery.data ?? []} />
              </div>
            </div>

            <ChargingTables
              stations={displayedStations}
              selectedId={selectedStation?.id ?? null}
              onSelect={setSelectedStation}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <ChargingAiPanel
              stations={stations}
              onCirclesChange={handleCirclesChange}
              onMarkersChange={handleMarkersChange}
              onFocusStation={handleFocusStation}
              onFocusExtra={handleFocusExtra}
            />
          </TabsContent>
        </Tabs>

        <section className="rounded-lg border border-dashed border-teal/60 bg-card px-5 py-4">
          <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-navy">
            Sản phẩm của Nhiệm vụ 7
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              "Cơ sở dữ liệu trạm sạc điện thông minh (thông tin, thông số kỹ thuật, trạng thái)",
              "Bản đồ số vị trí, thông tin trạm sạc; khoanh vùng khu vực quá tải",
              "AI dự báo nhu cầu sạc và đề xuất vị trí lắp đặt trạm mới phù hợp nhu cầu",
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

      <EntityDetailDrawer
        open={!!selectedStation}
        onOpenChange={(value) => !value && setSelectedStation(null)}
        title="Hồ sơ trạm sạc điện"
        description={selectedStation?.name}
      >
        {selectedStation ? <ChargingStationDetail item={selectedStation} /> : null}
      </EntityDetailDrawer>
    </>
  );
}

function ChargingStationDetail({ item }: { item: ChargingStation }) {
  const total = totalPorts(item);
  return (
    <div className="space-y-4">
      <EnergyStatusBadge status={item.status} />
      <FieldGrid
        items={[
          { label: "Mã trạm", value: item.code },
          { label: "Loại hình", value: item.type },
          { label: "Địa chỉ", value: item.address },
          { label: "Địa bàn", value: item.district },
          { label: "Đơn vị vận hành", value: item.operator },
          { label: "Chủ đầu tư", value: item.investor },
          { label: "Công suất trạm", value: `${item.powerKw} kW` },
          { label: "Số cổng sạc", value: total },
          { label: "Cổng đang trống", value: item.freePorts },
          {
            label: "Chuẩn sạc",
            value: `CCS2: ${item.ports.ccs2} · CHAdeMO: ${item.ports.chademo} · AC Type2: ${item.ports.acType2}`,
          },
          { label: "Sạc nhanh / chậm", value: `${item.ports.fast} / ${item.ports.slow}` },
          { label: "Điện áp vận hành", value: item.voltage },
          { label: "Trạm biến áp cấp điện", value: item.substationCode },
          { label: "Khả năng cấp điện", value: `${item.supplyCapacityKw} kW` },
          {
            label: "Tọa độ GIS",
            value:
              item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : undefined,
          },
        ]}
      />
      <p className={cn("text-[11px] leading-5 text-muted-foreground")}>
        Tỷ lệ cổng trống:{" "}
        <b className="text-navy">{total ? Math.round((item.freePorts / total) * 100) : 0}%</b> —
        {item.freePorts === 0 && !item.status.includes("Quy hoạch")
          ? " trạm hết cổng trống, cần mở rộng."
          : " trạm còn khả năng phục vụ."}
      </p>
    </div>
  );
}
