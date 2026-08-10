import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PRODUCTS } from "@/data/mock";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Thị trường & Sản phẩm | Nền tảng ngành Công Thương" },
      { name: "description", content: "Sản phẩm công nghiệp chủ lực, tiêu chuẩn, chứng nhận và diễn biến giá." },
      { property: "og:title", content: "Thị trường & Sản phẩm" },
      { property: "og:description", content: "Sản phẩm công nghiệp chủ lực, tiêu chuẩn, chứng nhận và diễn biến giá." },
    ],
  }),
  component: Page,
});

type Row = (typeof PRODUCTS)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Sản phẩm", sortable: true },
  { key: "group", header: "Nhóm", sortable: true },
  { key: "market", header: "Thị trường", sortable: true },
  { key: "standard", header: "Tiêu chuẩn", sortable: true },
  { key: "certificate", header: "Chứng nhận", sortable: true },
  { key: "trend", header: "Biến động (%)", sortable: true },
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
        title="Thị trường & Sản phẩm"
        description="Sản phẩm công nghiệp chủ lực, tiêu chuẩn, chứng nhận và diễn biến giá."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Thị trường & Sản phẩm" }]}
      />
      <div className="p-6">
        <DataTable columns={columns} rows={PRODUCTS as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
