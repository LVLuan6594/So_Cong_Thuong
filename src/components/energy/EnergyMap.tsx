import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type {
  ChargingStation,
  EmissionSource,
  EnergyGisData,
  GridIncident,
  PowerProject,
  Substation,
} from "@/lib/energy-types";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const TAY_NINH_CENTER: [number, number] = [11.3066, 106.15];

export type EnergyMapLayerKey =
  | "substations"
  | "lines500"
  | "lines220"
  | "lines110"
  | "lines22"
  | "poles"
  | "projects"
  | "rooftopSolar"
  | "incidents"
  | "emissions"
  | "chargingStations";

const DEFAULT_LAYERS: EnergyMapLayerKey[] = [
  "substations",
  "lines500",
  "lines220",
  "lines110",
  "lines22",
  "projects",
  "rooftopSolar",
  "incidents",
  "emissions",
  "chargingStations",
];

const LAYER_LABEL: Record<EnergyMapLayerKey, string> = {
  substations: "Trạm biến áp",
  lines500: "Đường dây 500kV",
  lines220: "Đường dây 220kV",
  lines110: "Đường dây 110kV",
  lines22: "Đường dây 22kV",
  poles: "Trụ điện",
  projects: "Dự án nguồn điện",
  rooftopSolar: "Điện mặt trời mái nhà",
  incidents: "Sự cố",
  emissions: "Phát thải Carbon",
  chargingStations: "Trạm sạc",
};

type EnergyMapEntity =
  | { kind: "substation"; item: Substation }
  | { kind: "project"; item: PowerProject }
  | { kind: "incident"; item: GridIncident }
  | { kind: "emission"; item: EmissionSource }
  | { kind: "charging"; item: ChargingStation };

function pointKey(entity: EnergyMapEntity) {
  return `${entity.kind}:${entity.item.id}`;
}

function rowHtml(label: string, value: string | number | undefined) {
  return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;padding:2px 0"><span style="color:#64748b">${label}</span><span style="font-weight:600;color:#0f2a4a;text-align:right">${value ?? "Đang cập nhật"}</span></div>`;
}

function markerColor(kind: EnergyMapEntity["kind"], item: EnergyMapEntity["item"]) {
  if (kind === "incident") return "#C62828";
  if (kind === "charging") return "#7C3AED";
  if (kind === "emission") return "#2E7D32";
  if (kind === "project") return "#E59A23";
  if ("loadFactor" in item && (item.loadFactor ?? 0) >= 100) return "#C62828";
  return "#1565C0";
}

function iconHtml(kind: EnergyMapEntity["kind"], color: string, selected: boolean) {
  const glyph =
    kind === "substation"
      ? "⚡"
      : kind === "project"
        ? "✦"
        : kind === "incident"
          ? "!"
          : kind === "emission"
            ? "CO₂"
            : "EV";
  const ring = selected ? "box-shadow:0 0 0 4px rgba(21,101,192,.25);" : "";
  return `<div style="width:28px;height:28px;border-radius:999px;background:${color};border:2px solid #fff;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:800;${ring}">${glyph}</div>`;
}

