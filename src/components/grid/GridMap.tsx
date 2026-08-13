import { useEffect, useMemo, useRef, useState } from "react";
import type { Layer, LayerGroup, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type {
  GridPlanAsset,
  GridPowerLine,
  GridPowerPole,
  GridSubstation,
  Task1GridData,
} from "@/lib/grid-types";
import { GRID_CONFIG, OPERATION_STATUS_LABEL } from "@/lib/grid-types";
import { buildCorridorPolygon, corridorWidthM } from "@/lib/grid-geo";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const TAY_NINH_CENTER: [number, number] = [11.35, 106.08];

export type GridMode = "station" | "grid" | "all";

export type GridMapEntity =
  | { kind: "substation"; item: GridSubstation }
  | { kind: "line"; item: GridPowerLine }
  | { kind: "pole"; item: GridPowerPole }
  | { kind: "plan"; item: GridPlanAsset };

export type GridLayerKey =
  | "substations"
  | "lines"
  | "poles"
  | "supplyAreas"
  | "loadAreas"
  | "planning"
  | "corridors"
  | "connectionPoints"
  | "incidents"
  | "overloadZones"
  | "renewables";

const LAYER_LABEL: Record<GridLayerKey, string> = {
  substations: "Trạm biến áp",
  lines: "Đường dây",
  poles: "Trụ điện",
  supplyAreas: "Vùng cấp điện",
  loadAreas: "Vùng phụ tải",
  planning: "Quy hoạch",
  corridors: "Hành lang an toàn (NĐ 14/2014)",
  connectionPoints: "Điểm đấu nối",
  incidents: "Điểm sự cố",
  overloadZones: "Khu vực quá tải",
  renewables: "Nguồn NLTT đấu nối",
};

export const LINE_COLOR: Record<string, string> = {
  "500kV": "#C62828",
  "220kV": "#E59A23",
  "110kV": "#1565C0",
};

export function rowHtml(label: string, value: string | number | undefined) {
  return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;padding:2px 0"><span style="color:#64748b">${label}</span><span style="font-weight:600;color:#0f2a4a;text-align:right">${value ?? "Đang cập nhật"}</span></div>`;
}

export function entityKey(entity: GridMapEntity) {
  return `${entity.kind}:${entity.item.id}`;
}

export function wirePopupButton(target: Layer, onClick: () => void) {
  target.on("popupopen", () => {
    const btn = target.getPopup()?.getElement()?.querySelector<HTMLElement>(".grid-open-profile");
    btn?.addEventListener("click", onClick);
  });
}

export function substationColor(s: GridSubstation) {
  if (s.status === "Quy hoạch") return "#94A3B8";
  const load = s.loadFactor ?? 0;
  if (load >= GRID_CONFIG.thresholds.substationLoadCriticalPct) return "#C62828";
  if (load >= GRID_CONFIG.thresholds.substationLoadWarnPct) return "#F59E0B";
  return "#1565C0";
}

export function buildSubstationPopup(s: GridSubstation, onOpen: () => void) {
  const el = document.createElement("div");
  el.style.minWidth = "250px";
  el.style.fontFamily = "Inter, system-ui, sans-serif";
  el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${s.name}</div>
    ${rowHtml("Mã trạm", s.code)}
    ${rowHtml("Cấp điện áp", s.voltageLevel)}
    ${rowHtml("Công suất TK", `${s.designCapacity ?? 0} MVA`)}
    ${rowHtml("Hệ số tải", `${s.loadFactor ?? 0}%`)}
    ${rowHtml("Đóng/cắt", s.switchingState ? OPERATION_STATUS_LABEL[s.switchingState] : "Đang vận hành")}
    ${rowHtml("Trạng thái", s.status)}
    ${rowHtml("Đơn vị quản lý", s.operator)}
    <button class="grid-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  el.querySelector<HTMLElement>(".grid-open-profile")?.addEventListener("click", onOpen);
  return el;
}

export function buildLinePopup(l: GridPowerLine, onOpen: () => void) {
  const el = document.createElement("div");
  el.style.minWidth = "250px";
  el.style.fontFamily = "Inter, system-ui, sans-serif";
  el.innerHTML = `<div style="font-weight:700;color:#0f2a4a;margin-bottom:8px">${l.name}</div>
    ${rowHtml("Mã tuyến", l.code)}
    ${rowHtml("Cấp điện áp", l.voltageLevel)}
    ${rowHtml("Chiều dài", `${l.lengthKm} km`)}
    ${rowHtml("Khả năng tải", `${l.capacityMw ?? 0} MW`)}
    ${rowHtml("Tải thực tế", `${l.actualLoadMw ?? 0} MW`)}
    ${rowHtml("Tổn thất", `${l.lossPct ?? 0}%`)}
    ${rowHtml("Đóng/cắt", l.switchingState ? OPERATION_STATUS_LABEL[l.switchingState] : "Đang vận hành")}
    ${rowHtml("Trạng thái", l.status)}
    <button class="grid-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button>`;
  el.querySelector<HTMLElement>(".grid-open-profile")?.addEventListener("click", onOpen);
  return el;
}

export function GridMap({
  data,
  mode,
  selectedKey,
  onSelectEntity,
  height = 520,
}: {
  data: Task1GridData;
  mode: GridMode;
  selectedKey?: string | null;
  onSelectEntity?: (entity: GridMapEntity) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markerByKeyRef = useRef<Map<string, LeafletMarker>>(new Map());
  const [ready, setReady] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<GridLayerKey[]>([
    "substations",
    "lines",
    "poles",
    "supplyAreas",
    "loadAreas",
    "planning",
    "corridors",
    "connectionPoints",
    "incidents",
    "overloadZones",
    "renewables",
  ]);

  const entities = useMemo<GridMapEntity[]>(
    () => [
      ...data.substations
        .filter((s) => s.latitude && s.longitude)
        .map((item) => ({ kind: "substation" as const, item })),
      ...data.lines.map((item) => ({ kind: "line" as const, item })),
      ...data.poles
        .filter((p) => p.latitude && p.longitude)
        .map((item) => ({ kind: "pole" as const, item })),
      ...data.planned
        .filter((a) => a.latitude && a.longitude)
        .map((item) => ({ kind: "plan" as const, item })),
    ],
    [data],
  );

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    const markers = markerByKeyRef.current;
    const onResize = () => {
      if (mapRef.current && containerRef.current) mapRef.current.invalidateSize();
    };
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, { center: TAY_NINH_CENTER, zoom: 10 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      window.addEventListener("resize", onResize);
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(onResize);
        observer.observe(containerRef.current);
      }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
      setReady(false);
    };
  }, []);

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

      const drawAreas = mode !== "station";
      const visible = (key: GridLayerKey) => visibleLayers.includes(key);
      if (drawAreas && visible("supplyAreas")) {
        data.supplyAreas.forEach((area) => {
          area.polygons.forEach((ring) => {
            L.polygon(ring, {
              color: "#0F766E",
              weight: 1.5,
              fillColor: "#0F766E",
              fillOpacity: 0.14,
              dashArray: "4 4",
            })
              .addTo(layer)
              .bindPopup(
                `<div style="min-width:220px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">${area.name}</div>${rowHtml("Trạm nguồn", area.substationId)}${rowHtml("Địa bàn", area.district)}</div>`,
              );
          });
        });
      }

      if (drawAreas && visible("loadAreas")) {
        data.loadAreas.forEach((area) => {
          area.polygons.forEach((ring) => {
            L.polygon(ring, {
              color: "#7C3AED",
              weight: 1.5,
              fillColor: "#7C3AED",
              fillOpacity: 0.1,
              dashArray: "3 4",
            })
              .addTo(layer)
              .bindPopup(
                `<div style="min-width:220px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">${area.name}</div>${rowHtml("Địa bàn", area.district)}${rowHtml("Phụ tải cực đại", `${area.peakMw} MW`)}</div>`,
              );
          });
        });
      }

      // Hành lang an toàn — bề rộng theo cấp điện áp (Nghị định 14/2014/NĐ-CP).
      if (drawAreas && visible("corridors")) {
        data.lines.forEach((line) => {
          if (!line.route?.length) return;
          const widthM =
            line.status === "Quy hoạch"
              ? (line.planning?.corridorWidthM ?? corridorWidthM(line.voltageLevel))
              : corridorWidthM(line.voltageLevel);
          const poly = buildCorridorPolygon(line.route, widthM);
          if (!poly.length) return;
          L.polygon(poly, {
            color: "#F59E0B",
            weight: 1,
            fillColor: "#F59E0B",
            fillOpacity: 0.07,
            dashArray: "4 4",
          })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:230px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">Hành lang an toàn — ${line.name}</div>${rowHtml("Cấp điện áp", line.voltageLevel)}${rowHtml("Bề rộng mỗi phía", `${widthM} m`)}${rowHtml("Căn cứ", "NĐ 14/2014/NĐ-CP, Điều 11")}${rowHtml("Tình trạng", line.corridorStatus ?? "Chưa đánh giá")}</div>`,
            );
        });
      }

      // Khu vực quá tải — trạm/tuyến vượt ngưỡng.
      if (drawAreas && visible("overloadZones")) {
        data.overloadZones.forEach((zone) => {
          zone.polygons.forEach((ring) => {
            L.polygon(ring, {
              color: "#C62828",
              weight: 2,
              fillColor: "#C62828",
              fillOpacity: 0.12,
              dashArray: "6 4",
            })
              .addTo(layer)
              .bindPopup(
                `<div style="min-width:240px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#C62828;margin-bottom:6px">${zone.label}</div>${rowHtml("Địa bàn", zone.district)}${rowHtml("Hệ số tải", `${zone.loadFactorPct}%`)}${rowHtml("Ghi chú", zone.note)}</div>`,
              );
          });
        });
      }

      // Điểm sự cố (bản đồ số).
      if (visible("incidents")) {
        data.incidents.forEach((inc) => {
          if (!inc.latitude || !inc.longitude) return;
          const icon = L.divIcon({
            className: "grid-incident-pin",
            html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#C62828;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 14],
          });
          L.marker([inc.latitude, inc.longitude], { icon, title: inc.code })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:240px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#C62828;margin-bottom:6px">${inc.code} — ${inc.type}</div>${rowHtml("Thời gian", inc.time)}${rowHtml("Tuyến", inc.lineCode)}${rowHtml("Vị trí", inc.location)}${rowHtml("Mất điện", `${inc.customersAffected ?? 0} khách hàng · ${inc.lostLoadMw ?? 0} MW`)}${rowHtml("Xử lý", inc.handler)}${rowHtml("Tiến độ", inc.progress)}</div>`,
            );
        });
      }

      // Điểm đấu nối trạm.
      if (drawAreas && visible("connectionPoints")) {
        data.substations.forEach((s) => {
          s.connectionPoints?.forEach((p) => {
            if (!p.latitude || !p.longitude) return;
            L.circleMarker([p.latitude, p.longitude], {
              radius: 4,
              color: "#0F766E",
              fillColor: "#0F766E",
              fillOpacity: 1,
              weight: 1.2,
            })
              .addTo(layer)
              .bindPopup(
                `<div style="min-width:220px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0F766E;margin-bottom:6px">${p.name}</div>${rowHtml("Loại", p.type)}${rowHtml("Cấp điện áp", p.voltageLevel)}${rowHtml("Trạm chủ", s.name)}${rowHtml("Trạng thái", p.status)}</div>`,
              );
          });
        });
      }

      // Nguồn NLTT đấu nối lưới.
      if (drawAreas && visible("renewables")) {
        data.renewables.forEach((r) => {
          if (!r.latitude || !r.longitude) return;
          const color =
            r.overload === "Vượt giới hạn"
              ? "#C62828"
              : r.overload === "Cảnh báo"
                ? "#F59E0B"
                : "#2E7D32";
          const icon = L.divIcon({
            className: "grid-renewable-pin",
            html: `<div style="width:14px;height:14px;border-radius:2px;background:${color};border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          L.marker([r.latitude, r.longitude], { icon, title: r.owner })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:240px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#2E7D32;margin-bottom:6px">${r.owner}</div>${rowHtml("Mã nguồn", r.code)}${rowHtml("Loại", r.type)}${rowHtml("Công suất lắp đặt", `${r.installedKw} / ${r.capacityKw} kW`)}${rowHtml("Trạm đấu nối", r.hostSubstationId)}${rowHtml("Điểm đấu nối", r.connectionPoint)}${rowHtml("Quá tải", r.overload)}${rowHtml("Trạng thái", r.status)}</div>`,
            );
        });
      }

      if (visible("lines")) {
        data.lines.forEach((line) => {
          if (!line.route?.length) return;
          const planned = line.status === "Quy hoạch";
          const switchingOff =
            line.switchingState === "MAINTENANCE" || line.switchingState === "STOPPED";
          const color = planned
            ? "#94A3B8"
            : switchingOff
              ? "#64748B"
              : (LINE_COLOR[line.voltageLevel] ?? "#00897B");
          const polyline = L.polyline(line.route, {
            color,
            weight: 3,
            opacity: 0.82,
            ...(planned || switchingOff ? { dashArray: switchingOff ? "4 3" : "8 8" } : {}),
          })
            .addTo(layer)
            .bindPopup(buildLinePopup(line, () => onSelectEntity?.({ kind: "line", item: line })));
          wirePopupButton(polyline, () => onSelectEntity?.({ kind: "line", item: line }));
          polyline.on("click", () => onSelectEntity?.({ kind: "line", item: line }));
        });
      }

      if (visible("planning") && mode !== "station") {
        data.planned
          .filter((a) => a.type === "line" && a.route?.length)
          .forEach((a) => {
            const color = LINE_COLOR[a.voltageLevel] ?? "#00897B";
            const polyline = L.polyline(a.route as [number, number][], {
              color,
              weight: 2.5,
              opacity: 0.6,
              dashArray: "6 6",
            })
              .addTo(layer)
              .bindPopup(
                `<div style="min-width:240px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">${a.name}</div>${rowHtml("Mã", a.code)}${rowHtml("Cấp điện áp", a.voltageLevel)}${rowHtml("Tiến độ", a.progress)}${rowHtml("Nhà đầu tư", a.investor)}<button class="grid-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button></div>`,
              );
            polyline.on("click", () => onSelectEntity?.({ kind: "plan", item: a }));
            wirePopupButton(polyline, () => onSelectEntity?.({ kind: "plan", item: a }));
          });

        // Trụ điện quy hoạch (theo tuyến quy hoạch).
        data.plannedPoles.forEach((pole) => {
          if (!pole.latitude || !pole.longitude) return;
          L.circleMarker([pole.latitude, pole.longitude], {
            radius: 3,
            color: "#94A3B8",
            fillColor: "#ffffff",
            fillOpacity: 1,
            weight: 1.2,
            dashArray: "2 2",
          })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:210px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">${pole.code}</div>${rowHtml("Số trụ", pole.number)}${rowHtml("Tuyến", pole.lineCode)}${rowHtml("Kết cấu dự kiến", pole.planning?.structureType ?? pole.type)}${rowHtml("Khoảng cột", `${pole.planning?.spacingKm ?? "—"} km`)}${rowHtml("Giải phóng mặt bằng", pole.planning?.clearanceStatus)}</div>`,
            );
        });
      }

      if (visible("poles") && mode !== "station") {
        data.poles.forEach((pole) => {
          if (!pole.latitude || !pole.longitude) return;
          L.circleMarker([pole.latitude, pole.longitude], {
            radius: 3.5,
            color: "#0f2a4a",
            fillColor: "#ffffff",
            fillOpacity: 1,
            weight: 1.2,
          })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:200px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">${pole.code}</div>${rowHtml("Số trụ", pole.number)}${rowHtml("Tuyến", pole.lineCode)}${rowHtml("Loại trụ", pole.type)}${rowHtml("Hành lang", pole.safetyCorridor)}</div>`,
            );
        });
      }

      entities.forEach((entity) => {
        const show =
          (entity.kind === "substation" && visible("substations")) ||
          (entity.kind === "line" && false) ||
          (entity.kind === "pole" && visible("poles") && mode !== "station") ||
          (entity.kind === "plan" && visible("planning") && mode !== "station");
        if (!show) return;

        if (entity.kind === "substation") {
          const s = entity.item;
          const lat = s.latitude;
          const lng = s.longitude;
          if (!lat || !lng) return;
          const key = entityKey(entity);
          const selected = key === selectedKey;
          const color = substationColor(s);
          const glyph =
            s.voltageLevel === "500kV"
              ? "500"
              : s.voltageLevel === "220kV"
                ? "220"
                : s.voltageLevel === "110kV"
                  ? "110"
                  : "22";
          const ring = selected ? "box-shadow:0 0 0 4px rgba(21,101,192,.25);" : "";
          const planned = s.status === "Quy hoạch";
          const html = `<div style="width:${planned ? 26 : 30}px;height:${planned ? 26 : 30}px;border-radius:999px;background:${color};border:2px solid #fff;color:#fff;display:grid;place-items:center;font-size:9px;font-weight:800;${ring}${planned ? ";border-style:dashed" : ""}">${glyph}</div>`;
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: "grid-map-pin",
              html,
              iconSize: [planned ? 26 : 30, planned ? 26 : 30],
              iconAnchor: [13, 13],
            }),
            title: s.name,
          })
            .addTo(layer)
            .bindPopup(buildSubstationPopup(s, () => onSelectEntity?.(entity)));
          wirePopupButton(marker, () => onSelectEntity?.(entity));
          marker.on("click", () => onSelectEntity?.(entity));
          markerByKeyRef.current.set(key, marker);

          if (s.supplyRadiusKm && mode !== "station") {
            L.circle([lat, lng], {
              radius: s.supplyRadiusKm * 1000,
              color: color,
              weight: 1,
              fillColor: color,
              fillOpacity: 0.06,
            }).addTo(layer);
          }
        }

        if (entity.kind === "plan") {
          const a = entity.item;
          if (a.type !== "substation" || !a.latitude || !a.longitude) return;
          const key = entityKey(entity);
          const selected = key === selectedKey;
          const ring = selected ? "box-shadow:0 0 0 4px rgba(21,101,192,.25);" : "";
          const html = `<div style="width:26px;height:26px;border-radius:999px;background:#94A3B8;border:2px dashed #fff;color:#fff;display:grid;place-items:center;font-size:9px;font-weight:800;${ring}">QH</div>`;
          const marker = L.marker([a.latitude, a.longitude], {
            icon: L.divIcon({
              className: "grid-map-pin",
              html,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            }),
            title: a.name,
          })
            .addTo(layer)
            .bindPopup(
              `<div style="min-width:240px;font-family:Inter,system-ui,sans-serif"><div style="font-weight:700;color:#0f2a4a;margin-bottom:6px">${a.name}</div>${rowHtml("Mã", a.code)}${rowHtml("Cấp điện áp", a.voltageLevel)}${rowHtml("Tiến độ", a.progress)}${rowHtml("Năm hoàn thành", a.year)}<button class="grid-open-profile" style="margin-top:10px;width:100%;padding:7px 10px;border:0;border-radius:7px;background:#1565C0;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Xem hồ sơ</button></div>`,
            );
          marker.on("click", () => onSelectEntity?.(entity));
          markerByKeyRef.current.set(key, marker);
          wirePopupButton(marker, () => onSelectEntity?.(entity));
        }
      });

      if (selectedKey) markerByKeyRef.current.get(selectedKey)?.openPopup();
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, data, entities, onSelectEntity, ready, selectedKey, visibleLayers]);

  useEffect(() => {
    if (!ready || !selectedKey) return;
    const marker = markerByKeyRef.current.get(selectedKey);
    const map = mapRef.current;
    if (!marker || !map) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 11), { duration: 0.5 });
    marker.openPopup();
  }, [ready, selectedKey]);

  const toggleLayer = (key: GridLayerKey) => {
    setVisibleLayers((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  return (
    <div className="relative rounded-xl border border-border bg-surface shadow-panel">
      <div
        ref={containerRef}
        className="grid-map z-0 w-full"
        style={{ height: `min(${height}px, 68vh)` }}
        aria-label="Bản đồ lưới điện và trạm biến áp tỉnh Tây Ninh"
      />

      <div className="absolute left-3 top-3 z-[500] w-56 max-w-[calc(100%-1.5rem)] rounded-md border border-border bg-card/95 shadow-panel backdrop-blur">
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
            {(Object.keys(LAYER_LABEL) as GridLayerKey[]).map((key) => (
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

      <div className="absolute bottom-3 right-3 z-[500] rounded-md border border-border bg-card/95 p-2 text-xs shadow-panel backdrop-blur">
        <Legend color="bg-destructive" label="Trạm quá tải (≥100%) / Khu vực quá tải" />
        <Legend color="bg-amber-500" label="Trạm tải cao (≥90%) / Hành lang an toàn" />
        <Legend color="bg-gov" label="Trạm bình thường" />
        <Legend color="bg-slate-400" label="Đường dây / tài sản quy hoạch" />
        <Legend color="bg-slate-500" label="Tuyến đang cắt điện" />
        <Legend color="bg-teal" label="Vùng cấp điện / Điểm đấu nối" />
        <Legend color="bg-analytics" label="Vùng phụ tải" />
        <Legend color="bg-destructive" label="Điểm sự cố" />
        <Legend color="bg-success" label="Nguồn NLTT đấu nối" />
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

export type { GridMapEntity as GridEntity };
