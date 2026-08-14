// ============================================================
// AI PHÂN TÍCH & DỰ BÁO — Trang Thị trường & Sản phẩm
// Demo: hồi quy tuyến tính + sóng mùa vụ trên chuỗi chỉ số giá
// theo nhóm hàng (MARKET_PRICE_INDEX), ngưỡng tham chiếu = CPI
// bình quân (~4%/năm). Kết quả deterministic để mọi ô AI giải
// thích được. KHÔNG phải model thật.
// ============================================================
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  Gauge,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/common/StatCard";
import {
  MARKET_CPI_THRESHOLD,
  computeMarketForecast,
  type MarketForecastHorizon,
} from "@/lib/market-service";
import { cn } from "@/lib/utils";

const HORIZONS: MarketForecastHorizon[] = ["Quý", "6 tháng", "1 năm"];

const fmt = (v: number) => v.toFixed(1);

export function MarketAiPanel() {
  const [horizon, setHorizon] = useState<MarketForecastHorizon>("6 tháng");
  const forecast = useMemo(() => computeMarketForecast(horizon), [horizon]);

  return (
    <section className="gov-card flex flex-col overflow-hidden">
      <span className="h-1 bg-gradient-to-r from-analytics via-gov to-teal" />
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-gradient-to-r from-analytics/15 via-transparent to-transparent px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-analytics/15 text-analytics">
          <BrainCircuit className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
              AI phân tích &amp; dự báo
            </h2>
            <Badge
              variant="outline"
              className="rounded-md border-analytics/30 bg-analytics/10 text-analytics"
            >
              <Sparkles className="size-3" />
              Bản phân tích AI
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dự báo diễn biến chỉ số giá theo nhóm hàng nhằm hỗ trợ theo dõi thị trường, điều tiết
            cung cầu và bình ổn giá của Sở Công Thương.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
          {HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                horizon === h
                  ? "bg-gov text-white shadow-sm"
                  : "text-muted-foreground hover:bg-surface hover:text-navy",
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Chỉ số giá hiện tại"
            value={fmt(forecast.currentIndex)}
            delta="Gốc 100 tại T1/2025"
            icon={Gauge}
            tone="gov"
          />
          <StatCard
            label="Dự báo cuối kỳ"
            value={fmt(forecast.forecastEnd)}
            delta={`Cuối kỳ ${horizon.toLowerCase()}`}
            icon={TrendingUp}
            tone="gov"
          />
          <StatCard
            label="Tăng trưởng bình quân"
            value={`+${forecast.growthAnnualPct.toFixed(1)}%/năm`}
            delta="Theo xu hướng 12 tháng"
            icon={Activity}
            tone={forecast.growthAnnualPct > 4 ? "warning" : "success"}
          />
          <StatCard
            label="Nhóm tăng giá dự kiến"
            value={`${forecast.risers.length}/5 nhóm`}
            delta="Theo dõi sát diễn biến"
            icon={AlertTriangle}
            tone="analytics"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="gov-card flex flex-col">
            <header className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-navy">
                Dự báo chỉ số giá bình quân nhóm hàng
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chuỗi 18 tháng (T1/2025 → T6/2026) · kỳ dự báo {horizon.toLowerCase()}
              </p>
            </header>
            <div className="flex-1 p-4">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart
                  data={forecast.points}
                  margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    domain={[
                      90,
                      (dataMax: number) =>
                        Math.ceil((Math.max(dataMax, MARKET_CPI_THRESHOLD) * 1.06) / 5) * 5,
                    ]}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: string) => {
                      if (typeof value !== "number") return [String(value ?? ""), name];
                      const label =
                        name === "actual"
                          ? "Thực tế"
                          : name === "forecast"
                            ? "Dự báo"
                            : name === "threshold"
                              ? "Ngưỡng CPI"
                              : name;
                      return [`${fmt(value)} điểm`, label];
                    }}
                  />
                  <ReferenceLine
                    y={MARKET_CPI_THRESHOLD}
                    stroke="#E59A23"
                    strokeDasharray="5 5"
                    label={{ value: "CPI ~4%/năm", position: "insideTopRight", fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="actual"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="forecast"
                    stroke="#1565C0"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <LegendDot color="#94A3B8" label="Thực tế" />
                <LegendDot color="#1565C0" label="Dự báo" />
                <LegendDot color="#E59A23" dashed label="Ngưỡng CPI tham chiếu (104)" />
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <section className="gov-card flex flex-col">
              <header className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-gov/10 text-gov">
                  <Sparkles className="size-4.5" />
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-navy">
                  Nhận định AI
                </h3>
              </header>
              <div className="space-y-3 p-4 text-xs leading-5">
                <p className="rounded-md border border-gov/30 bg-gov/5 px-3 py-2.5 text-navy">
                  {forecast.insights}
                </p>
                <p className="text-muted-foreground">
                  Nhóm cao su và cơ khí – điện tử dẫn dắt xu hướng tăng nhờ nhu cầu Trung Quốc phục
                  hồi và đơn hàng dây điện ô tô, kết cấu thép sang Hoa Kỳ, Nhật Bản tăng. Dệt may và
                  nông sản chế biến tăng chậm hơn, cần đẩy mạnh xúc tiến thương mại.
                </p>
                <p className="rounded-md border border-border bg-surface px-3 py-2.5 text-muted-foreground">
                  Gợi ý cán bộ chuyên môn: theo dõi sát diễn biến giá 4 tháng tới; nếu chỉ số vượt
                  ngưỡng CPI bình quân kéo dài, tham mưu UBND tỉnh giải pháp điều tiết cung cầu theo
                  Luật Giá 2023.
                </p>
              </div>
            </section>
          </div>
        </div>

        <section className="gov-card overflow-hidden">
          <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-warning/15 text-warning">
              <TrendingUp className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-navy">
                Nhóm hàng cần quan tâm
              </h3>
              <p className="text-xs text-muted-foreground">
                Dự báo biến động giá cuối kỳ so với tháng gần nhất (T6/2026).
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto shrink-0 rounded-md border-warning/40 bg-warning/15 text-warning"
            >
              {forecast.risers.length} nhóm tăng · {forecast.fallers.length} nhóm giảm
            </Badge>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Nhóm hàng</th>
                  <th className="px-3 py-2.5">Hiện tại</th>
                  <th className="px-3 py-2.5">Dự báo cuối kỳ</th>
                  <th className="px-3 py-2.5">Biến động</th>
                  <th className="px-3 py-2.5">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...forecast.risers, ...forecast.fallers].map((c) => {
                  const up = c.changePct >= 0;
                  return (
                    <tr key={c.group} className="transition-colors hover:bg-gov/5">
                      <td className="px-4 py-2.5 font-medium text-navy">{c.group}</td>
                      <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                        {fmt(c.current)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{fmt(c.forecast)}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-semibold",
                            up ? "text-destructive" : "text-success",
                          )}
                        >
                          {up ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )}
                          {up ? "+" : ""}
                          {c.changePct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            Math.abs(c.changePct) >= 5
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : Math.abs(c.changePct) >= 2
                                ? "border-warning/40 bg-warning/15 text-warning"
                                : "border-border bg-surface text-muted-foreground",
                          )}
                        >
                          {Math.abs(c.changePct) >= 5
                            ? "Mạnh"
                            : Math.abs(c.changePct) >= 2
                              ? "Trung bình"
                              : "Nhẹ"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            Dự báo theo hồi quy tuyến tính + sóng mùa vụ trên chuỗi chỉ số giá 18 tháng; biến động
            nhóm cao su, cơ khí – điện tử có biên độ lớn hơn theo mùa vụ.
          </footer>
        </section>

        <p className="text-[11px] leading-4 text-muted-foreground">
          Kết quả phân tích và dự báo chỉ hỗ trợ công tác chuyên môn, không thay thế việc kiểm tra,
          đánh giá của cán bộ và cơ quan quản lý. Dữ liệu dự báo được sinh bằng hồi quy tuyến tính
          trên chuỗi lịch sử (deterministic) — chưa phải mô hình AI huấn luyện thực tế.
        </p>
      </div>
    </section>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={
          dashed
            ? { border: `2px dashed ${color}`, background: "transparent" }
            : { background: color }
        }
      />
      {label}
    </span>
  );
}
