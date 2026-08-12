import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Landmark, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* Decorative background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(21,101,192,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(0,137,123,0.3),transparent_50%)]"
      />
      <div
        aria-hidden
        className="absolute -right-24 -top-24 size-96 rounded-full bg-gov/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-16 size-80 rounded-full bg-teal/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            <Landmark className="size-3.5" /> Cổng thông tin ngành Công Thương
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            THÔNG TIN NGÀNH CÔNG THƯƠNG
            <span className="block bg-gradient-to-r from-sky-300 via-white to-emerald-200 bg-clip-text text-transparent">
              TỈNH TÂY NINH
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Cập nhật thông tin – Kết nối doanh nghiệp – Xúc tiến thương mại – Đồng hành cùng nhà đầu
            tư và người dân trên địa bàn tỉnh.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white px-6 text-navy shadow-lg hover:bg-white/90"
            >
              <Link to="/trang-thong-tin" search={{ muc: "tin-tuc" }}>
                Khám phá thông tin <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-white/5 px-6 text-white hover:bg-white/15 hover:text-white"
            >
              <Link to="/trang-thong-tin" search={{ muc: "dau-tu" }}>
                <Building2 className="size-4" /> Cơ hội đầu tư
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-6 text-sm">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="size-5 text-emerald-300" />
              <div>
                <p className="font-semibold text-white">Xúc tiến thương mại</p>
                <p className="text-xs text-white/60">Hội chợ, kết nối giao thương</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-sky-300" />
              <div>
                <p className="font-semibold text-white">Đồng hành đầu tư</p>
                <p className="text-xs text-white/60">KCN/CCN, dự án hạ tầng</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Landmark className="size-5 text-teal-300" />
              <div>
                <p className="font-semibold text-white">Kết nối doanh nghiệp</p>
                <p className="text-xs text-white/60">Cổng thông tin 3 bên</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
