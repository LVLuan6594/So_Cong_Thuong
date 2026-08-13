import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PROMOTIONS } from "@/data/mock";

export const Route = createFileRoute("/trade-promotion")({
  head: () => ({
    meta: [
      { title: "Xúc tiến thương mại | Nền tảng ngành Công Thương" },
      { name: "description", content: "Hội chợ, triển lãm, kết nối giao thương và chương trình khuyến mại." },
      { property: "og:title", content: "Xúc tiến thương mại" },
      { property: "og:description", content: "Hội chợ, triển lãm, kết nối giao thương và chương trình khuyến mại." },
    ],
  }),
  component: Page,
});

type Row = (typeof PROMOTIONS)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Chương trình", sortable: true },
  { key: "kind", header: "Loại", sortable: true },
  { key: "organizer", header: "Đơn vị tổ chức", sortable: true },
  { key: "time", header: "Thời gian", sortable: true },
  { key: "enterprises", header: "DN tham gia", sortable: true },
  { key: "budget", header: "Kinh phí (tr.đ)", sortable: true },
  { key: "result", header: "Kết quả", sortable: true },
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
        title="Xúc tiến thương mại"
        description="Hội chợ, triển lãm, kết nối giao thương và chương trình khuyến mại."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Xúc tiến thương mại" }]}
      />
      <div className="p-4 sm:p-6">
        <DataTable columns={columns} rows={PROMOTIONS as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
