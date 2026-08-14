import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Boxes,
  Database,
  ExternalLink,
  FileBarChart,
  Globe2,
  Landmark,
  MapPin,
  Newspaper,
  Scale,
  Ship,
  Store,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailDrawer } from "@/components/common/DetailDrawer";
import { MiniBarChart, MiniDonutChart } from "@/components/dashboard/MiniCharts";
import { MarketAiPanel } from "@/components/market/MarketAiPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MARKET_ALERTS,
  MARKET_EXPORT_MARKETS,
  MARKET_PRICE_INDEX,
  MARKET_PRODUCTS,
} from "@/data/market-mock";
import { formatPortalDate, getPublishedPosts } from "@/lib/portal-service";
import {
  MARKET_LEGAL_BASIS,
  MARKET_REPORT_ID,
  buildExportMarketChart,
  computeMarketKpis,
  readBiReportCount,
  syncMarketToBi,
  type MarketKpis,
} from "@/lib/market-service";
import type { MarketProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Thị trường & Sản phẩm | Nền tảng ngành Công Thương" },
      {
        name: "description",
        content:
          "Sản phẩm công nghiệp chủ lực của tỉnh Tây Ninh, diễn biến giá, thị trường xuất khẩu, tin tức và căn cứ pháp lý quản lý thị trường của Bộ Công Thương và Sở Công Thương.",
      },
      { property: "og:title", content: "Thị trường & Sản phẩm" },
      {
        property: "og:description",
        content:
          "Sản phẩm chủ lực, giá cả, thị trường xuất khẩu và AI dự báo diễn biến thị trường ngành Công Thương Tây Ninh.",
      },
    ],
  }),
  component: Page,
});

const GOV = "oklch(0.513 0.16 255.7)";
const TEAL = "oklch(0.566 0.101 182.5)";
const SUCCESS = "oklch(0.523 0.135 144.2)";
const WARNING = "oklch(0.743 0.15 72.1)";
const DESTRUCTIVE = "oklch(0.539 0.194 26.7)";
const ANALYTICS = "oklch(0.549 0.162 297.7)";
const MUTED = "oklch(0.554 0.041 257.4)";

const GROUPS = ["Tất cả", ...Array.from(new Set(MARKET_PRODUCTS.map((p) => p.group)))];

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm font-medium text-navy">{children}</div>
    </div>
  );
}

function KpiGrid({ k }: { k: MarketKpis }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Sản phẩm chủ lực"
        value={k.products}
        delta={`${k.groups} nhóm hàng · ${k.facilities.toLocaleString("vi-VN")} cơ sở SXKD`}
        icon={Boxes}
        tone="gov"
      />
      <StatCard
        label="Bán lẻ 6T/2026"
        value={k.retail6T}
        delta={`+${k.retailGrowth}% so cùng kỳ`}
        icon={Store}
        tone="teal"
      />
      <StatCard
        label="Kim ngạch XK 5T/2026"
        value={k.export5T}
        delta={`+${k.exportGrowth}% so cùng kỳ`}
        icon={Ship}
        tone="success"
      />
      <StatCard
        label="Xuất siêu 5T/2026"
        value={k.surplus}
        delta="Hàng hóa đến hơn 150 quốc gia"
        icon={ArrowUp}
        tone="warning"
      />
      <StatCard
        label="Nhóm giá tăng T6/2026"
        value={`${k.priceRisers}/5 nhóm`}
        delta={`${k.alertCount} cảnh báo đang theo dõi`}
        icon={TrendingUp}
        tone="analytics"
      />
    </section>
  );
}

