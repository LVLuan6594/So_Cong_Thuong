import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { Cluster } from "@/lib/types";

// Bản đồ mock dạng SVG (không dùng API GIS thật) — VIII.
export function GISMapCard({
  clusters,
  selectedId,
  onSelect,
  height = 420,
}: {
  clusters: Cluster[];
  selectedId?: string | null;
  onSelect?: (c: Cluster) => void;
  height?: number;
}) {
  const [popup, setPopup] = useState<Cluster | null>(null);
  const active = popup ?? clusters.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="gov-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
            Bản đồ cụm công nghiệp
          </h2>
          <p className="text-xs text-muted-foreground">
            Bản đồ mô phỏng (mock SVG) – sẵn sàng thay bằng lớp GIS thực tế
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Maximize2 className="size-4" /> Toàn màn hình
        </Button>
      </header>

      <div className="relative bg-surface" style={{ height }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M5 0 L0 0 0 5" fill="none" stroke="var(--border)" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {/* Ranh giới tỉnh mô phỏng */}
          <path
            d="M22 12 L60 8 L74 26 L82 52 L70 78 L44 92 L22 76 L14 44 Z"
            fill="var(--teal)"
            fillOpacity="0.08"
            stroke="var(--teal)"
            strokeWidth="0.5"
          />
          {/* Trục giao thông mô phỏng */}
          <path
            d="M18 70 L44 58 L66 62 L80 44"
            fill="none"
            stroke="var(--gov)"
            strokeOpacity="0.35"
            strokeWidth="0.6"
            strokeDasharray="2 1.5"
          />
        </svg>

        {clusters.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setPopup(c);
              onSelect?.(c);
            }}
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110",
              active?.id === c.id && "z-10 scale-110",
            )}
            aria-label={c.name}
          >
            <MapPin
              className={cn(
                "size-7 drop-shadow",
                c.occupancy >= 75 ? "text-success" : c.occupancy >= 50 ? "text-gov" : "text-warning",
              )}
              strokeWidth={2}
              fill="currentColor"
              fillOpacity={0.18}
            />
          </button>
        ))}

        {active ? (
          <div className="absolute bottom-3 left-3 w-72 rounded-lg border border-border bg-card p-3 shadow-panel">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase text-navy">{active.name}</h3>
              <StatusBadge status={active.status} />
            </div>
            <dl className="mt-2 space-y-1 text-xs">
              <Row label="Diện tích" value={`${active.area} ha`} />
              <Row label="Đã cho thuê" value={`${active.leased} ha`} />
              <Row label="Tỷ lệ lấp đầy" value={`${active.occupancy}%`} />
              <Row label="Doanh nghiệp" value={String(active.enterprises)} />
              <Row label="Ngành thu hút" value={active.sectors} />
            </dl>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link to="/industrial-clusters">Xem chi tiết</Link>
            </Button>
          </div>
        ) : null}

        <div className="absolute right-3 top-3 rounded-md border border-border bg-card/90 p-2 text-xs">
          <p className="mb-1 font-semibold text-navy">Tỷ lệ lấp đầy</p>
          <Legend color="bg-success" label="≥ 75%" />
          <Legend color="bg-gov" label="50 – 74%" />
          <Legend color="bg-warning" label="< 50%" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-full", color)} /> {label}
    </p>
  );
}
