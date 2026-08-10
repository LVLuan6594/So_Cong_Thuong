import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ENERGY_SOURCES } from "@/data/mock";

export const Route = createFileRoute("/energy")({
  head: () => ({
    meta: [
      { title: "Điều tra & Năng lượng | Nền tảng ngành Công Thương" },
      { name: "description", content: "Phiếu điều tra hiện trường và hồ sơ nguồn năng lượng trên địa bàn." },
      { property: "og:title", content: "Điều tra & Năng lượng" },
      { property: "og:description", content: "Phiếu điều tra hiện trường và hồ sơ nguồn năng lượng trên địa bàn." },
    ],
  }),
  component: Page,
});

type Row = (typeof ENERGY_SOURCES)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Nguồn năng lượng", sortable: true },
  { key: "type", header: "Loại hình", sortable: true },
  { key: "capacity", header: "Công suất (MW)", sortable: true },
  { key: "output", header: "Sản lượng (triệu kWh)", sortable: true },
  { key: "district", header: "Địa bàn", sortable: true },
  {
    key: "status",
    header: "Trạng thái",
    render: (r) =>
      "status" in r && typeof r.status === "string" ? <StatusBadge status={r.status as never} /> : null,
  },
];

function Page() {
  return (
    <>
      <PageHeader
        title="Điều tra & Năng lượng"
        description="Phiếu điều tra hiện trường và hồ sơ nguồn năng lượng trên địa bàn."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Điều tra & Năng lượng" }]}
      />
      <div className="p-6">
        <DataTable columns={columns} rows={ENERGY_SOURCES as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
