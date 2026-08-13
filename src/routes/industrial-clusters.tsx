import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  Factory as FactoryIcon,
  Home,
  MapPin,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IndustrialLayerMap } from "@/components/gis/IndustrialLayerMap";
import { CompanyProfileDrawer } from "@/components/gis/CompanyProfileDrawer";
import { ProgressMetric } from "@/components/dashboard/Metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLUSTERS, CLUSTER_FACTORIES } from "@/data/mock";
import { FACTORY_STATUS_LABEL } from "@/lib/constants";
import { clusterHasIndustry, industryBelongsTo, useGisLayer } from "@/lib/gis-layer-context";
import type { Cluster, Factory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/industrial-clusters")({
  head: () => ({
    meta: [
      { title: "GIS Khu/Cụm công nghiệp | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content:
          "Bản đồ GIS: Polygon KCN/CCN theo ngành → marker doanh nghiệp → hồ sơ doanh nghiệp.",
      },
      { property: "og:title", content: "GIS Khu/Cụm công nghiệp" },
      {
        property: "og:description",
        content: "Polygon ranh giới KCN/CCN và doanh nghiệp bên trong từng khu trên bản đồ tỉnh.",
      },
    ],
  }),
  component: Page,
});

type Row = (typeof CLUSTERS)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Khu/Cụm công nghiệp", sortable: true },
  { key: "district", header: "Địa bàn", sortable: true },
  { key: "area", header: "Diện tích (ha)", sortable: true },
  { key: "leased", header: "Đã cho thuê (ha)", sortable: true },
  { key: "occupancy", header: "Lấp đầy (%)", sortable: true },
  { key: "enterprises", header: "Doanh nghiệp", sortable: true },
  {
    key: "status",
    header: "Trạng thái",
    render: (r) => (
      <StatusBadge
        status={r.status}
        label="Đang quản lý"
        className="border-navy/25 bg-navy/10 text-navy"
      />
    ),
  },
];

function occupancyColor(c: Cluster): string {
  if (c.occupancy >= 75) return "bg-success";
  if (c.occupancy >= 50) return "bg-gov";
  return "bg-warning";
}

