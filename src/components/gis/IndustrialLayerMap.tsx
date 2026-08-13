import { useEffect, useRef, useState } from "react";
import type {
  CircleMarker as LeafletCircle,
  CircleMarkerOptions,
  LayerGroup,
  Map as LeafletMap,
  Marker as LeafletMarker,
  PathOptions,
  Polygon as LeafletPolygon,
} from "leaflet";
import type { Cluster, Factory } from "@/lib/types";
import { FACTORY_STATUS_LABEL } from "@/lib/constants";
import { clusterGeometry, zoneBorderColor, zoneFillColor } from "@/lib/gis-geometry";
import "leaflet/dist/leaflet.css";

const TAY_NINH_CENTER: [number, number] = [11.3066, 106.15];
const TAY_NINH_ZOOM = 10;
const ZONE_FIT_MAX_ZOOM = 13.2;
const ZONE_NEAR_ZOOM = 11.8; // zoom >= này hiển thị sát ranh giới thật
const MIN_ONSCREEN_DIM = 22; // px tối thiểu trên màn hình trước khi cần "display enhancement"
const ENHANCE_RADIUS = 15; // px vòng tròn hiển thị/hit area cho polygon quá nhỏ
const LABEL_MIN_DIM = 72; // px để hiện label tên KCN trên polygon đủ diện tích

const FACTORY_STATUS_COLOR: Record<Factory["status"], string> = {
  active: "#2E7D32",
  expanding: "#E59A23",
  suspended: "#64748B",
};

// ─────────────────────────── Marker doanh nghiệp ───────────────────────────
function factoryIconHtml(f: Factory, selected: boolean): string {
  const color = FACTORY_STATUS_COLOR[f.status];
  const ring = selected
    ? `<circle cx="13" cy="13" r="12.5" fill="none" stroke="#1565C0" stroke-width="2.5"/>`
    : "";
  return `<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">${ring}<path d="M13 2.8c-3.6 4-6 7-6 9.9a6 6 0 0 0 12 0c0-2.9-2.4-5.9-6-9.9z" fill="${color}" stroke="#ffffff" stroke-width="2"/><circle cx="13" cy="12.6" r="2.6" fill="#ffffff" fill-opacity="0.92"/></svg>`;
}

