import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ENTERPRISES } from "@/data/mock";

export const Route = createFileRoute("/industry-database")({
  head: () => ({
    meta: [
      { title: "CSDL ngành Công Thương | Nền tảng ngành Công Thương" },
      { name: "description", content: "Tra cứu hồ sơ số doanh nghiệp trong cơ sở dữ liệu dùng chung của ngành." },
      { property: "og:title", content: "CSDL ngành Công Thương" },
      { property: "og:description", content: "Tra cứu hồ sơ số doanh nghiệp trong cơ sở dữ liệu dùng chung của ngành." },
    ],
  }),
  component: Page,
});

type Row = (typeof ENTERPRISES)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Doanh nghiệp", sortable: true },
  { key: "taxCode", header: "MST", sortable: true },
  { key: "sector", header: "Lĩnh vực", sortable: true },
  { key: "district", header: "Địa bàn", sortable: true },
  { key: "employees", header: "Lao động", sortable: true },
  { key: "revenue", header: "Doanh thu (tỷ)", sortable: true },
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
        title="CSDL ngành Công Thương"
        description="Tra cứu hồ sơ số doanh nghiệp trong cơ sở dữ liệu dùng chung của ngành."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "CSDL ngành Công Thương" }]}
      />
      <div className="p-6">
        <DataTable columns={columns} rows={ENTERPRISES as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
