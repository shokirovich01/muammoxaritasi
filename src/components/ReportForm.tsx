"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, MAX_PHOTOS, REGIONS } from "@/lib/constants";
import { reportSchema, validatePhotos } from "@/lib/validation";
import { LocationPickerDynamic } from "./DynamicMaps";

const field = "w-full rounded-lg border px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function ReportForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function locate() {
    if (!navigator.geolocation) return setError("Brauzeringiz joylashuvni qo‘llab-quvvatlamaydi");
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => setError("Joylashuvni aniqlab bo‘lmadi. Xaritada qo‘lda belgilang."),
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const parsed = reportSchema.safeParse({
      title: fd.get("title"), description: fd.get("description"), category: fd.get("category"),
      region: fd.get("region"), lat: pos?.[0], lng: pos?.[1],
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    const photoErr = validatePhotos(files);
    if (photoErr) return setError(photoErr);

    setBusy(true);
    const supabase = createClient();
    try {
      const urls: string[] = [];
      for (const f of files) {
        const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("report-photos").upload(path, f, { contentType: f.type });
        if (upErr) throw upErr;
        urls.push(supabase.storage.from("report-photos").getPublicUrl(path).data.publicUrl);
      }
      const { data, error: insErr } = await supabase.from("reports")
        .insert({ ...parsed.data, user_id: userId, photos: urls }).select("id").single();
      if (insErr) throw insErr;
      router.push(`/muammo/${data.id}`);
      router.refresh();
    } catch {
      setError("Muammoni yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div><label className="mb-1 block text-sm font-medium">Sarlavha</label>
        <input name="title" className={field} maxLength={120} placeholder="Masalan: Asosiy ko‘chada katta chuqur" /></div>
      <div><label className="mb-1 block text-sm font-medium">Tavsif</label>
        <textarea name="description" rows={4} maxLength={2000} className={field} placeholder="Muammoni batafsil yozing…" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium">Toifa</label>
          <select name="category" className={field} defaultValue="">
            <option value="" disabled>Tanlang…</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select></div>
        <div><label className="mb-1 block text-sm font-medium">Hudud</label>
          <select name="region" className={field} defaultValue="">
            <option value="" disabled>Tanlang…</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select></div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">Joylashuv (xaritani bosing)</label>
          <button type="button" onClick={locate} className="text-sm font-semibold text-brand-700 underline">📍 Mening joylashuvim</button>
        </div>
        <LocationPickerDynamic value={pos} onPick={(a, b) => setPos([a, b])} />
        {pos && <p className="mt-1 text-xs text-gray-500">Tanlandi: {pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>}
      </div>
      <div><label className="mb-1 block text-sm font-medium">Rasmlar (ko‘pi bilan {MAX_PHOTOS} ta, har biri 5 MB gacha)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))} className="text-sm" />
        {files.length > 0 && <p className="mt-1 text-xs text-gray-500">{files.length} ta rasm tanlandi</p>}</div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {busy ? "Yuborilmoqda…" : "Muammoni yuborish"}
      </button>
    </form>
  );
}
