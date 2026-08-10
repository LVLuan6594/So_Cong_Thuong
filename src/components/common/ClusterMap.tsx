import { useEffect, useRef, useState } from "react";
import type { Cluster } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const TAY_NINH_CENTER: [number, number] = [11.3066, 106.15];

function pinColor(c: Cluster): string {
  if (c.occupancy >= 75) return "#2E7D32";
  if (c.occupancy >= 50) return "#1565C0";
  return "#E59A23";
}

function makeIcon(L: typeof import("leaflet"), c: Cluster) {
  return L.divIcon({
    className: "cluster-pin",
    html: `<svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 1C8.16 1 1 8.16 1 17c0 11.4 14.6 25.2 15.36 26a1 1 0 0 0 1.28 0C18.4 42.2 33 28.4 33 17 33 8.16 25.84 1 17 1Z" fill="${pinColor(c)}" stroke="#ffffff" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#ffffff" fill-opacity="0.92"/></svg>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42],
  });
}

function popupHtml(c: Cluster): string {
  const row = (k: string, v: string | number) =>
    `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#64748b">${k}</span><span style="font-weight:500">${v}</span></div>`;
  return `<div style="min-width:230px">
    <div style="font-weight:600;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.01em">${c.name}</div>
    ${row("Địa bàn", c.district)}
    ${row("Diện tích", `${c.area} ha`)}
    ${row("Đã cho thuê", `${c.leased} ha`)}
    ${row("Tỷ lệ lấp đầy", `${c.occupancy}%`)}
    ${row("Doanh nghiệp", c.enterprises)}
    ${row("Ngành thu hút", c.sectors)}
  </div>`;
}

export function ClusterMap({
  clusters,
  selectedId,
  onSelect,
  height = 480,
}: {
  clusters: Cluster[];
  selectedId?: string | null | undefined;
  onSelect?: ((c: Cluster) => void) | undefined;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<(typeof import("leaflet"))["map"]> | null>(null);
  const layerGroupRef = useRef<ReturnType<(typeof import("leaflet"))["layerGroup"]> | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        center: TAY_NINH_CENTER,
        zoom: 10,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const layer = layerGroupRef.current;
    if (!layer) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      layer.clearLayers();
      clusters.forEach((c) => {
        const marker = L.marker([c.lat, c.lng], { icon: makeIcon(L, c), title: c.name })
          .addTo(layer)
          .bindPopup(popupHtml(c));
        marker.on("click", () => onSelect?.(c));
        if (selectedId && c.id === selectedId) marker.openPopup();
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [mapReady, clusters, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="cluster-map z-0 w-full"
      style={{ height }}
      aria-label="Bản đồ cụm công nghiệp tỉnh Tây Ninh (OpenStreetMap)"
    />
  );
}