function makeFactoryIcon(L: typeof import("leaflet"), f: Factory, selected: boolean) {
  return L.divIcon({
    className: "gis-pin gis-pin-factory",
    html: factoryIconHtml(f, selected),
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
}

// ─────────────────────────── HTML helpers ───────────────────────────
function rowHtml(k: string, v: string | number): string {
  return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;padding:2px 0"><span style="color:#64748B">${k}</span><span style="font-weight:500;color:#0F2A4A;text-align:right">${v}</span></div>`;
}

// Tooltip nhanh khi hover Polygon KCN/CCN
function buildZoneTooltip(c: Cluster): string {
  return `<div style="min-width:180px">
    <div style="font-weight:600;font-size:12px;color:#0F2A4A;margin-bottom:6px">${c.name}</div>
    ${rowHtml("Diện tích", `${c.area} ha`)}
    ${rowHtml("Doanh nghiệp", c.enterprises)}
    ${rowHtml("Tỷ lệ lấp đầy", `${c.occupancy}%`)}
  </div>`;
}

// Popup nhỏ gọn khi click Marker doanh nghiệp
function buildFactoryPopup(
  f: Factory,
  zoneName: string | undefined,
  onOpen: () => void,
): HTMLElement {
  const el = document.createElement("div");
  el.style.minWidth = "250px";
  el.style.fontFamily = "inherit";
  el.innerHTML = `
    <div style="font-weight:600;font-size:13px;line-height:1.35;color:#0F2A4A;margin-bottom:8px">${f.name}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">
      <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#E8F0FA;color:#1565C0;font-size:11px;font-weight:600">${f.sector}</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#2E7D32"><span style="width:8px;height:8px;border-radius:999px;background:${FACTORY_STATUS_COLOR[f.status]};display:inline-block"></span>${FACTORY_STATUS_LABEL[f.status]}</span>
    </div>
    ${rowHtml("Khu/Cụm", zoneName ?? "—")}
    ${rowHtml("Địa chỉ", f.address)}
    ${rowHtml("Đại diện", f.representative)}
    <button class="gis-open-profile" style="margin-top:10px;width:100%;padding:7px 12px;border:none;border-radius:8px;background:#1565C0;color:#fff;font-size:12px;font-weight:600;cursor:pointer">XEM CHI TIẾT</button>
  `;
  el.querySelector<HTMLElement>(".gis-open-profile")?.addEventListener("click", onOpen);
  return el;
}

// ─────────────────────────── Style Polygon theo state ───────────────────────────
type ZoomMode = "far" | "near";

function zoneStyle(c: Cluster, selected: boolean, hover: boolean, mode: ZoomMode): PathOptions {
  const far = mode === "far";
  return {
    pane: "zonePane",
    color: zoneBorderColor(c),
    weight: selected ? (far ? 5 : 4) : hover ? (far ? 4 : 3) : far ? 3 : 2,
    opacity: selected ? 1 : hover ? 0.95 : far ? 0.9 : 0.8,
    fillColor: zoneFillColor(c),
    fillOpacity: selected ? (far ? 0.5 : 0.45) : hover ? (far ? 0.35 : 0.3) : far ? 0.28 : 0.2,
    lineCap: "round",
    lineJoin: "round",
    className: "gis-zone-path",
  };
}

function dimZoneStyle(c: Cluster, mode: ZoomMode): PathOptions {
  const far = mode === "far";
  return {
    pane: "zonePane",
    color: zoneBorderColor(c),
    weight: far ? 2 : 1.5,
    opacity: 0.55,
    fillColor: zoneFillColor(c),
    fillOpacity: 0.07,
    lineCap: "round",
    lineJoin: "round",
    className: "gis-zone-path",
  };
}

// Lớp hiển thị/hit area hỗ trợ cho polygon nhỏ ở mức zoom xa — chỉ phục vụ UX.
function enhanceStyle(c: Cluster, selected: boolean, hover: boolean): CircleMarkerOptions {
  return {
    pane: "zoneEnhancePane",
    radius: ENHANCE_RADIUS,
    color: "#ffffff",
    weight: selected ? 3 : 2,
    opacity: 1,
    fillColor: zoneFillColor(c),
    fillOpacity: selected ? 0.75 : hover ? 0.6 : 0.45,
    className: "gis-zone-enhance",
  };
}

// ─────────────────────────── Component ───────────────────────────
export function IndustrialLayerMap({
  zones,
  selectedZoneId,
  companies,
  selectedCompanyId,
  zoneName,
  onSelectZone,
  onSelectCompany,
  onOpenProfile,
  height = 560,
}: {
  zones: Cluster[];
  selectedZoneId?: string | null;
  companies: Factory[];
  selectedCompanyId?: string | null;
  zoneName?: string | null;
  onSelectZone?: ((c: Cluster) => void) | undefined;
  onSelectCompany?: ((f: Factory) => void) | undefined;
  onOpenProfile?: ((f: Factory) => void) | undefined;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const zoneLayerRef = useRef<LayerGroup | null>(null);
  const enhanceLayerRef = useRef<LayerGroup | null>(null);
  const companyLayerRef = useRef<LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, LeafletMarker>>(new Map());
  const lastZoneIdRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(TAY_NINH_ZOOM);

  // Khởi tạo bản đồ một lần — không bao giờ recreate khi đổi ngành/chọn KCN/mở drawer.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    const onResize = () => {
      if (mapRef.current && containerRef.current) mapRef.current.invalidateSize();
    };
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        center: TAY_NINH_CENTER,
        zoom: TAY_NINH_ZOOM,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Phân lớp z-index: Base Map < Polygon KCN < Enhancement (hit area) < Marker doanh nghiệp < Popup
      const zonePane = map.createPane("zonePane");
      zonePane.style.zIndex = "450";
      const enhancePane = map.createPane("zoneEnhancePane");
      enhancePane.style.zIndex = "460";
      const companyPane = map.createPane("companyPane");
      companyPane.style.zIndex = "620";

      zoneLayerRef.current = L.layerGroup().addTo(map);
      enhanceLayerRef.current = L.layerGroup().addTo(map);
      companyLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
      void enhancePane;
      setZoom(map.getZoom());
      map.on("zoomend", () => setZoom(map.getZoom()));

      // Cập nhật kích thước khi container đổi (xoay màn hình, mở/đóng sidebar, resize).
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
      zoneLayerRef.current = null;
      enhanceLayerRef.current = null;
      companyLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Lớp Polygon KCN/CCN — render lại khi bộ lọc ngành, khu được chọn hoặc mức zoom thay đổi.
  useEffect(() => {
    if (!mapReady) return;
    const layer = zoneLayerRef.current;
    const enhanceLayer = enhanceLayerRef.current;
    if (!layer || !enhanceLayer) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      layer.clearLayers();
      enhanceLayer.clearLayers();
      const map = mapRef.current;
      if (!map) return;
      const currentZoom = map.getZoom();
      const mode: ZoomMode = currentZoom < ZONE_NEAR_ZOOM ? "far" : "near";
      const selectedId = selectedZoneId ?? null;
      const selectedPolys: LeafletPolygon[] = [];
      const selectedEnhance: LeafletCircle[] = [];

      // Bật/tắt hiệu ứng halo (viền sáng) theo trạng thái.
      const applyGlow = (poly: LeafletPolygon, level: 0 | 1 | 2) => {
        const el = poly.getElement();
        if (!el) return;
        el.classList.toggle("gis-zone-glow", level >= 1);
        el.classList.toggle("gis-zone-glow-strong", level === 2);
      };

      zones.forEach((c) => {
        const selected = c.id === selectedId;
        const latlngs = clusterGeometry(c).coordinates[0]!.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );

        // Đo kích thước thật trên màn hình (px) ở mức zoom hiện tại — không đổi geometry.
        const bounds = L.latLngBounds(latlngs);
        const ne = map.project(bounds.getNorthEast(), currentZoom);
        const sw = map.project(bounds.getSouthWest(), currentZoom);
        const pixelSize = Math.max(Math.abs(ne.x - sw.x), Math.abs(ne.y - sw.y));
        const center = bounds.getCenter();

        // Polygon thật — luôn có, giữ ranh giới thực tế.
        const polygon = L.polygon(latlngs, zoneStyle(c, selected, false, mode))
          .addTo(layer)
          .bindTooltip(buildZoneTooltip(c), { direction: "top", className: "gis-zone-tooltip" });

        if (selected) selectedPolys.push(polygon);

        // Lớp hiển thị/hit area cho polygon quá nhỏ ở mức zoom xa (minimum visual size).
        let enhance: LeafletCircle | null = null;
        if (mode === "far" && pixelSize < MIN_ONSCREEN_DIM) {
          enhance = L.circleMarker([center.lat, center.lng], enhanceStyle(c, selected, false))
            .addTo(enhanceLayer)
            .bindTooltip(buildZoneTooltip(c), { direction: "top", className: "gis-zone-tooltip" });
          if (selected) selectedEnhance.push(enhance);
          enhance.on("click", () => onSelectZone?.(c));
        }

        // Label tên KCN trên polygon đủ diện tích — chỉ hiện khi zoom gần đủ rõ.
        if (mode === "near" && pixelSize >= LABEL_MIN_DIM && !enhance) {
          L.tooltip({
            permanent: true,
            direction: "center",
            className: "gis-zone-label",
            interactive: false,
            opacity: 1,
          })
            .setLatLng(center)
            .setContent(c.name)
            .addTo(enhanceLayer);
        }

        polygon.on("click", () => onSelectZone?.(c));

        const restyle = (hover: boolean) => {
          if (selectedId && c.id !== selectedId) {
            polygon.setStyle(dimZoneStyle(c, mode));
            applyGlow(polygon, 0);
            if (!hover) polygon.bringToBack();
            enhance?.setStyle(enhanceStyle(c, false, false));
            if (!hover) enhance?.bringToBack();
          } else {
            polygon.setStyle(zoneStyle(c, selected, hover, mode));
            applyGlow(polygon, selected ? 2 : hover || mode === "far" ? 1 : 0);
            if (selected) polygon.bringToFront();
            enhance?.setStyle(enhanceStyle(c, selected, hover));
            if (selected) enhance?.bringToFront();
          }
        };
        polygon.on("mouseover", () => restyle(true));
        polygon.on("mouseout", () => restyle(false));
        enhance?.on("mouseover", () => restyle(true));
        enhance?.on("mouseout", () => restyle(false));
      });

      // Đảm bảo Polygon được chọn luôn nổi trên các Polygon khác.
      selectedPolys.forEach((p) => p.bringToFront());
      selectedEnhance.forEach((e) => e.bringToFront());
    })();
    return () => {
      cancelled = true;
    };
  }, [mapReady, zones, selectedZoneId, onSelectZone, zoom]);

  // Fit bounds khi chọn/chuyển KCN — zoom vừa đủ, không quá sát.
  useEffect(() => {
    if (!mapReady || !selectedZoneId) return;
    const map = mapRef.current;
    if (!map) return;
    const zone = zones.find((z) => z.id === selectedZoneId);
    if (!zone) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      const coords = clusterGeometry(zone).coordinates[0]!.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );
      map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: ZONE_FIT_MAX_ZOOM });
    })();
    return () => {
      cancelled = true;
    };
  }, [mapReady, zones, selectedZoneId]);

  // Quay về toàn tỉnh khi hủy chọn KCN (vẫn giữ bộ lọc ngành).
  useEffect(() => {
    if (!mapReady) return;
    const prev = lastZoneIdRef.current;
    if (selectedZoneId === prev) return;
    if (selectedZoneId) {
      lastZoneIdRef.current = selectedZoneId;
    } else if (prev != null) {
      lastZoneIdRef.current = null;
      mapRef.current?.flyTo(TAY_NINH_CENTER, TAY_NINH_ZOOM, { duration: 0.6 });
    }
  }, [mapReady, selectedZoneId]);

  // Marker doanh nghiệp — chỉ render khi đã chọn KCN, lọc theo ngành ở phía parent.
  useEffect(() => {
    if (!mapReady) return;
    const layer = companyLayerRef.current;
    if (!layer) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      layer.clearLayers();
      markerByIdRef.current.clear();
      if (!selectedZoneId) return;

      companies.forEach((f) => {
        const selected = f.id === selectedCompanyId;
        const marker = L.marker([f.lat, f.lng], {
          icon: makeFactoryIcon(L, f, selected),
          title: f.name,
          pane: "companyPane",
        }).addTo(layer);
        markerByIdRef.current.set(f.id, marker);
        marker.on("click", () => onSelectCompany?.(f));
        marker.bindPopup(
          buildFactoryPopup(f, zoneName ?? undefined, () => onOpenProfile?.(f)),
          {
            autoPanPadding: [40, 40],
          },
        );
      });

      if (selectedCompanyId) {
        const m = markerByIdRef.current.get(selectedCompanyId);
        if (m) m.openPopup();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    companies,
    selectedZoneId,
    selectedCompanyId,
    zoneName,
    onSelectCompany,
    onOpenProfile,
  ]);

  return (
    <div
      ref={containerRef}
      className="gis-map z-0 w-full"
      style={{ height: `min(${height}px, 70vh)` }}
      aria-label="Bản đồ GIS khu/cụm công nghiệp tỉnh Tây Ninh (OpenStreetMap)"
    />
  );
}
