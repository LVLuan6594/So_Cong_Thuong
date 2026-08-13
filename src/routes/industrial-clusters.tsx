import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  Factory as FactoryIcon,
  Gauge,
  MapPin,
  Map as MapIcon,
  Search,
  Table2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IndustrialLayerMap } from "@/components/gis/IndustrialLayerMap";
import { CompanyProfileDrawer } from "@/components/gis/CompanyProfileDrawer";
import {
  ClusterDetail,
  FactoryList,
  LegendItem,
  WardDetail,
} from "@/components/gis/IndustrialPanels";
import { IndustrialAiPanel } from "@/components/industry/IndustrialAiPanel";
import { Input } from "@/components/ui/input";
import { WARD_ZONES, wardZoneOfCluster } from "@/data/industrial-zones";
import { CLUSTERS, CLUSTER_FACTORIES } from "@/data/mock";
import { INDUSTRIES } from "@/lib/constants";
import { clusterHasIndustry, industryBelongsTo, useGisLayer } from "@/lib/gis-layer-context";
import type { Cluster, Factory, WardZone } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/industrial-clusters")({
  head: () => ({
    meta: [
      { title: "GIS Khu/Cụm công nghiệp | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content:
          "Bản đồ GIS 3 tầng: xã/phường (chính quyền 2 cấp) → Polygon KCN/CCN theo ngành → marker doanh nghiệp → hồ sơ doanh nghiệp.",
      },
      { property: "og:title", content: "GIS Khu/Cụm công nghiệp" },
      {
        property: "og:description",
        content:
          "Khoanh vùng xã/phường có cụm công nghiệp, xem Polygon ranh giới KCN/CCN và doanh nghiệp bên trong từng khu trên bản đồ tỉnh Tây Ninh.",
      },
    ],
  }),
  component: Page,
});

type Row = (typeof CLUSTERS)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Khu/Cụm công nghiệp", sortable: true },
  { key: "ward", header: "Địa bàn (xã/phường)", sortable: true },
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