function buildPopup(entity: EnergyMapEntity, onOpen: () => void): HTMLElement {
  const el = document.createElement("div");
  el.style.minWidth = "245px";
  el.style.fontFamily = "Inter, system-ui, sans-serif";

  if (entity.kind === "substation") {
    const s = entity.item;
    el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${s.name}</div>
      ${rowHtml("Cấp điện áp", s.voltageLevel)}
      ${rowHtml("Công suất", `${s.designCapacity ?? 0} MVA`)}
      ${rowHtml("Mức tải", `${s.loadFactor ?? 0}%`)}
      ${rowHtml("Hệ số tải", (s.loadFactor ?? 0) / 100)}
      ${rowHtml("Trạng thái", s.status)}
      <button class="energy-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  } else if (entity.kind === "project") {
    const p = entity.item;
    el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${p.name}</div>
      ${rowHtml("Loại nguồn", p.type)}
      ${rowHtml("Công suất", `${p.designCapacityMw ?? 0} MW`)}
      ${rowHtml("Địa bàn", p.district)}
      ${rowHtml("Trạng thái", p.status)}
      <button class="energy-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  } else if (entity.kind === "incident") {
    const i = entity.item;
    el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${i.code}</div>
      ${rowHtml("Loại", i.type)}
      ${rowHtml("Thời gian", i.time)}
      ${rowHtml("Địa điểm", i.location)}
      ${rowHtml("Tiến độ", i.progress)}
      <button class="energy-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  } else if (entity.kind === "emission") {
    const e = entity.item;
    el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${e.unit}</div>
      ${rowHtml("Nguồn", e.sourceType)}
      ${rowHtml("CO2e", `${e.co2e.toLocaleString("vi-VN")} tấn`)}
      ${rowHtml("Cường độ", `${e.intensity} gCO2e/kWh`)}
      <button class="energy-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  } else {
    const c = entity.item;
    el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${c.name}</div>
      ${rowHtml("Công suất", `${c.powerKw} kW`)}
      ${rowHtml("Số cổng", c.ports.ccs2 + c.ports.chademo + c.ports.acType2)}
      ${rowHtml("Cổng trống", c.freePorts)}
      ${rowHtml("Trạng thái", c.status)}
      <button class="energy-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  }

  el.querySelector<HTMLElement>(".energy-open-profile")?.addEventListener("click", onOpen);
  return el;
}

export function EnergyMap({
  data,
  selectedKey,
  onSelectEntity,
  height = 560,
  compact = false,
}: {
  data: EnergyGisData;
  selectedKey?: string | null;
  onSelectEntity?: (entity: EnergyMapEntity) => void;
  height?: number;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markerByKeyRef = useRef<Map<string, LeafletMarker>>(new Map());
  const [ready, setReady] = useState(false);
  const [layersOpen, setLayersOpen] = useState(!compact);
  const [visibleLayers, setVisibleLayers] = useState<EnergyMapLayerKey[]>(
    compact ? ["substations", "projects", "incidents", "chargingStations"] : DEFAULT_LAYERS,
  );

  const points = useMemo<EnergyMapEntity[]>(
    () => [
      ...data.substations
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({ kind: "substation" as const, item })),
      ...data.projects
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({ kind: "project" as const, item })),
      ...data.incidents
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({ kind: "incident" as const, item })),
      ...data.emissionSources
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({ kind: "emission" as const, item })),
      ...data.chargingStations
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({ kind: "charging" as const, item })),
    ],
    [data],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, { center: TAY_NINH_CENTER, zoom: compact ? 9 : 10 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerByKeyRef.current.clear();
      setReady(false);
    };
  }, [compact]);

  useEffect(() => {
    if (!ready) return;
    const layer = layerRef.current;
    if (!layer) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      layer.clearLayers();
      markerByKeyRef.current.clear();

      data.lines.forEach((line) => {
        if (!line.route?.length) return;
        const layerKey =
          line.voltageLevel === "500kV"
            ? "lines500"
            : line.voltageLevel === "220kV"
              ? "lines220"
              : line.voltageLevel === "110kV"
                ? "lines110"
                : "lines22";
        if (!visibleLayers.includes(layerKey)) return;
        const color =
          line.voltageLevel === "500kV"
            ? "#C62828"
            : line.voltageLevel === "220kV"
              ? "#E59A23"
              : line.voltageLevel === "110kV"
                ? "#1565C0"
                : "#00897B";
        L.polyline(line.route, { color, weight: compact ? 2 : 3, opacity: 0.82 })
          .addTo(layer)
          .bindPopup(
            `<div style="min-width:230px;font-family:Inter,system-ui,sans-serif">
              <div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${line.name}</div>
              ${rowHtml("Mã tuyến", line.code)}
              ${rowHtml("Cấp điện áp", line.voltageLevel)}
              ${rowHtml("Điểm đầu", line.fromPoint)}
              ${rowHtml("Điểm cuối", line.toPoint)}
              ${rowHtml("Chiều dài", `${line.lengthKm} km`)}
              ${rowHtml("Khả năng tải", `${line.capacityMw ?? 0} MW`)}
              ${rowHtml("Tải thực tế", `${line.actualLoadMw ?? 0} MW`)}
              ${rowHtml("Tổn thất", `${line.lossPct ?? 0}%`)}
              ${rowHtml("Trạng thái", line.status)}
            </div>`,
          );
      });

      if (visibleLayers.includes("poles") && !compact) {
        data.poles.forEach((pole) => {
          if (!pole.latitude || !pole.longitude) return;
          L.circleMarker([pole.latitude, pole.longitude], {
            radius: 4,
            color: "#0f2a4a",
            fillColor: "#ffffff",
            fillOpacity: 1,
            weight: 1.5,
          })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:200px;font-family:Inter,system-ui,sans-serif">
                <div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${pole.code}</div>
                ${rowHtml("Số trụ", pole.number)}
                ${rowHtml("Tuyến", pole.lineCode)}
                ${rowHtml("Loại", pole.type)}
                ${rowHtml("Hành lang", pole.safetyCorridor)}
              </div>`,
            );
        });
      }

      points.forEach((entity) => {
        const key = pointKey(entity);
        const show =
          (entity.kind === "substation" && visibleLayers.includes("substations")) ||
          (entity.kind === "project" && visibleLayers.includes("projects")) ||
          (entity.kind === "incident" && visibleLayers.includes("incidents")) ||
          (entity.kind === "emission" && visibleLayers.includes("emissions")) ||
          (entity.kind === "charging" && visibleLayers.includes("chargingStations"));
        if (!show) return;
        const lat = entity.item.latitude;
        const lng = entity.item.longitude;
        if (!lat || !lng) return;
        const selected = key === selectedKey;
        const color = markerColor(entity.kind, entity.item);
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "energy-map-pin",
            html: iconHtml(entity.kind, color, selected),
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
          title: "name" in entity.item ? entity.item.name : entity.item.code,
        })
          .addTo(layer)
          .bindPopup(buildPopup(entity, () => onSelectEntity?.(entity)));
        marker.on("click", () => onSelectEntity?.(entity));
        markerByKeyRef.current.set(key, marker);
      });

      if (selectedKey) markerByKeyRef.current.get(selectedKey)?.openPopup();
    })();
    return () => {
      cancelled = true;
    };
  }, [compact, data, onSelectEntity, points, ready, selectedKey, visibleLayers]);

  useEffect(() => {
    if (!ready || !selectedKey) return;
    const marker = markerByKeyRef.current.get(selectedKey);
    const map = mapRef.current;
    if (!marker || !map) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), compact ? 10 : 12), { duration: 0.5 });
    marker.openPopup();
  }, [compact, ready, selectedKey]);

  const toggleLayer = (key: EnergyMapLayerKey) => {
    setVisibleLayers((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  return (
    <div className="relative bg-surface" style={{ height }}>
      <div
        ref={containerRef}
        className="energy-map z-0 w-full"
        style={{ height }}
        aria-label="Bản đồ GIS năng lượng tỉnh Tây Ninh"
      />

      {!compact ? (
        <div className="absolute left-3 top-3 z-[500] w-56 rounded-md border border-border bg-card/95 shadow-panel backdrop-blur">
          <button
            type="button"
            onClick={() => setLayersOpen((value) => !value)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wide text-navy"
          >
            Lớp bản đồ
            <span className="text-muted-foreground">{layersOpen ? "Thu gọn" : "Mở"}</span>
          </button>
          {layersOpen ? (
            <div className="max-h-72 space-y-1 overflow-y-auto border-t border-border p-2">
              {(Object.keys(LAYER_LABEL) as EnergyMapLayerKey[]).map((key) => (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-surface",
                    visibleLayers.includes(key) ? "text-navy" : "text-muted-foreground",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={visibleLayers.includes(key)}
                    onChange={() => toggleLayer(key)}
                    className="size-3.5 accent-blue-700"
                  />
                  <span className="truncate">{LAYER_LABEL[key]}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="absolute bottom-3 right-3 z-[500] rounded-md border border-border bg-card/95 p-2 text-xs shadow-panel backdrop-blur">
        <Legend color="bg-gov" label="Trạm biến áp" />
        <Legend color="bg-warning" label="Dự án nguồn điện" />
        <Legend color="bg-destructive" label="Sự cố" />
        <Legend color="bg-analytics" label="Trạm sạc" />
      </div>
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

export type { EnergyMapEntity };
