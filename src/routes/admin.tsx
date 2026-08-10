import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { USERS } from "@/data/mock";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Quản trị hệ thống | Nền tảng ngành Công Thương" },
      { name: "description", content: "Người dùng, vai trò, phân quyền và nhật ký kiểm toán hệ thống." },
      { property: "og:title", content: "Quản trị hệ thống" },
      { property: "og:description", content: "Người dùng, vai trò, phân quyền và nhật ký kiểm toán hệ thống." },
    ],
  }),
  component: Page,
});

type Row = (typeof USERS)[number];

const columns: Column<Row>[] = [
  { key: "name", header: "Họ tên", sortable: true },
  { key: "account", header: "Tài khoản", sortable: true },
  { key: "unit", header: "Đơn vị", sortable: true },
  { key: "role", header: "Vai trò", sortable: true },
  { key: "lastLogin", header: "Đăng nhập gần nhất", sortable: true },
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
        title="Quản trị hệ thống"
        description="Người dùng, vai trò, phân quyền và nhật ký kiểm toán hệ thống."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Quản trị hệ thống" }]}
      />
      <div className="p-6">
        <DataTable columns={columns} rows={USERS as Row[]} searchPlaceholder="Tìm kiếm trong danh sách..." />
      </div>
    </>
  );
}
