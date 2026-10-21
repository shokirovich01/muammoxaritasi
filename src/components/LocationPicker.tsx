"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";
import { MAP_CENTER } from "@/lib/constants";

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#059669;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>`,
  iconSize: [22, 22], iconAnchor: [11, 22],
});

function Clicks({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}
function Fly({ value }: { value: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (value) map.flyTo(value, Math.max(map.getZoom(), 16)); }, [value, map]);
  return null;
}

export default function LocationPicker({ value, onPick }: { value: [number, number] | null; onPick: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={value ?? MAP_CENTER} zoom={value ? 16 : 6} className="h-80 w-full rounded-xl" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Clicks onPick={onPick} />
      <Fly value={value} />
      {value && <Marker position={value} icon={pin} />}
    </MapContainer>
  );
}
