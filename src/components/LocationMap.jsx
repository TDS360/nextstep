import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon references image files by a path
// that Vite doesn't bundle automatically — point them at the
// same CDN version instead so the pin actually renders.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// FEATURE 1 — the map.
// Renders free OpenStreetMap tiles (no API key needed) and
// drops a marker at `lat`/`lng`. With no location yet, it
// just shows a low-zoom world view.
export default function LocationMap({ lat, lng, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Create the map once, on mount.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = L.map(containerRef.current, { attributionControl: true }).setView(
      [lat ?? 20, lng ?? 0],
      lat != null ? 11 : 2,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Intentionally runs once — later location changes are
    // handled by the effect below instead of recreating the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center + move the marker whenever the location changes.
  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;

    mapRef.current.setView([lat, lng], 11, { animate: true });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }

    if (label) markerRef.current.bindPopup(label);
  }, [lat, lng, label]);

  return <div ref={containerRef} className="h-full w-full" />;
}