function fmtArea(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

function Page() {
  const { selectedIndustries, setSelectedIndustries, selectedClusterIds } = useGisLayer();
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
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

  const wardFilterActive =
    selectedIndustries.length !== INDUSTRIES.length ||
    selectedClusterIds.length !== CLUSTERS.length;

  const wardHighlightIds = useMemo(
    () =>
      WARD_ZONES.filter((w) =>
        w.clusters.some((cid) => activeClusters.some((c) => c.id === cid)),
      ).map((w) => w.id),
    [activeClusters],
  );

  // Số liệu thống kê theo địa bàn xã/phường — phản ánh bộ lọc ngành đang bật.
  const wardStats = useMemo(() => {
    const rows = WARD_ZONES.filter((w) =>
      w.clusters.some((cid) => activeClusters.some((c) => c.id === cid)),
    )
      .map((w) => {
        const clusters = activeClusters.filter((c) => w.clusters.includes(c.id));
        const area = clusters.reduce((s, c) => s + c.area, 0);
        const leased = clusters.reduce((s, c) => s + c.leased, 0);
        const enterprises = clusters.reduce((s, c) => s + c.enterprises, 0);
        const occupancy =
          area > 0 ? Math.round(clusters.reduce((s, c) => s + c.occupancy * c.area, 0) / area) : 0;
        const industries = [
          ...new Set(
            clusters.flatMap((c) =>
              c.sectors
                .split(/[–\-/]/)
                .map((s) => s.trim())
                .filter(Boolean),
            ),
          ),
        ];
        return { ward: w, clusters, area, leased, enterprises, occupancy, industries };
      })
      .sort((a, b) => b.area - a.area);
    const totalArea = rows.reduce((s, r) => s + r.area, 0);
    const totalLeased = rows.reduce((s, r) => s + r.leased, 0);
    const totalEnterprises = rows.reduce((s, r) => s + r.enterprises, 0);
    const totalOccupancy =
      totalArea > 0
        ? Math.round(rows.reduce((s, r) => s + r.occupancy * r.area, 0) / totalArea)
        : 0;
    return { rows, totalArea, totalLeased, totalEnterprises, totalOccupancy };
  }, [activeClusters]);

  // Hủy drill khi KCN/xã không còn phù hợp bộ lọc ngành (sidebar hoặc chips trên map).
  useEffect(() => {
    if (selectedZoneId && !activeClusters.some((c) => c.id === selectedZoneId)) {
      setSelectedZoneId(null);
      setSelectedCompanyId(null);
      setProfile(null);
    }
    const ward = WARD_ZONES.find((w) => w.id === selectedWardId);
    if (
      selectedWardId &&
      ward &&
      !ward.clusters.some((cid) => activeClusters.some((c) => c.id === cid))
    ) {
      setSelectedWardId(null);
      setSelectedCompanyId(null);
      setProfile(null);
    }
  }, [activeClusters, selectedZoneId, selectedWardId]);

  const selectedWard: WardZone | null = WARD_ZONES.find((w) => w.id === selectedWardId) ?? null;
  const selectedCluster = activeClusters.find((c) => c.id === selectedZoneId) ?? null;

  // Các KCN/CCN nằm trong xã/phường đang chọn (bậc 1)
  const wardClusters: Cluster[] = useMemo(
    () => (selectedWard ? activeClusters.filter((c) => selectedWard.clusters.includes(c.id)) : []),
    [selectedWard, activeClusters],
  );

  // Nhà máy của xã/phường đang chọn (tổng hợp từ các KCN trong vùng), lọc theo ngành.
  const wardCompanies: Factory[] = useMemo(() => {
    if (!selectedWard) return [];
    const all = selectedWard.clusters.flatMap((cid) => CLUSTER_FACTORIES[cid] ?? []);
    return selectedIndustries.length === 0
      ? all
      : all.filter((f) => selectedIndustries.some((ind) => industryBelongsTo(f.sector, ind)));
  }, [selectedWard, selectedIndustries]);

  const zoneFactories: Factory[] = useMemo(
    () => (selectedZoneId ? (CLUSTER_FACTORIES[selectedZoneId] ?? []) : []),
    [selectedZoneId],
  );

  // Lọc doanh nghiệp theo ngành đang chọn — áp dụng ở cấp marker.
  const filteredCompanies: Factory[] = useMemo(
    () =>
      selectedIndustries.length === 0
        ? zoneFactories
        : zoneFactories.filter((f) =>
            selectedIndustries.some((ind) => industryBelongsTo(f.sector, ind)),
          ),
    [zoneFactories, selectedIndustries],
  );

  // Marker hiển thị: khi chọn xã/phường → nhà máy của cả vùng; khi chọn KCN → nhà máy của khu.
  const mapCompanies = selectedZoneId ? filteredCompanies : wardCompanies;

  // Tên KCN chứa từng nhà máy (để popup hiển thị khi xem ở cấp xã/phường).
  const zoneNameById: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    wardClusters.forEach((c) => {
      (CLUSTER_FACTORIES[c.id] ?? []).forEach((f) => {
        m[f.id] = c.name;
      });
    });
    return m;
  }, [wardClusters]);

  const selectedCompany = useMemo(
    () => mapCompanies.find((f) => f.id === selectedCompanyId) ?? null,
    [mapCompanies, selectedCompanyId],
  );

  const selectWard = useCallback((w?: WardZone) => {
    setSelectedWardId((prev) => (prev && prev === w?.id ? null : (w?.id ?? null)));
    setSelectedZoneId(null);
    setSelectedCompanyId(null);
    setProfile(null);
  }, []);

  const selectZone = useCallback((c?: Cluster) => {
    setSelectedZoneId((prev) => (prev && prev === c?.id ? null : (c?.id ?? null)));
    if (c) setSelectedWardId(wardZoneOfCluster(c.id)?.id ?? null);
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
    setSelectedWardId(null);
    setSelectedZoneId(null);
    setSelectedCompanyId(null);
    setProfile(null);
  }, []);

  const runSearch = useCallback(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const ward = WARD_ZONES.find((w) => w.name.toLowerCase().includes(q));
    if (ward && ward.clusters.some((cid) => activeClusters.some((c) => c.id === cid))) {
      setSelectedWardId(ward.id);
      setSelectedZoneId(null);
      setSelectedCompanyId(null);
      setProfile(null);
      return;
    }

    const zone = activeClusters.find(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ward.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q),
    );
    if (zone) {
      setSelectedZoneId(zone.id);
      setSelectedWardId(wardZoneOfCluster(zone.id)?.id ?? null);
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
        setSelectedWardId(wardZoneOfCluster(cid)?.id ?? null);
        setSelectedCompanyId(hit.id);
        setProfile(null);
        return;
      }
    }
  }, [searchQuery, activeClusters, selectedIndustries, setSelectedIndustries]);

  const drillActive = selectedWardId != null || selectedZoneId != null;

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
                {selectedCluster
                  ? `Đang xem doanh nghiệp trong ${selectedCluster.name}`
                  : selectedWard
                    ? `Đang xem địa bàn ${selectedWard.name}`
                    : "Xã/phường → KCN/CCN → doanh nghiệp (chính quyền 2 cấp)"}
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
                placeholder="Tìm xã/phường / KCN / doanh nghiệp / MST..."
                className="h-9 w-full pl-8 sm:w-72"
              />
            </form>
          </header>

          <div className="relative bg-surface">
            <IndustrialLayerMap
              zones={activeClusters}
              selectedZoneId={selectedZoneId}
              companies={mapCompanies}
              selectedCompanyId={selectedCompanyId}
              zoneName={selectedCluster?.name ?? null}
              wards={WARD_ZONES}
              selectedWardId={selectedWardId}
              highlightWardIds={wardHighlightIds}
              wardFilterActive={wardFilterActive}
              wardClusterIds={wardClusters.map((c) => c.id)}
              zoneNameById={zoneNameById}
              onSelectZone={selectZone}
              onSelectWard={selectWard}
              onSelectCompany={selectCompany}
              onOpenProfile={openProfile}
              height={600}
            />

            {/* Đường dẫn đang xem: Ngành → Xã/Phường → KCN/CCN → Doanh nghiệp */}
            <div className="absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2.5 py-1.5 text-[11px] shadow-panel backdrop-blur">
              <button
                type="button"
                onClick={drillActive ? resetDrill : undefined}
                className={cn(
                  "flex items-center gap-1 font-semibold text-gov",
                  drillActive &&
                    "cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-surface hover:text-navy",
                )}
                title={drillActive ? "Quay lại toàn tỉnh" : undefined}
              >
                <MapPin className="size-3.5" /> Xã/Phường
              </button>
              {selectedWard ? (
                <>
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <span className="hidden max-w-44 truncate font-semibold text-teal sm:inline">
                    {selectedWard.name}
                  </span>
                </>
              ) : null}
              {selectedCluster ? (
                <>
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <span className="hidden max-w-44 truncate font-semibold text-navy md:inline">
                    {selectedCluster.name}
                  </span>
                </>
              ) : null}
              {selectedCompany ? (
                <>
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <span className="hidden max-w-40 truncate font-medium text-navy md:inline">
                    {selectedCompany.name}
                  </span>
                </>
              ) : null}
            </div>

            {/* Chú giải tỷ lệ lấp đầy — ẩn khi xem chi tiết KCN (bộ lọc ngành dùng sidebar bên trái) */}
            {!selectedCluster ? (
              <div className="absolute bottom-3 right-3 z-[500] rounded-md border border-border bg-card/90 p-2 text-xs shadow-panel backdrop-blur">
                <p className="mb-1 font-semibold text-navy">Tỷ lệ lấp đầy</p>
                <LegendItem dot="bg-success" label="≥ 75%" />
                <LegendItem dot="bg-gov" label="50 – 74%" />
                <LegendItem dot="bg-warning" label="< 50%" />
                <div className="mt-2 border-t border-border pt-1.5 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-navy">Đường đứt nét:</span> ranh giới
                  xã/phường
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bậc 1: Chi tiết xã/phường + danh sách nhà máy trong vùng */}
        {selectedWard && !selectedCluster ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WardDetail ward={selectedWard} clusters={wardClusters} onSelectCluster={selectZone} />
            <FactoryList
              factories={wardCompanies}
              selectedFactoryId={selectedCompanyId}
              onSelectFactory={selectCompany}
              onOpenProfile={openProfile}
            />
          </div>
        ) : null}

        {/* Bậc 2: Chi tiết khu + danh sách doanh nghiệp */}
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

        {/* Số liệu thống kê theo địa bàn xã/phường (chính quyền 2 cấp) */}
        <section className="gov-card overflow-hidden">
          <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-teal/10 text-teal">
              <Table2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
                Số liệu thống kê theo địa bàn
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tổng hợp KCN/CCN theo xã/phường — bấm hàng để khoan xuống bản đồ
                {wardFilterActive ? " · phản ánh bộ lọc ngành đang bật" : ""}
              </p>
            </div>
            <span className="rounded-full border border-teal/30 bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal">
              {activeClusters.length}/{CLUSTERS.length} cụm
            </span>
          </header>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label="Xã/phường có cụm"
                value={wardStats.rows.length}
                delta="Có KCN/CCN"
                icon={MapPin}
                tone="gov"
              />
              <StatCard
                label="KCN/CCN"
                value={activeClusters.length}
                delta={wardFilterActive ? "Sau bộ lọc ngành" : "Đang quản lý"}
                icon={FactoryIcon}
                tone="teal"
              />
              <StatCard
                label="Tổng diện tích"
                value={`${fmtArea(wardStats.totalArea)} ha`}
                delta="Quy hoạch các cụm"
                icon={Building2}
                tone="warning"
              />
              <StatCard
                label="Đất đã cho thuê"
                value={`${fmtArea(wardStats.totalLeased)} ha`}
                delta="Cho thuê hạ tầng"
                icon={TrendingUp}
                tone="success"
              />
              <StatCard
                label="Lấp đầy BQ"
                value={`${wardStats.totalOccupancy}%`}
                delta="Bình quân gia quyền"
                icon={Gauge}
                tone="analytics"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5">Địa bàn (xã/phường)</th>
                    <th className="px-3 py-2.5">KCN/CCN</th>
                    <th className="px-3 py-2.5">Diện tích (ha)</th>
                    <th className="px-3 py-2.5">Đã cho thuê (ha)</th>
                    <th className="px-3 py-2.5">DN</th>
                    <th className="px-3 py-2.5">Lấp đầy BQ</th>
                    <th className="px-3 py-2.5">Ngành chủ đạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wardStats.rows.map(
                    ({ ward, clusters, area, leased, enterprises, occupancy, industries }) => (
                      <tr
                        key={ward.id}
                        onClick={() => selectWard(ward)}
                        className="cursor-pointer transition-colors hover:bg-gov/5"
                      >
                        <td className="px-3 py-2.5 font-medium text-navy">
                          {ward.name}
                          <span className="ml-1.5 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {ward.type === "phuong" ? "Phường" : "Xã"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{clusters.length}</td>
                        <td className="px-3 py-2.5 tabular-nums">{fmtArea(area)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{fmtArea(leased)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{enterprises}</td>
                        <td className="px-3 py-2.5 tabular-nums">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              occupancy >= 75
                                ? "bg-success/10 text-success"
                                : occupancy >= 50
                                  ? "bg-gov/10 text-gov"
                                  : "bg-warning/10 text-warning",
                            )}
                          >
                            {occupancy}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex max-w-72 flex-wrap gap-1">
                            {industries.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-gov/25 bg-gov/5 px-1.5 py-0.5 text-[10px] font-medium text-gov"
                              >
                                {s}
                              </span>
                            ))}
                            {industries.length > 3 ? (
                              <span className="text-[10px] text-muted-foreground">
                                +{industries.length - 3}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                  {wardStats.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-xs text-muted-foreground"
                      >
                        Không có KCN/CCN nào phù hợp bộ lọc ngành đang bật.
                      </td>
                    </tr>
                  ) : null}
                  {wardStats.rows.length > 0 ? (
                    <tr className="bg-surface font-semibold">
                      <td className="px-3 py-2.5 text-navy">
                        Toàn tỉnh ({wardStats.rows.length} xã/phường)
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{activeClusters.length}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtArea(wardStats.totalArea)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtArea(wardStats.totalLeased)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{wardStats.totalEnterprises}</td>
                      <td className="px-3 py-2.5 tabular-nums">{wardStats.totalOccupancy}%</td>
                      <td className="px-3 py-2.5 text-muted-foreground">—</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <DataTable
          columns={columns}
          rows={activeClusters as Row[]}
          searchPlaceholder="Tìm kiếm trong danh sách..."
          onRowClick={(r) => selectZone(r as Cluster)}
          toolbar={
            <span className="text-xs text-muted-foreground">
              Khoan vào xã/phường hoặc khu/cụm bằng cách chọn trên bản đồ hoặc bảng
            </span>
          }
        />

        {/* AI phân tích & dự báo nhu cầu đất công nghiệp */}
        <section className="rounded-2xl border border-analytics/30 bg-analytics/[0.08] p-3 sm:p-4">
          <IndustrialAiPanel onSelectCluster={selectZone} />
        </section>
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
