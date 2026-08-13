import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WORKFLOW_ITEMS } from "@/data/mock";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow & phê duyệt | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content: "Trình – kiểm duyệt – phê duyệt – khóa kỳ cho các bộ dữ liệu ngành Công Thương.",
      },
      { property: "og:title", content: "Workflow & phê duyệt" },
      {
        property: "og:description",
        content: "Trình – kiểm duyệt – phê duyệt – khóa kỳ cho các bộ dữ liệu ngành Công Thương.",
      },
    ],
  }),
  component: Page,
});

type Row = (typeof WORKFLOW_ITEMS)[number];

const columns: Column<Row>[] = [
  { key: "id", header: "Mã", sortable: true },
  { key: "name", header: "Bộ dữ liệu", sortable: true },
  { key: "unit", header: "Đơn vị", sortable: true },
  { key: "updatedBy", header: "Người cập nhật", sortable: true },
  { key: "time", header: "Thời điểm", sortable: true },
  { key: "source", header: "Nguồn", sortable: true },
  { key: "stage", header: "Bước", sortable: true },
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
        title="Workflow & phê duyệt"
        description="Trình – kiểm duyệt – phê duyệt – khóa kỳ cho các bộ dữ liệu ngành Công Thương."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Workflow & phê duyệt" }]}
      />
      <div className="p-4 sm:p-6">
        <DataTable
          columns={columns}
          rows={WORKFLOW_ITEMS as Row[]}
          searchPlaceholder="Tìm kiếm trong danh sách..."
        />
      </div>
    </>
  );
}
