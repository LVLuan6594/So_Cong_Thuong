import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { ENTERPRISES } from "@/data/mock";
import { Boxes, FileCheck2, Factory, Ship } from "lucide-react";

export const Route = createFileRoute("/enterprises/$id")({
  head: () => ({
    meta: [
      { title: "Hồ sơ doanh nghiệp 360 độ | Ngành Công Thương" },
      {
        name: "description",
        content:
          "Hồ sơ số 360 độ của doanh nghiệp: thông tin pháp lý, cơ sở sản xuất, sản phẩm, giấy phép, năng lượng và xuất nhập khẩu.",
      },
      { property: "og:title", content: "Hồ sơ doanh nghiệp 360 độ" },
      { property: "og:description", content: "Hồ sơ số tổng hợp của doanh nghiệp ngành Công Thương." },
    ],
  }),
  component: EnterpriseDetail,
});

function EnterpriseDetail() {
  const { id } = Route.useParams();
  const e = ENTERPRISES.find((x) => x.id === id);
  if (!e) throw notFound();

  return (
    <>
      <PageHeader
        title={e.name}
        description={`MST ${e.taxCode} · ${e.sector} · ${e.district}`}
        crumbs={[{ label: "Dữ liệu" }, { label: "CSDL ngành" }, { label: "Hồ sơ doanh nghiệp" }]}
        actions={
          <Button asChild variant="outline">
            <Link to="/industry-database">Về danh sách</Link>
          </Button>
        }
      />
      <div className="space-y-5 p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Cơ sở SXKD" value={e.links.facilities} icon={Factory} tone="gov" />
          <StatCard label="Sản phẩm" value={e.links.products} icon={Boxes} tone="teal" />
          <StatCard label="Giấy phép" value={e.links.licenses} icon={FileCheck2} tone="success" />
          <StatCard label="Hồ sơ XNK" value={e.links.trades} icon={Ship} tone="analytics" />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Thông tin pháp lý">
            <dl className="divide-y divide-border text-sm">
              {[
                ["Người đại diện", e.representative],
                ["Địa chỉ", e.address],
                ["Lao động", `${e.employees} người`],
                ["Doanh thu", `${e.revenue} tỷ đồng`],
                ["Nguồn dữ liệu", e.source],
                ["Đơn vị chủ quản dữ liệu", e.owner],
                ["Cập nhật", e.updatedAt],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </ChartCard>
          <ChartCard title="Trạng thái dữ liệu" subtitle="Vòng đời phê duyệt của hồ sơ">
            <StatusBadge status={e.dataStatus} />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Hồ sơ được tổng hợp từ nhiều phân hệ nghiệp vụ. Chỉ các trường đã phê duyệt hoặc đã khóa kỳ
              được sử dụng cho báo cáo điều hành và cổng tra cứu công khai.
            </p>
          </ChartCard>
        </section>
      </div>
    </>
  );
}
