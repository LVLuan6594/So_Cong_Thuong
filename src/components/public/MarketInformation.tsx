import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicThumb, portalDetailTo } from "@/components/public/PublicShared";
import { SectionHeader } from "@/components/public/SectionHeader";
import { formatPortalDate } from "@/lib/portal-service";
import { PORTAL_MARKET_KPIS } from "@/data/portal";
import type { PortalPost } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE_TEXT: Record<string, string> = {
  success: "text-success",
  gov: "text-gov",
  warning: "text-warning",
  teal: "text-teal",
};

export function MarketInformation({ items }: { items: PortalPost[] }) {
  return (
    <section id="thi-truong" className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nắm bắt diễn biến"
          title="Thông tin thị trường"
          description="Giá cả, xu hướng thị trường, xuất nhập khẩu và tình hình sản xuất công nghiệp trên địa bàn tỉnh."
        />

        {/* KPI nhỏ — giữ nhẹ nhàng, không biến trang thành dashboard */}
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PORTAL_MARKET_KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-navy">
                {k.value}
                <span className="ml-1 text-xs font-medium text-muted-foreground">{k.unit}</span>
              </p>
              <p className={cn("mt-0.5 text-xs font-semibold", TONE_TEXT[k.tone])}>{k.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {items.map((p) => (
            <Link
              key={p.id}
              to={portalDetailTo(p)}
              className="group flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-xl"
            >
              <PublicThumb post={p} className="h-full w-40 shrink-0 sm:w-52" />
              <div className="flex flex-col justify-center p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gov">
                  {p.category}
                </p>
                <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-navy transition-colors group-hover:text-gov">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  {formatPortalDate(p.publishedAt)}
                  <ArrowRight className="size-3.5 text-gov transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
