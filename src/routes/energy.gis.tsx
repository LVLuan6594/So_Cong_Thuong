import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EnergyError,
  EnergyLoading,
  EntityDetailDrawer,
  FieldGrid,
  SearchShell,
} from "@/components/energy/EnergyShared";
import { EnergyMap, type EnergyMapEntity } from "@/components/energy/EnergyMap";
import { getEnergyGisData } from "@/lib/energy-service";

export const Route = createFileRoute("/energy/gis")({
  head: () => ({
    meta: [
      { title: "GIS Năng lượng | Nền tảng ngành Công Thương" },
      { name: "description", content: "Bản đồ GIS năng lượng độc lập: trạm, tuyến, dự án, sự cố, carbon và trạm sạc." },
    ],
  }),
  component: Page,
});

function Page() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EnergyMapEntity | null>(null);
  const dataQuery = useQuery({ queryKey: ["energy", "gis"], queryFn: getEnergyGisData });

  const searchHits = useMemo(() => {
    if (!dataQuery.data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const rows: EnergyMapEntity[] = [
      ...dataQuery.data.substations.map((item) => ({ kind: "substation" as const, item })),
      ...dataQuery.data.projects.map((item) => ({ kind: "project" as const, item })),
      ...dataQuery.data.incidents.map((item) => ({ kind: "incident" as const, item })),
      ...dataQuery.data.emissionSources.map((item) => ({ kind: "emission" as const, item })),
      ...dataQuery.data.chargingStations.map((item) => ({ kind: "charging" as const, item })),
    ];
    return rows.filter((entity) =>
      JSON.stringify(entity.item).toLowerCase().includes(q),
    ).slice(0, 6);
  }, [dataQuery.data, query]);

  if (dataQuery.isLoading) return <EnergyLoading />;
  if (dataQuery.isError || !dataQuery.data) return <EnergyError onRetry={() => void dataQuery.refetch()} />;

  return (
    <>
      <PageHeader
        title="GIS Năng lượng"
        description="Bản đồ lớp năng lượng: base map, trạm biến áp, tuyến điện, trụ điện, dự án nguồn điện, ĐMT mái nhà, sự cố, carbon và trạm sạc."
        crumbs={[{ label: "Điều tra & Năng lượng", to: "/energy" }, { label: "GIS Năng lượng" }]}
        variant="panel"
        icon={MapIcon}
        actions={
          <SearchShell
            value={query}
            onChange={setQuery}
            placeholder="Tìm trạm / dự án / trạm sạc..."
          />
        }
      />

      <div className="space-y-4 p-6">
        {searchHits.length ? (
          <div className="gov-card flex flex-wrap gap-2 p-3">
            {searchHits.map((hit) => (
              <button
                key={`${hit.kind}:${hit.item.id}`}
                type="button"
                onClick={() => setSelected(hit)}
                className="rounded-md border border-gov/25 bg-gov/5 px-3 py-1.5 text-xs font-medium text-gov hover:bg-gov/10"
              >
                {"name" in hit.item ? hit.item.name : hit.item.code}
              </button>
            ))}
          </div>
        ) : null}

        <div className="gov-card overflow-hidden">
          <EnergyMap
            data={dataQuery.data}
            height={650}
            selectedKey={selected ? `${selected.kind}:${selected.item.id}` : null}
            onSelectEntity={setSelected}
          />
        </div>
      </div>

      <EntityDetailDrawer
        open={!!selected}
        onOpenChange={(value) => !value && setSelected(null)}
        title="Hồ sơ đối tượng GIS"
        description={selected ? ("name" in selected.item ? selected.item.name : selected.item.code) : undefined}
      >
        {selected ? (
          <FieldGrid
            items={Object.entries(selected.item)
              .filter(([, value]) => typeof value !== "object")
              .slice(0, 16)
              .map(([label, value]) => ({ label, value: String(value ?? "") }))}
          />
        ) : null}
      </EntityDetailDrawer>
    </>
  );
}
