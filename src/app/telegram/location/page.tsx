
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <p>Xarita yuklanmoqda...</p>,
});

export default function TelegramLocationPage() {
  const [token, setToken] = useState("");
  const [lat, setLat] = useState(41.2995);
  const [lng, setLng] = useState(69.2401);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function sendLocation() {
    if (!token) {
      setMessage("Havola noto‘g‘ri yoki token topilmadi. Botdan yangi havola oling.");
      return;
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < 37 || lat > 46 ||
      lng < 55 || lng > 74
    ) {
      setMessage("O‘zbekiston hududidan joy tanlang.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/telegram/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lat, lng }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Joylashuvni yuborib bo‘lmadi.");
      }

      setMessage("Joylashuv botga yuborildi! Telegramga qayting.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Xatolik yuz berdi."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "24px auto",
        padding: 16,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Muammo joyini belgilang</h1>
      <p>Xaritani bosib, muammo sodir bo‘lgan joyni tanlang.</p>

      <div style={{ height: 420, margin: "20px 0" }}>
        <LocationMap
          lat={lat}
          lng={lng}
          onPick={(a, b) => {
            setLat(a);
            setLng(b);
            setPicked(true);
            setMessage("");
          }}
        />
      </div>

      <p>
        {picked
          ? `Tanlangan nuqta: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : "Xaritadan kerakli nuqtani bosing."}
      </p>

      <button
        type="button"
        disabled={busy || !token || !picked}
        onClick={sendLocation}
        style={{
          width: "100%",
          padding: "14px 18px",
          border: "none",
          borderRadius: 8,
          background: busy || !token || !picked ? "#9ca3af" : "#16803d",
          color: "white",
          fontSize: 16,
          fontWeight: 600,
          cursor: busy || !token || !picked ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Yuborilmoqda..." : "📍 Joylashuvni yuborish"}
      </button>

      {message && (
        <p role="status" style={{ marginTop: 16 }}>
          {message}
        </p>
      )}
    </main>
  );
}
