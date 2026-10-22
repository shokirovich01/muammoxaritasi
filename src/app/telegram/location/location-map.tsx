"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type Props = {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
};

function MapClick({ onPick }: { onPick: Props["onPick"] }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
}

export default function LocationMap({ lat, lng, onPick }: Props) {

  const marker = L.divIcon({
    className: "",
    html: '<div style="font-size:30px">📍</div>',
    iconSize: [30, 36],
    iconAnchor: [15, 30],
  });

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClick onPick={onPick} />
      <Recenter lat={lat} lng={lng} />
      <Marker
        position={[lat, lng]}
        icon={marker}
        eventHandlers={{
          dragend: (event) => {
            const point = event.target.getLatLng();
            onPick(point.lat, point.lng);
          },
        }}
      />
    </MapContainer>
  );
}
