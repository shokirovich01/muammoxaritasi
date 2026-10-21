"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { CATEGORIES, MAP_CENTER, STATUSES } from "@/lib/constants";
import type { Report } from "@/lib/types";

const icon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>`,
    iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -22],
  });

export default function ReportsMap({ reports, height = "h-[70vh]" }: { reports: Report[]; height?: string }) {
  return (
    <MapContainer center={MAP_CENTER} zoom={6} className={`${height} w-full rounded-2xl`} scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={icon(STATUSES[r.status].color)}>
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{CATEGORIES[r.category].emoji} {r.title}</p>
              <p className="text-xs">{STATUSES[r.status].label}</p>
              <Link href={`/muammo/${r.id}`} className="text-sm font-semibold text-brand-700 underline">Batafsil →</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
