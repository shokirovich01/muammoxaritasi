"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validation";

const field = "w-full rounded-lg border px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const isReg = mode === "register";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setInfo("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const supabase = createClient();
    setBusy(true);
    if (isReg) {
      const parsed = registerSchema.safeParse({ fullName: fd.get("fullName"), email, password });
      if (!parsed.success) { setBusy(false); return setError(parsed.error.issues[0].message); }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setBusy(false);
      if (error) return setError("Ro‘yxatdan o‘tishda xatolik: " + (error.message.includes("registered") ? "bu pochta allaqachon ro‘yxatdan o‘tgan" : "qayta urinib ko‘ring"));
      if (data.session) { router.push("/dashboard"); router.refresh(); }
      else setInfo("Pochtangizga tasdiqlash xati yuborildi. Havolani bosing, so‘ng tizimga kiring.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError("Elektron pochta yoki parol noto‘g‘ri");
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">{isReg ? "Ro‘yxatdan o‘tish" : "Tizimga kirish"}</h1>
      {isReg && <div><label className="mb-1 block text-sm font-medium">Ism-familiya</label><input name="fullName" className={field} autoComplete="name" /></div>}
      <div><label className="mb-1 block text-sm font-medium">Elektron pochta</label><input name="email" type="email" className={field} autoComplete="email" /></div>
      <div><label className="mb-1 block text-sm font-medium">Parol</label><input name="password" type="password" className={field} autoComplete={isReg ? "new-password" : "current-password"} /></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {info && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{info}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {busy ? "Kuting…" : isReg ? "Ro‘yxatdan o‘tish" : "Kirish"}
      </button>
      <p className="text-center text-sm text-gray-600">
        {isReg ? <>Akkauntingiz bormi? <Link className="font-semibold text-brand-700" href="/kirish">Kirish</Link></>
               : <>Akkauntingiz yo‘qmi? <Link className="font-semibold text-brand-700" href="/royxatdan-otish">Ro‘yxatdan o‘ting</Link></>}
      </p>
    </form>
  );
}
