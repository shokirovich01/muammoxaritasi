"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <p>Xarita yuklanmoqda...</p>,
});

export default function TelegramLocationPage() {
  const [token, setToken] = useState("");
  const [lat, setLat] = useState("41.2995");
  const [lng, setLng] = useState("69.2401");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function sendLocation() {
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !token ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < 37 || latitude > 46 ||
      longitude < 55 || longitude > 74
    ) {
      setMessage("Token yoki koordinatalar noto‘g‘ri.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/telegram/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lat: latitude, lng: longitude }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Joylashuvni saqlab bo‘lmadi.");
      }

      setMessage("Joylashuv yuborildi! Telegram botdagi javobni tekshiring.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xatolik yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage("Bu qurilmada GPS mavjud emas.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setMessage("Joylashuv olindi. Endi tasdiqlang.");
      },
      () => setMessage("Joylashuvga ruxsat berilmadi. Xaritadan tanlang."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <h1>Muammo joylashuvini tanlash</h1>
      <p>Xaritani bosing yoki koordinatalarni kiriting.</p>

      <div style={{ height: 420, margin: "20px 0" }}>
        <LocationMap
          lat={Number(lat)}
          lng={Number(lng)}
          onPick={(a, b) => {
            setLat(a.toFixed(6));
            setLng(b.toFixed(6));
            setMessage("");
          }}
        />
      </div>

      <button type="button" onClick={useMyLocation}>
        Hozirgi joylashuvim
      </button>

      <p>
        <label>
          Kenglik (latitude)
          <input
            style={{ display: "block", width: "100%", padding: 10 }}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </label>
      </p>

      <p>
        <label>
          Uzunlik (longitude)
          <input
            style={{ display: "block", width: "100%", padding: 10 }}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </label>
      </p>

      <button type="button" disabled={busy || !token} onClick={sendLocation}>
        {busy ? "Yuborilmoqda..." : "Joylashuvni tasdiqlash"}
      </button>

      {message && <p role="status">{message}</p>}
    </main>
  );
}
