import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { REPORTS } from "@/data/mock";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Báo cáo & BI | Nền tảng ngành Công Thương" },
      { name: "description", content: "Kho báo cáo theo kỳ, drill-down tỉnh – huyện và xuất báo cáo DOCX/XLSX/PDF." },
      { property: "og:title", content: "Báo cáo & BI" },
      { property: "og:description", content: "Kho báo cáo theo kỳ, drill-down tỉnh – huyện và xuất báo cáo DOCX/XLSX/PDF." },
    ],
  }),
  component: Page,
});

type Row = (typeof REPORTS)[number];

const columns: Column<Row>[] = [
  { key: "id", header: "Mã", sortable: true },
  { key: "name", header: "Báo cáo", sortable: true },
  { key: "period", header: "Kỳ", sortable: true },
  { key: "unit", header: "Đơn vị", sortable: true },
  { key: "format", header: "Định dạng", sortable: true },
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
        title="Báo cáo & BI"
        description="Kho báo cáo theo kỳ, drill-down tỉnh – huyện và xuất báo cáo DOCX/XLSX/PDF."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Báo cáo & BI" }]}
      />
      <div className="p-4 sm:p-6">
        <DataTable columns={columns} rows={REPORTS as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
