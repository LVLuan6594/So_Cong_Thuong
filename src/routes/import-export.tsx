import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TRADES } from "@/data/mock";

export const Route = createFileRoute("/import-export")({
  head: () => ({
    meta: [
      { title: "Xuất nhập khẩu | Nền tảng ngành Công Thương" },
      { name: "description", content: "Kim ngạch xuất nhập khẩu theo mã HS, doanh nghiệp và thị trường." },
      { property: "og:title", content: "Xuất nhập khẩu" },
      { property: "og:description", content: "Kim ngạch xuất nhập khẩu theo mã HS, doanh nghiệp và thị trường." },
    ],
  }),
  component: Page,
});

type Row = (typeof TRADES)[number];

const columns: Column<Row>[] = [
  { key: "hs", header: "Mã HS", sortable: true },
  { key: "name", header: "Mặt hàng", sortable: true },
  { key: "enterprise", header: "Doanh nghiệp", sortable: true },
  { key: "market", header: "Thị trường", sortable: true },
  { key: "exportValue", header: "Xuất khẩu (triệu USD)", sortable: true },
  { key: "importValue", header: "Nhập khẩu (triệu USD)", sortable: true },
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
        title="Xuất nhập khẩu"
        description="Kim ngạch xuất nhập khẩu theo mã HS, doanh nghiệp và thị trường."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Xuất nhập khẩu" }]}
      />
      <div className="p-6">
        <DataTable columns={columns} rows={TRADES as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
