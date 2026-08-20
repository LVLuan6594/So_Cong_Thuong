import { useMemo, useState } from "react";
import { BatteryCharging, Search } from "lucide-react";
import { EnergyEmpty, EnergyStatusBadge } from "@/components/energy/EnergyShared";
import type { ChargingStation } from "@/lib/energy-types";
import { cn } from "@/lib/utils";

export function ChargingTables({
  stations,
  selectedId,
  onSelect,
}: {
  stations: ChargingStation[];
  selectedId?: string | null;
  onSelect: (station: ChargingStation) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("Tất cả");
  const [query, setQuery] = useState("");

  const types = useMemo(
    () => ["Tất cả", ...Array.from(new Set(stations.map((s) => s.type)))],
    [stations],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stations.filter((s) => {
      if (typeFilter !== "Tất cả" && s.type !== typeFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q)
      );
    });
  }, [stations, typeFilter, query]);

  const totalPorts = (s: ChargingStation) => s.ports.ccs2 + s.ports.chademo + s.ports.acType2;

  return (
    <div className="gov-card overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-gov/10 text-gov">
          <BatteryCharging className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy">
            Danh sách trạm sạc điện
          </h2>
          <p className="text-xs text-muted-foreground">
            Bấm vào một trạm để xem hồ sơ và định vị trên bản đồ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trạm sạc..."
              className="h-8 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-surface px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </header>

      {rows.length === 0 ? (
        <EnergyEmpty title="Không có trạm sạc phù hợp" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Trạm sạc</th>
                <th className="px-3 py-2.5">Công suất</th>
                <th className="px-3 py-2.5">Số cổng</th>
                <th className="px-3 py-2.5">Cổng trống</th>
                <th className="px-3 py-2.5">Chuẩn sạc</th>
                <th className="px-3 py-2.5">Loại</th>
                <th className="px-3 py-2.5">Địa bàn</th>
                <th className="px-3 py-2.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => {
                const active = selectedId === s.id;
                const ratio = totalPorts(s) ? (s.freePorts / totalPorts(s)) * 100 : 0;
                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className={cn(
                      "cursor-pointer border-l-2 border-transparent transition-colors hover:bg-surface",
                      active && "border-gov bg-gov/5",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cn("font-semibold", active ? "text-gov" : "text-navy")}>
                        {s.name}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">{s.code}</span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-navy">{s.powerKw} kW</td>
                    <td className="px-3 py-2.5 tabular-nums">{totalPorts(s)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          ratio <= 10
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : ratio <= 40
                              ? "border-warning/40 bg-warning/15 text-warning"
                              : "border-success/30 bg-success/10 text-success",
                        )}
                      >
                        {s.freePorts}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      CCS2 {s.ports.ccs2} · CHAdeMO {s.ports.chademo} · AC {s.ports.acType2}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.type}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.district}</td>
                    <td className="px-3 py-2.5">
                      <EnergyStatusBadge status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
