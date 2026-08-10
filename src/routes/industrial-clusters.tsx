import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ClusterMap } from "@/components/common/ClusterMap";
import { CLUSTERS } from "@/data/mock";

export const Route = createFileRoute("/industrial-clusters")({
  head: () => ({
    meta: [
      { title: "GIS cụm công nghiệp | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content: "Bản đồ, hạ tầng và tỷ lệ lấp đầy các cụm công nghiệp trên địa bàn tỉnh.",
      },
      { property: "og:title", content: "GIS cụm công nghiệp" },
      {
        property: "og:description",
        content: "Bản đồ, hạ tầng và tỷ lệ lấp đầy các cụm công nghiệp trên địa bàn tỉnh.",
      },
    ],
  }),
  component: Page,
});

type Row = (typeof CLUSTERS)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Cụm công nghiệp", sortable: true },
  { key: "district", header: "Địa bàn", sortable: true },
  { key: "area", header: "Diện tích (ha)", sortable: true },
  { key: "leased", header: "Đã cho thuê (ha)", sortable: true },
  { key: "occupancy", header: "Lấp đầy (%)", sortable: true },
  { key: "enterprises", header: "Doanh nghiệp", sortable: true },
  {
    key: "status",
    header: "Trạng thái",
    render: (r) =>
      "status" in r && typeof r.status === "string" ? (
        <StatusBadge status={r.status as never} />
      ) : null,
  },
];

function Page() {
  return (
    <>
      <PageHeader
        title="GIS cụm công nghiệp"
        description="Bản đồ, hạ tầng và tỷ lệ lấp đầy các cụm công nghiệp trên địa bàn tỉnh."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "GIS cụm công nghiệp" }]}
      />
      <div className="space-y-4 p-6">
        <div className="gov-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
                Bản đồ cụm công nghiệp
              </h2>
              <p className="text-xs text-muted-foreground">Bản đồ OpenStreetMap – tỉnh Tây Ninh</p>
            </div>
          </header>
          <ClusterMap clusters={CLUSTERS as Row[]} height={520} />
        </div>
        <DataTable
          columns={columns}
          rows={CLUSTERS as Row[]}
          searchPlaceholder="Tìm kiếm trong danh sách..."
        />
      </div>
    </>
  );
}
