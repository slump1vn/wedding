"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaBus, FaMapMarkedAlt } from "react-icons/fa";
import { GOOGLE_LIVE_LOCATION_LINK, stops } from "@/lib/tracking";

type Point = { lat: number; lon: number; tst: string; vel?: number; batt?: number };

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const POLL_MS = 20000;

// Khoảng cách đường chim bay giữa hai toạ độ (km)
const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

const timeAgo = (ms: number) => {
  const min = Math.floor(ms / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  return `${Math.floor(min / 60)} giờ ${min % 60} phút trước`;
};

// Bản đồ vị trí xe theo thời gian thực (dữ liệu từ app OwnTracks trên điện thoại)
const LiveTracker = () => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const busRef = useRef<CircleMarker | null>(null);
  const trackRef = useRef<Polyline | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [active, setActive] = useState<boolean | null>(null);
  const [now, setNow] = useState(Date.now());

  // Lấy vị trí định kỳ; ?key= trên URL trang được chuyển tiếp để xem thử ngoài khung giờ
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key");
    const url = `${base}/api/location${key ? `?key=${encodeURIComponent(key)}` : ""}`;
    const load = () =>
      fetch(url, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setActive(d.active);
          setPoints(d.points);
        })
        .catch(() => {});
    load();
    const id = setInterval(() => {
      load();
      setNow(Date.now());
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Khởi tạo bản đồ một lần (Leaflet chỉ chạy được trên trình duyệt)
  useEffect(() => {
    if (!active || !mapEl.current || mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current) return;
      const map = L.map(mapEl.current, { zoomControl: true }).setView([21.02, 106.3], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const seen = new Set<string>();
      stops.forEach((s) => {
        const k = `${s.lat},${s.lon}`;
        if (seen.has(k)) return;
        seen.add(k);
        L.circleMarker([s.lat, s.lon], { radius: 6, color: "#7d8f69", fillOpacity: 0.6 })
          .bindTooltip(s.name)
          .addTo(map);
      });
      trackRef.current = L.polyline([], { color: "#7d8f69", weight: 4, opacity: 0.7 }).addTo(map);
      busRef.current = L.circleMarker([0, 0], {
        radius: 10,
        color: "#fff",
        weight: 3,
        fillColor: "#e11d48",
        fillOpacity: 1,
      });
      mapRef.current = map;
      setNow(Date.now()); // vẽ lại để đổ dữ liệu đã có vào bản đồ
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Cập nhật vị trí xe và lộ trình mỗi khi có dữ liệu mới
  const last = points[points.length - 1];
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !busRef.current || !trackRef.current || !last) return;
    trackRef.current.setLatLngs(points.map((p) => [p.lat, p.lon]));
    const firstFix = !map.hasLayer(busRef.current);
    busRef.current.setLatLng([last.lat, last.lon]).addTo(map);
    if (firstFix) map.setView([last.lat, last.lon], 13);
    else map.panTo([last.lat, last.lon]);
  }, [points, last, now]);

  if (active === false) return null;

  const nextStop = stops.find((s) => new Date(s.at).getTime() > now);
  const age = last ? now - new Date(last.tst).getTime() : 0;

  return (
    <section className="px-6 pt-6">
      <h2 className="font-playfair font-bold text-2xl text-center uppercase text-[#232323] mb-4">
        Xe Đang Ở Đâu?
      </h2>
      <div className="rounded-3xl border border-sage/25 bg-white/50 p-3">
        <div ref={mapEl} className="h-72 w-full rounded-2xl overflow-hidden z-0" />
        <div className="px-2 pt-3 font-vietnam text-sm text-[#343434] space-y-1">
          {last ? (
            <>
              <p className="flex items-center gap-2">
                <FaBus className="text-rose-600" />
                <span>
                  Cập nhật <strong>{timeAgo(age)}</strong>
                  {last.vel != null && ` · ${Math.round(last.vel)} km/h`}
                </span>
              </p>
              {age > 10 * 60000 && (
                <p className="text-xs text-amber-700">
                  Đã lâu chưa có vị trí mới, có thể điện thoại đang mất sóng.
                </p>
              )}
              {nextStop && (
                <p className="text-xs text-[#6E6E6E]">
                  Cách {nextStop.name} khoảng{" "}
                  <strong>{distanceKm(last, nextStop).toFixed(1)} km</strong> (đường chim bay)
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-[#6E6E6E]">
              Chưa có vị trí. Bản đồ sẽ hiện vị trí xe khi đoàn xuất phát.
            </p>
          )}
        </div>
      </div>
      {GOOGLE_LIVE_LOCATION_LINK && (
        <a
          href={GOOGLE_LIVE_LOCATION_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-sage/50 bg-sage/15 px-4 py-3 font-vietnam text-sm text-[#232323]"
        >
          <FaMapMarkedAlt className="text-sage" />
          <span>Xem vị trí xe trên Google Maps</span>
        </a>
      )}
    </section>
  );
};

export default LiveTracker;