function Page() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("products");
  const [group, setGroup] = useState<string>("Tất cả");
  const [selected, setSelected] = useState<MarketProduct | null>(null);
  const [biCount, setBiCount] = useState(() => readBiReportCount());

  const kpis = useMemo(() => computeMarketKpis(), []);
  const marketChart = useMemo(() => buildExportMarketChart(), []);

  const filtered = useMemo(
    () => (group === "Tất cả" ? MARKET_PRODUCTS : MARKET_PRODUCTS.filter((p) => p.group === group)),
    [group],
  );

  const marketNews = useMemo(
    () =>
      getPublishedPosts()
        .filter(
          (p) =>
            p.type === "market-info" ||
            p.category === "Thương mại" ||
            p.category === "Giá cả thị trường" ||
            p.category === "Xuất nhập khẩu",
        )
        .slice(0, 4),
    [],
  );

  const syncToBi = () => {
    const ds = syncMarketToBi();
    setBiCount(readBiReportCount());
    toast.success(`Đã đồng bộ "${ds.name}" vào Kho báo cáo.`);
    navigate({ to: "/analytics", search: { ds: ds.id } });
  };

  const columns: Column<MarketProduct>[] = [
    {
      key: "name",
      header: "Sản phẩm",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-navy">{r.name}</p>
          <p className="text-[11px] text-muted-foreground">{r.ward ?? "—"}</p>
        </div>
      ),
    },
    { key: "group", header: "Nhóm", sortable: true },
    {
      key: "output",
      header: "Sản lượng",
      sortable: true,
      className: "text-right",
      render: (r) => (r.output ? `${r.output.toLocaleString("vi-VN")} ${r.unit ?? ""}` : "—"),
    },
    {
      key: "price",
      header: "Đơn giá",
      sortable: true,
      className: "text-right",
      render: (r) => (r.price ? `${r.price.toLocaleString("vi-VN")} ${r.priceUnit ?? ""}` : "—"),
    },
    { key: "market", header: "Thị trường", sortable: true },
    { key: "standard", header: "Tiêu chuẩn", sortable: true },
    { key: "certificate", header: "Chứng nhận", sortable: true },
    {
      key: "trend",
      header: "Biến động (%)",
      sortable: true,
      className: "text-right",
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold tabular-nums",
            r.trend >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {r.trend >= 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {r.trend >= 0 ? "+" : ""}
          {r.trend.toFixed(1)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const marketColumns: Column<(typeof MARKET_EXPORT_MARKETS)[number]>[] = [
    {
      key: "name",
      header: "Thị trường",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-navy">{r.name}</p>
          {r.note ? <p className="text-[11px] text-muted-foreground">{r.note}</p> : null}
        </div>
      ),
    },
    {
      key: "valueBilUsd",
      header: "Kim ngạch (tỷ USD)",
      sortable: true,
      className: "text-right",
      render: (r) => r.valueBilUsd.toLocaleString("vi-VN", { maximumFractionDigits: 2 }),
    },
    {
      key: "sharePct",
      header: "Tỷ trọng",
      sortable: true,
      className: "text-right",
      render: (r) => `${r.sharePct}%`,
    },
    {
      key: "growthPct",
      header: "Tăng trưởng",
      sortable: true,
      className: "text-right",
      render: (r) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold tabular-nums",
            r.growthPct >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {r.growthPct >= 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          +{r.growthPct}%
        </span>
      ),
    },
    {
      key: "mainProducts",
      header: "Mặt hàng chính",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.mainProducts.map((p) => (
            <Badge
              key={p}
              variant="outline"
              className="rounded-md font-medium text-muted-foreground"
            >
              {p}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  const alertLevelClass: Record<string, string> = {
    Cao: "border-destructive/30 bg-destructive/10 text-destructive",
    "Trung bình": "border-warning/40 bg-warning/15 text-warning",
    Thấp: "border-border bg-surface text-muted-foreground",
  };

  return (
    <>
      <PageHeader
        title="Thị trường & Sản phẩm"
        description="Sản phẩm công nghiệp chủ lực, diễn biến giá, thị trường xuất khẩu và quản lý thị trường của Sở Công Thương tỉnh Tây Ninh — số liệu liên kết với Kho báo cáo & BI."
        crumbs={[{ label: "Nghiệp vụ" }, { label: "Thị trường & Sản phẩm" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setTab("legal");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Scale className="size-4" /> Căn cứ pháp lý
            </Button>
            <Button onClick={syncToBi}>
              <BarChart3 className="size-4" /> Đưa vào Báo cáo & BI
            </Button>
          </>
        }
      />

      <div className="space-y-5 p-4 sm:p-6">
        <KpiGrid k={kpis} />

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="products">Sản phẩm & giá cả</TabsTrigger>
              <TabsTrigger value="markets">Thị trường & xuất khẩu</TabsTrigger>
              <TabsTrigger value="news">Tin tức & cảnh báo</TabsTrigger>
              <TabsTrigger value="legal">Căn cứ pháp lý</TabsTrigger>
              <TabsTrigger value="ai">AI phân tích & dự báo</TabsTrigger>
            </TabsList>
          </div>

          {/* ---------------- SẢN PHẨM & GIÁ CẢ ---------------- */}
          <TabsContent value="products" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 rounded-md border-gov/25 bg-gov/5 font-medium text-gov"
              >
                <Boxes className="size-3" /> {filtered.length} sản phẩm
              </Badge>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-gov"
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <DataTable
              columns={columns}
              rows={filtered}
              onRowClick={(r) => setSelected(r)}
              searchPlaceholder="Tìm sản phẩm theo tên, nhóm, thị trường, tiêu chuẩn..."
            />

            <ChartCard
              title="Chỉ số giá theo nhóm hàng"
              subtitle="T1/2025 → T6/2026 · gốc 100 tại T1/2025 · đơn vị: điểm"
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={MARKET_PRICE_INDEX}
                  margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    domain={[95, (dataMax: number) => Math.ceil(dataMax / 10) * 10]}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: string) => [
                      `${Number(value).toFixed(1)} điểm`,
                      (
                        {
                          caoSu: "Cao su",
                          duong: "Đường – tinh bột",
                          nongSan: "Nông sản chế biến",
                          detMay: "Dệt may",
                          coKhi: "Cơ khí – điện tử",
                        } as Record<string, string>
                      )[name] ?? name,
                    ]}
                  />
                  <Line type="monotone" dataKey="caoSu" stroke={GOV} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="duong" stroke={TEAL} strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="nongSan"
                    stroke={WARNING}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="detMay"
                    stroke={SUCCESS}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="coKhi"
                    stroke={ANALYTICS}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <LegendDot color={GOV} label="Cao su" />
                <LegendDot color={TEAL} label="Đường – tinh bột" />
                <LegendDot color={WARNING} label="Nông sản chế biến" />
                <LegendDot color={SUCCESS} label="Dệt may" />
                <LegendDot color={ANALYTICS} label="Cơ khí – điện tử" />
                <span className="ml-auto">Chuỗi 18 tháng là đầu vào cho AI dự báo giá</span>
              </div>
            </ChartCard>
          </TabsContent>

          {/* ---------------- THỊ TRƯỜNG & XUẤT KHẨU ---------------- */}
          <TabsContent value="markets" className="mt-4 space-y-4">
            <section className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Cơ cấu thị trường xuất khẩu"
                subtitle="Kim ngạch 5T/2026 · 8,13 tỷ USD"
              >
                <MiniDonutChart
                  data={marketChart}
                  colors={[GOV, TEAL, WARNING, SUCCESS, ANALYTICS, DESTRUCTIVE, MUTED]}
                  height={220}
                />
              </ChartCard>
              <ChartCard
                title="Kim ngạch theo thị trường"
                subtitle="Đơn vị: tỷ USD · 5 tháng đầu năm 2026"
              >
                <MiniBarChart data={marketChart} fill={GOV} height={220} />
              </ChartCard>
            </section>

            <DataTable
              columns={marketColumns}
              rows={MARKET_EXPORT_MARKETS}
              searchPlaceholder="Tìm thị trường, mặt hàng..."
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoRow label="Thị trường lớn nhất">
                <span className="flex items-center gap-1.5">
                  <Globe2 className="size-3.5 text-gov" /> Hoa Kỳ — trên 2 tỷ USD
                </span>
              </InfoRow>
              <InfoRow label="Thương mại biên giới">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-gov" /> Cửa khẩu Mộc Bài, Xa Mát (Campuchia)
                </span>
              </InfoRow>
              <InfoRow label="Phạm vi xuất khẩu">
                <span className="flex items-center gap-1.5">
                  <Ship className="size-3.5 text-gov" /> Hơn 150 quốc gia và vùng lãnh thổ
                </span>
              </InfoRow>
            </div>
          </TabsContent>

          {/* ---------------- TIN TỨC & CẢNH BÁO ---------------- */}
          <TabsContent value="news" className="mt-4 space-y-4">
            <ChartCard
              title="Tin tức thị trường"
              subtitle="Tin đăng từ Cổng thông tin điện tử Sở Công Thương Tây Ninh (sct.tayninh.gov.vn)"
              actions={
                <Badge
                  variant="outline"
                  className="gap-1 rounded-md border-gov/25 bg-gov/5 font-medium text-gov"
                >
                  <Newspaper className="size-3" /> {marketNews.length} bài viết
                </Badge>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {marketNews.map((p) => (
                  <article
                    key={p.id}
                    className="flex gap-4 overflow-hidden rounded-md border border-border bg-surface/50 p-3 transition-colors hover:border-gov/40"
                  >
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="h-24 w-36 shrink-0 rounded-md object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-md border-teal/25 bg-teal/5 font-medium text-teal"
                        >
                          {p.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatPortalDate(p.publishedAt)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-navy">
                        {p.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {p.summary}
                      </p>
                      <a
                        href={p.source}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gov hover:text-navy"
                      >
                        <ExternalLink className="size-3" /> Xem nguồn
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </ChartCard>

            <section className="gov-card overflow-hidden">
              <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-warning/15 text-warning">
                  <AlertTriangle className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-navy">
                    Cảnh báo diễn biến thị trường
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Theo dõi biến động giá, cung cầu các nhóm hàng trên địa bàn tỉnh.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto shrink-0 rounded-md border-warning/40 bg-warning/15 text-warning"
                >
                  {MARKET_ALERTS.length} cảnh báo
                </Badge>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5">Mức độ</th>
                      <th className="px-3 py-2.5">Nhóm hàng</th>
                      <th className="px-3 py-2.5">Nội dung</th>
                      <th className="px-3 py-2.5">Từ</th>
                      <th className="px-3 py-2.5">Đề xuất xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {MARKET_ALERTS.map((a) => (
                      <tr key={a.id} className="align-top transition-colors hover:bg-gov/5">
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              alertLevelClass[a.level],
                            )}
                          >
                            {a.level}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-navy">{a.group}</td>
                        <td className="min-w-[260px] px-3 py-2.5">
                          <p className="font-medium text-foreground">{a.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                            {a.detail}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                          {a.since}
                        </td>
                        <td className="min-w-[240px] px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                          {a.suggestion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
                Cảnh báo do cán bộ Phòng Quản lý Thương mại cập nhật theo diễn biến giá thực tế và
                nguồn tin của Bộ Công Thương, Sở Công Thương Tây Ninh.
              </footer>
            </section>
          </TabsContent>

          {/* ---------------- CĂN CỨ PHÁP LÝ ---------------- */}
          <TabsContent value="legal" className="mt-4 space-y-4">
            <ChartCard
              title="Căn cứ pháp lý quản lý thị trường & sản phẩm"
              subtitle="Các văn bản của Quốc hội, Chính phủ, Bộ Công Thương và Sở Công Thương Tây Ninh quản lý thị trường"
              actions={
                <Badge
                  variant="outline"
                  className="gap-1 rounded-md border-gov/25 bg-gov/5 font-medium text-gov"
                >
                  <Scale className="size-3" /> {MARKET_LEGAL_BASIS.length} văn bản
                </Badge>
              }
            >
              <div className="space-y-3">
                {MARKET_LEGAL_BASIS.map((l) => (
                  <div
                    key={l.code}
                    className="rounded-md border border-border bg-surface/50 p-3.5 transition-colors hover:border-gov/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Scale className="size-4 text-gov" />
                        <p className="text-sm font-semibold text-navy">{l.code}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-md font-medium text-muted-foreground"
                        >
                          {l.agency}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-md font-medium text-muted-foreground"
                        >
                          {l.date}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">{l.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{l.summary}</p>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gov hover:text-navy"
                    >
                      <ExternalLink className="size-3" /> Xem nguồn văn bản
                    </a>
                  </div>
                ))}
              </div>
            </ChartCard>
          </TabsContent>

          {/* ---------------- AI PHÂN TÍCH & DỰ BÁO ---------------- */}
          <TabsContent value="ai" className="mt-4">
            <MarketAiPanel />
          </TabsContent>
        </Tabs>
      </div>

      <DetailDrawer
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.group} · ${selected.ward ?? ""}` : ""}
      >
        {selected ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <Badge
                variant="outline"
                className="rounded-md border-gov/25 bg-gov/5 font-medium text-gov"
              >
                {selected.group}
              </Badge>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  selected.trend >= 0
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {selected.trend >= 0 ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {selected.trend >= 0 ? "+" : ""}
                {selected.trend.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoRow label="Địa bàn sản xuất">{selected.ward ?? "—"}</InfoRow>
              <InfoRow label="Thị trường">{selected.market}</InfoRow>
              <InfoRow label="Sản lượng">
                {selected.output ? (
                  <span className="flex items-center gap-1.5">
                    <Landmark className="size-3.5 text-gov" />
                    {selected.output.toLocaleString("vi-VN")} {selected.unit ?? ""}
                  </span>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow label="Đơn giá tham chiếu">
                {selected.price ? (
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-gov" />
                    {selected.price.toLocaleString("vi-VN")} {selected.priceUnit ?? ""}
                  </span>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow label="Tiêu chuẩn">{selected.standard}</InfoRow>
              <InfoRow label="Chứng nhận">{selected.certificate}</InfoRow>
              <InfoRow label="Cơ sở SXKD">
                <span className="flex items-center gap-1.5">
                  <Boxes className="size-3.5 text-gov" />
                  {selected.facilities ?? 0} cơ sở
                </span>
              </InfoRow>
              <InfoRow label="Nhóm hàng">{selected.group}</InfoRow>
            </div>

            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-gov text-white hover:bg-gov/90" onClick={syncToBi}>
                <BarChart3 className="size-4" /> Đưa vào Báo cáo & BI
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/analytics" })}>
                <FileBarChart className="size-4" /> Mở Báo cáo
              </Button>
            </div>
          </>
        ) : null}
      </DetailDrawer>
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
