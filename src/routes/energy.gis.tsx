import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BatteryCharging,
  BrainCircuit,
  Cable,
  Cloud,
  Factory,
  Leaf,
  Map as MapIcon,
  PlugZap,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import {
  EnergyError,
  EnergyLoading,
  EntityDetailDrawer,
  FieldGrid,
  SearchShell,
} from "@/components/energy/EnergyShared";
import { EnergyMap, type EnergyMapEntity } from "@/components/energy/EnergyMap";
import { getEnergyGisData } from "@/lib/energy-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/energy/gis")({
  head: () => ({
    meta: [
      { title: "GIS Năng lượng | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content: "Bản đồ GIS năng lượng độc lập: trạm, tuyến, dự án, sự cố, carbon và trạm sạc.",
      },
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
      ...dataQuery.data.rooftopSolar.map((item) => ({ kind: "rooftop" as const, item })),
      ...dataQuery.data.incidents.map((item) => ({ kind: "incident" as const, item })),
      ...dataQuery.data.emissionSources.map((item) => ({ kind: "emission" as const, item })),
      ...dataQuery.data.chargingStations.map((item) => ({ kind: "charging" as const, item })),
      ...dataQuery.data.keyConsumers.map((item) => ({ kind: "consumer" as const, item })),
    ];
    return rows
      .filter((entity) => JSON.stringify(entity.item).toLowerCase().includes(q))
      .slice(0, 6);
  }, [dataQuery.data, query]);

  if (dataQuery.isLoading) return <EnergyLoading />;
  if (dataQuery.isError || !dataQuery.data)
    return <EnergyError onRetry={() => void dataQuery.refetch()} />;

  const data = dataQuery.data;
  const overloadedSubstations = data.substations.filter(
    (item) => (item.loadFactor ?? 0) >= 100,
  ).length;
  const activeIncidents = data.incidents.filter(
    (item) => !["Hoàn thành", "Đã xử lý"].includes(item.progress ?? ""),
  ).length;
  const rooftopCapacityMw =
    data.rooftopSolar.reduce((sum, item) => sum + (item.installedCapacityKw ?? 0), 0) / 1000;
  const totalCo2e = data.emissionSources.reduce((sum, item) => sum + item.co2e, 0) / 1000;

  return (
    <>
      <PageHeader
        title="GIS Năng lượng"
        description="Bản đồ lớp năng lượng: base map, trạm biến áp, tuyến điện, trụ điện, dự án nguồn điện, ĐMT mái nhà, sự cố, carbon và trạm sạc."
        crumbs={[{ label: "Nguồn năng lượng tái tạo", to: "/energy" }, { label: "GIS Năng lượng" }]}
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

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Lưới & trạm theo GIS"
              value={data.substations.length + data.lines.length}
              delta={`${data.substations.length} trạm, ${data.lines.length} tuyến`}
              icon={Cable}
              tone="gov"
            />
            <StatCard
              label="Công suất ĐMT mái nhà"
              value={`${fmt(rooftopCapacityMw)} MWp`}
              delta={`${data.rooftopSolar.length} hệ thống đấu nối`}
              icon={Leaf}
              tone="success"
            />
            <StatCard
              label="Dự án nguồn điện"
              value={data.projects.length}
              delta="Mặt trời, sinh khối, điện rác, gió"
              icon={Factory}
              tone="warning"
            />
            <StatCard
              label="Cảnh báo vận hành"
              value={overloadedSubstations + activeIncidents}
              delta={`${overloadedSubstations} trạm quá tải, ${activeIncidents} sự cố`}
              icon={AlertTriangle}
              tone="danger"
            />
            <StatCard
              label="Phát thải CO2e"
              value={`${fmt(totalCo2e)} nghìn tấn`}
              delta={`${data.emissionSources.length} nguồn/cơ sở phát thải`}
              icon={Cloud}
              tone="analytics"
            />
            <StatCard
              label="Hạ tầng sạc điện"
              value={data.chargingStations.length}
              delta="Theo dõi công suất, cổng trống, vùng quá tải"
              icon={BatteryCharging}
              tone="teal"
            />
          </section>

          <section className="gov-card grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gov">
                Theo kế hoạch triển khai 2026-2030
              </p>
              <h2 className="mt-1 text-lg font-semibold text-navy">
                Bản đồ GIS là lớp điều hành dữ liệu năng lượng dùng chung
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tài liệu yêu cầu quản lý toàn diện nguồn điện, lưới điện, phụ tải, năng lượng tái
                tạo, an toàn hành lang, phát thải carbon và trạm sạc trên nền GIS; đồng thời chuẩn
                bị dữ liệu cho AI dự báo quá tải, tiềm năng phát triển, sự cố và nhu cầu sử dụng
                điện.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {PLAN_FOCUS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-md border border-border bg-surface px-3 py-2"
                >
                  <p className="text-sm font-semibold text-navy">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {searchHits.length ? (
            <div className="gov-card flex flex-wrap gap-2 p-3">
              {searchHits.map((hit) => (
                <button
                  key={`${hit.kind}:${hit.item.id}`}
                  type="button"
                  onClick={() => setSelected(hit)}
                  className="rounded-md border border-gov/25 bg-gov/5 px-3 py-1.5 text-xs font-medium text-gov hover:bg-gov/10"
                >
                  {entityTitle(hit)}
                </button>
              ))}
            </div>
          ) : null}

          <div className="gov-card overflow-hidden">
            <EnergyMap
              data={data}
              height={650}
              selectedKey={selected ? `${selected.kind}:${selected.item.id}` : null}
              onSelectEntity={setSelected}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <section className="gov-card overflow-hidden">
            <h2 className="border-b border-border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-navy">
              Lớp dữ liệu cần thể hiện
            </h2>
            <div className="divide-y divide-border">
              {GIS_LAYER_GROUPS.map((item) => (
                <div key={item.title} className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md",
                      item.bg,
                    )}
                  >
                    <item.icon className={cn("size-4.5", item.fg)} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="gov-card p-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-4 text-gov" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
                Gợi ý AI ưu tiên
              </h2>
            </div>
            <div className="mt-3 space-y-2">
              {AI_PRIORITIES.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-dashed border-gov/30 bg-gov/5 px-3 py-2 text-xs leading-5 text-navy"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="gov-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
              Hồ sơ đang chọn
            </h2>
            {selected ? (
              <div className="mt-3 rounded-md bg-surface p-3">
                <p className="text-sm font-semibold text-navy">{entityTitle(selected)}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {entitySubtitle(selected)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Chọn một điểm trên bản đồ hoặc kết quả tìm kiếm để xem hồ sơ chi tiết.
              </p>
            )}
          </section>
        </aside>
      </div>

      <EntityDetailDrawer
        open={!!selected}
        onOpenChange={(value) => !value && setSelected(null)}
        title="Hồ sơ đối tượng GIS"
        description={selected ? entityTitle(selected) : undefined}
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

const PLAN_FOCUS = [
  {
    title: "Dữ liệu đầy đủ, cập nhật thường xuyên",
    description:
      "Mỗi lớp GIS cần gắn hồ sơ kỹ thuật, vận hành, quy hoạch và đơn vị chịu trách nhiệm cập nhật.",
  },
  {
    title: "Liên thông điều hành và chia sẻ dữ liệu",
    description:
      "Cấu trúc bản đồ phải sẵn sàng kết nối CSDL tỉnh, điện lực, địa phương và hệ thống quốc gia.",
  },
  {
    title: "AI có kiểm soát, có nhật ký vận hành",
    description:
      "Các dự báo quá tải, sự cố, phát thải, nhu cầu sạc phải đi kèm cơ chế giám sát và đánh giá rủi ro.",
  },
];

const GIS_LAYER_GROUPS: {
  title: string;
  description: string;
  icon: LucideIcon;
  bg: string;
  fg: string;
}[] = [
  {
    title: "Lưới điện và trạm biến áp",
    description:
      "Vị trí trạm, tuyến dây, trụ điện, hành lang an toàn, khu vực cấp điện và vùng phụ tải.",
    icon: Cable,
    bg: "bg-gov/10",
    fg: "text-gov",
  },
  {
    title: "Nguồn điện và ĐMT mái nhà",
    description:
      "Dự án tập trung, hệ thống mái nhà, điểm đấu nối, công suất, khả năng tiếp nhận và tiềm năng phát triển.",
    icon: Zap,
    bg: "bg-warning/15",
    fg: "text-warning",
  },
  {
    title: "Phụ tải, tiết kiệm điện, sự cố",
    description:
      "Cơ sở tiêu thụ trọng điểm, khu vực quá tải, điểm tổn thất, sự cố và phạm vi ảnh hưởng.",
    icon: PlugZap,
    bg: "bg-teal/10",
    fg: "text-teal",
  },
  {
    title: "Carbon và trạm sạc thông minh",
    description:
      "Nguồn phát thải, dự án giảm phát thải, trạm sạc, công suất cấp điện và số cổng còn trống.",
    icon: Cloud,
    bg: "bg-analytics/10",
    fg: "text-analytics",
  },
];

const AI_PRIORITIES = [
  "Dự báo quá tải trạm/tuyến và đề xuất nâng cấp công suất.",
  "Đánh giá khả năng giải tỏa công suất dự án năng lượng tái tạo.",
  "Dự báo sản lượng ĐMT mái nhà và khả năng tiếp nhận của lưới.",
  "Cảnh báo sự cố, vi phạm hành lang, phát thải và nhu cầu sạc điện.",
];

function fmt(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

function entityTitle(entity: EnergyMapEntity) {
  if (entity.kind === "substation") return entity.item.name;
  if (entity.kind === "project") return entity.item.name;
  if (entity.kind === "rooftop") return entity.item.owner;
  if (entity.kind === "incident") return entity.item.code;
  if (entity.kind === "emission") return entity.item.unit;
  if (entity.kind === "charging") return entity.item.name;
  return entity.item.name;
}

function entitySubtitle(entity: EnergyMapEntity) {
  if (entity.kind === "substation") {
    return `${entity.item.voltageLevel} · ${entity.item.district} · tải ${entity.item.loadFactor ?? 0}%`;
  }
  if (entity.kind === "project") {
    return `${entity.item.type} · ${entity.item.designCapacityMw ?? 0} MW · ${entity.item.status}`;
  }
  if (entity.kind === "rooftop") {
    return `${entity.item.customerType} · ${entity.item.installedCapacityKw ?? 0} kWp · ${entity.item.district}`;
  }
  if (entity.kind === "incident") {
    return `${entity.item.type} · ${entity.item.affectedArea} · ${entity.item.progress ?? "Đang cập nhật"}`;
  }
  if (entity.kind === "emission") {
    return `${entity.item.sourceType} · ${fmt(entity.item.co2e)} tấn CO2e · ${entity.item.district}`;
  }
  if (entity.kind === "charging") {
    return `${entity.item.type} · ${entity.item.powerKw} kW · ${entity.item.freePorts} cổng trống`;
  }
  return `${entity.item.type} · ${entity.item.sector} · ${fmt(entity.item.maxDemandKw)} kW cực đại`;
}
