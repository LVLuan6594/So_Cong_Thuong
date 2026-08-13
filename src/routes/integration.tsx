import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { INTEGRATIONS } from "@/data/mock";

export const Route = createFileRoute("/integration")({
  head: () => ({
    meta: [
      { title: "Tích hợp dữ liệu | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content: "Trạng thái kết nối LGSP, NDXP, QLVBĐH, Cổng DVC và nhật ký đồng bộ.",
      },
      { property: "og:title", content: "Tích hợp dữ liệu" },
      {
        property: "og:description",
        content: "Trạng thái kết nối LGSP, NDXP, QLVBĐH, Cổng DVC và nhật ký đồng bộ.",
      },
    ],
  }),
  component: Page,
});

type Row = (typeof INTEGRATIONS)[number];

const columns: Column<Row>[] = [
  { key: "system", header: "Hệ thống", sortable: true },
  { key: "api", header: "API", sortable: true },
  { key: "lastSync", header: "Đồng bộ gần nhất", sortable: true },
  { key: "success", header: "Thành công", sortable: true },
  { key: "failed", header: "Lỗi", sortable: true },
  { key: "latency", header: "Độ trễ (ms)", sortable: true },
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
        title="Tích hợp dữ liệu"
        description="Trạng thái kết nối LGSP, NDXP, QLVBĐH, Cổng DVC và nhật ký đồng bộ."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Tích hợp dữ liệu" }]}
      />
      <div className="p-4 sm:p-6">
        <DataTable
          columns={columns}
          rows={INTEGRATIONS as Row[]}
          searchPlaceholder="Tìm kiếm trong danh sách..."
        />
      </div>
    </>
  );
}
