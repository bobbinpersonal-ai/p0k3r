"use client";

// Leaflet ships its own stylesheet — without it tiles stack in the wrong
// places and the zoom/attribution controls render unstyled.
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { LatLng } from "@/lib/geo";

// The route map under the quote: pickup pin, drop-off pin, and the driving
// line between them.
//
// Leaflet is imported dynamically inside the effect rather than at module
// scope — it touches `window` on import, which breaks server rendering. Tiles
// come from OpenStreetMap and load in the visitor's browser, so no key and no
// server-side call. If tiles fail to load the pins and route line still draw
// over the map background, which is enough to show the trip.

type Props = {
  pickup: LatLng | null;
  dropoff: LatLng | null;
  /** [lng, lat] pairs from /api/directions — GeoJSON order, not Leaflet's. */
  geometry: [number, number][];
};

export default function RouteMap({ pickup, dropoff, geometry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
          // It sits inside a scrolling page — grabbing the wheel would trap
          // the reader. Dragging and pinching still work.
          scrollWheelZoom: false,
        });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;
      layer.clearLayers();

      const pinFor = (kind: "pickup" | "dropoff") =>
        L.divIcon({
          className: "",
          html: `<div style="
              display:flex;align-items:center;justify-content:center;
              width:34px;height:34px;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              background:${kind === "pickup" ? "#C22C40" : "#1A1815"};
              box-shadow:0 2px 8px rgba(0,0,0,.35);
            "><span style="transform:rotate(45deg);color:#fff;font-size:15px;line-height:1">
              ${kind === "pickup" ? "&uarr;" : "&darr;"}
            </span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

      const points: [number, number][] = [];

      if (pickup) {
        L.marker([pickup.lat, pickup.lng], { icon: pinFor("pickup") })
          .bindTooltip("Pickup", { direction: "top", offset: [0, -34] })
          .addTo(layer);
        points.push([pickup.lat, pickup.lng]);
      }
      if (dropoff) {
        L.marker([dropoff.lat, dropoff.lng], { icon: pinFor("dropoff") })
          .bindTooltip("Drop-off", { direction: "top", offset: [0, -34] })
          .addTo(layer);
        points.push([dropoff.lat, dropoff.lng]);
      }

      if (geometry.length > 1) {
        // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
        const line = geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
        L.polyline(line, { color: "#C22C40", weight: 5, opacity: 0.9 }).addTo(layer);
        map.fitBounds(L.latLngBounds(line), { padding: [40, 40] });
      } else if (points.length === 2) {
        // No route shape (estimate-only) — still show both ends, dashed to
        // signal it isn't the real driving path.
        L.polyline(points, {
          color: "#C22C40",
          weight: 4,
          opacity: 0.6,
          dashArray: "8 8",
        }).addTo(layer);
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      } else if (points.length === 1) {
        map.setView(points[0], 14);
      } else {
        map.setView([38.5449, -121.7405], 11); // Davis, our home market
      }
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff, geometry]);

  // Tear the map down only on unmount, so redraws above can reuse it.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full bg-black/[0.04]" aria-label="Route map" />;
}