function Page() {
  const { selectedIndustries, setSelectedIndustries, selectedClusterIds } = useGisLayer();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ company: Factory; cluster: Cluster | null } | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const activeClusters = useMemo(
    () =>
      CLUSTERS.filter((c) => selectedClusterIds.includes(c.id)).filter((c) =>
        selectedIndustries.length === 0
          ? true
          : selectedIndustries.some((ind) => clusterHasIndustry(c, ind)),
      ),
    [selectedIndustries, selectedClusterIds],
  );

  useEffect(() => {
    if (selectedZoneId && !activeClusters.some((c) => c.id === selectedZoneId)) {
      setSelectedZoneId(null);
      setSelectedCompanyId(null);
      setProfile(null);
    }
  }, [activeClusters, selectedZoneId]);

  const selectedCluster = activeClusters.find((c) => c.id === selectedZoneId) ?? null;

  const zoneFactories: Factory[] = useMemo(
    () => (selectedZoneId ? (CLUSTER_FACTORIES[selectedZoneId] ?? []) : []),
    [selectedZoneId],
  );

  // Lọc doanh nghiệp theo ngành đang chọn trong Sidebar — áp dụng ở cấp marker.
  const filteredCompanies: Factory[] = useMemo(
    () =>
      selectedIndustries.length === 0
        ? zoneFactories
        : zoneFactories.filter((f) =>
            selectedIndustries.some((ind) => industryBelongsTo(f.sector, ind)),
          ),
    [zoneFactories, selectedIndustries],
  );

  const selectedCompany = useMemo(
    () => filteredCompanies.find((f) => f.id === selectedCompanyId) ?? null,
    [filteredCompanies, selectedCompanyId],
  );

  const selectZone = useCallback((c?: Cluster) => {
    setSelectedZoneId((prev) => (prev && prev === c?.id ? null : (c?.id ?? null)));
    setSelectedCompanyId(null);
    setProfile(null);
  }, []);

  const selectCompany = useCallback((f?: Factory) => {
    setSelectedCompanyId((prev) => (prev && prev === f?.id ? null : (f?.id ?? null)));
  }, []);

  const openProfile = useCallback(
    (f: Factory) => setProfile({ company: f, cluster: selectedCluster }),
    [selectedCluster],
  );

  const resetDrill = useCallback(() => {
    setSelectedZoneId(null);
    setSelectedCompanyId(null);
    setProfile(null);
  }, []);

  const runSearch = useCallback(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const zone = activeClusters.find(
      (c) => c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q),
    );
    if (zone) {
      setSelectedZoneId(zone.id);
      setSelectedCompanyId(null);
      setProfile(null);
      return;
    }

    for (const [cid, factories] of Object.entries(CLUSTER_FACTORIES)) {
      if (!activeClusters.some((c) => c.id === cid)) continue;
      const hit = factories.find(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.taxCode ?? "").toLowerCase().includes(q) ||
          f.sector.toLowerCase().includes(q),
      );
      if (hit) {
        if (
          selectedIndustries.length > 0 &&
          !selectedIndustries.some((ind) => industryBelongsTo(hit.sector, ind))
        ) {
          setSelectedIndustries([...selectedIndustries, hit.sector]);
        }
        setSelectedZoneId(cid);
        setSelectedCompanyId(hit.id);
        setProfile(null);
        return;
      }
    }
  }, [searchQuery, activeClusters, selectedIndustries, setSelectedIndustries]);

  return (
    <>
      <PageHeader
        title="GIS Khu/Cụm công nghiệp"
        crumbs={[{ label: "Nghiệp vụ" }, { label: "GIS Khu/Cụm công nghiệp" }]}
        variant="panel"
        icon={MapIcon}
      />

      <div className="space-y-4 p-4 sm:p-6">
        <div className="gov-card overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
                Bản đồ GIS khu/cụm công nghiệp
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedCluster ? `Đang xem doanh nghiệp trong ${selectedCluster.name}` : ""}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
              className="relative w-full sm:w-auto"
            >
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm KCN / doanh nghiệp / MST / ngành..."
                className="h-9 w-full pl-8 sm:w-72"
              />
            </form>
          </header>

          <div className="relative bg-surface">
            <IndustrialLayerMap
              zones={activeClusters}
              selectedZoneId={selectedZoneId}
              companies={filteredCompanies}
              selectedCompanyId={selectedCompanyId}
              zoneName={selectedCluster?.name ?? null}
              onSelectZone={selectZone}
              onSelectCompany={selectCompany}
              onOpenProfile={openProfile}
              height={600}
            />

            {/* Đường dẫn đang xem */}
            <div className="absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2.5 py-1.5 text-[11px] shadow-panel backdrop-blur">
              <span className="flex items-center gap-1 font-semibold text-gov">
                <MapPin className="size-3.5" /> Khu/Cụm công nghiệp
              </span>
              {selectedCluster ? (
                <>
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <span className="hidden font-semibold text-teal sm:inline">
                    {selectedCluster.name}
                  </span>
                  {selectedCompany ? (
                    <>
                      <ChevronRight className="size-3 text-muted-foreground" />
                      <span className="hidden max-w-40 truncate font-medium text-navy md:inline">
                        {selectedCompany.name}
                      </span>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>

            {/* Map control – Toàn tỉnh */}
            {selectedCluster ? (
              <button
                type="button"
                onClick={resetDrill}
                className="absolute right-3 top-3 z-[500] flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2.5 py-1.5 text-[11px] font-semibold text-navy shadow-panel backdrop-blur transition-colors hover:bg-surface"
              >
                <Home className="size-3.5" /> Toàn tỉnh
              </button>
            ) : null}

            {/* Chú giải tỷ lệ lấp đầy */}
            <div className="absolute bottom-3 right-3 z-[500] rounded-md border border-border bg-card/90 p-2 text-xs shadow-panel backdrop-blur">
              <p className="mb-1 font-semibold text-navy">Tỷ lệ lấp đầy</p>
              <LegendItem dot="bg-success" label="≥ 75%" />
              <LegendItem dot="bg-gov" label="50 – 74%" />
              <LegendItem dot="bg-warning" label="< 50%" />
            </div>
          </div>
        </div>

        {/* Chi tiết khu + danh sách doanh nghiệp */}
        {selectedCluster ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ClusterDetail cluster={selectedCluster} factories={filteredCompanies} />
            <FactoryList
              factories={filteredCompanies}
              selectedFactoryId={selectedCompanyId}
              onSelectFactory={selectCompany}
              onOpenProfile={openProfile}
            />
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={activeClusters as Row[]}
          searchPlaceholder="Tìm kiếm trong danh sách..."
          onRowClick={(r) => selectZone(r as Cluster)}
          toolbar={
            <span className="text-xs text-muted-foreground">
              Khoan vào khu/cụm bằng cách chọn trên bản đồ hoặc bảng
            </span>
          }
        />
      </div>

      <CompanyProfileDrawer
        open={profile != null}
        onOpenChange={(v) => !v && setProfile(null)}
        company={profile?.company ?? null}
        cluster={profile?.cluster ?? null}
      />
    </>
  );
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <p className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", dot)} /> {label}
    </p>
  );
}

function ClusterDetail({ cluster, factories }: { cluster: Cluster; factories: Factory[] }) {
  return (
    <div className="gov-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal/10 text-teal">
            <MapPin className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
              Chi tiết khu/cụm công nghiệp
            </h2>
            <p className="text-xs text-muted-foreground">{cluster.district} · Tây Ninh</p>
          </div>
        </div>
        <StatusBadge status={cluster.status} label="Đang quản lý" />
      </header>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-base font-semibold text-navy">{cluster.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Ngành thu hút:{" "}
            {cluster.sectors
              .split(/[–\-/]/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => (
                <span
                  key={s}
                  className="mr-1 inline-block rounded-full border border-gov/25 bg-gov/5 px-2 py-0.5 text-[11px] font-medium text-gov"
                >
                  {s}
                </span>
              ))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="Diện tích" value={`${cluster.area} ha`} />
          <Kpi label="Đã cho thuê" value={`${cluster.leased} ha`} />
          <Kpi label="Doanh nghiệp" value={`${factories.length} nhà máy`} />
          <Kpi label="Lấp đầy" value={`${cluster.occupancy}%`} valueClass="text-success" />
        </div>

        <div>
          <p className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">
              Hạ tầng cụm
            </span>
            <span className="text-muted-foreground">Tỷ lệ hoàn thiện</span>
          </p>
          <div className="space-y-2.5">
            {cluster.infrastructure.map((inf) => (
              <div key={inf.name}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-navy">{inf.name}</span>
                  <span className="truncate text-right text-[11px] text-muted-foreground">
                    {inf.note}
                  </span>
                </div>
                <ProgressMetric label="" value={inf.level} barClass={occupancyColor(cluster)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FactoryList({
  factories,
  selectedFactoryId,
  onSelectFactory,
  onOpenProfile,
}: {
  factories: Factory[];
  selectedFactoryId: string | null;
  onSelectFactory: (f?: Factory) => void;
  onOpenProfile: (f: Factory) => void;
}) {
  return (
    <div className="gov-card overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gov/10 text-gov">
            <FactoryIcon className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
              Doanh nghiệp / nhà máy
            </h2>
            <p className="text-xs text-muted-foreground">
              {factories.length} nhà máy phù hợp ngành đang chọn · bấm để xem trên bản đồ
            </p>
          </div>
        </div>
      </header>

      <div className="max-h-[480px] space-y-2 overflow-y-auto p-3">
        {factories.map((f) => {
          const active = f.id === selectedFactoryId;
          return (
            <div
              key={f.id}
              onClick={() => onSelectFactory(f.id === selectedFactoryId ? undefined : f)}
              className={cn(
                "w-full rounded-lg border border-border bg-surface text-left transition-colors hover:border-gov/40",
                active && "border-gov bg-gov/5 ring-1 ring-gov/30",
              )}
            >
              <div className="flex items-start justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{f.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {f.address} · {f.products}
                  </p>
                </div>
                <span
                  className={cn(
                    "mt-1 size-2.5 shrink-0 rounded-full",
                    f.status === "active" && "bg-success",
                    f.status === "expanding" && "bg-warning",
                    f.status === "suspended" && "bg-border",
                  )}
                  title={FACTORY_STATUS_LABEL[f.status]}
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-1.5 text-[11px] text-muted-foreground">
                <span>Ngành: {f.sector}</span>
                <span className="flex items-center gap-2">
                  <span>{f.area} ha</span>
                  <span>{f.employees} lao động</span>
                  <span>{f.revenue} tỷ</span>
                </span>
              </div>
              <div className="border-t border-border/70 px-3 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-center gap-1 text-xs text-gov"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProfile(f);
                  }}
                >
                  Xem hồ sơ chi tiết
                </Button>
              </div>
            </div>
          );
        })}
        {factories.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Không có doanh nghiệp nào phù hợp ngành đang chọn trong khu này.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  valueClass = "text-navy",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", valueClass)}>{value}</p>
    </div>
  );
}
