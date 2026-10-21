"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { profileSchema } from "@/lib/validation";

const field = "w-full rounded-lg border px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function ProfileForm({ userId, email, fullName, phone }: { userId: string; email: string; fullName: string; phone: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({ fullName: fd.get("fullName"), phone: fd.get("phone") ?? "" });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0].message });
    const { error } = await createClient().from("profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null }).eq("id", userId);
    setMsg(error ? { ok: false, text: "Saqlashda xatolik" } : { ok: true, text: "Profil saqlandi ✅" });
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <div><label className="mb-1 block text-sm font-medium">Elektron pochta</label><input value={email} disabled className={`${field} bg-gray-100`} /></div>
      <div><label className="mb-1 block text-sm font-medium">Ism-familiya</label><input name="fullName" defaultValue={fullName} className={field} /></div>
      <div><label className="mb-1 block text-sm font-medium">Telefon</label><input name="phone" defaultValue={phone} placeholder="+998 90 123 45 67" className={field} /></div>
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Saqlash</button>
    </form>
  );
}
