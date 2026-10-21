import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserAndRole } from "@/lib/supabase/server";
import { confirmCount, type Report } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
export const metadata = { title: "Boshqaruv paneli — MuammoXaritasi" };

export default async function Dashboard() {
  const { supabase, user } = await getUserAndRole();
  if (!user) redirect("/kirish");
  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("reports").select("*, confirmations(count)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const reports = (data ?? []) as Report[];
  const stats = [
    ["Jami xabarlar", reports.length],
    ["Ko‘rib chiqilmoqda / jarayonda", reports.filter((r) => ["korib_chiqilmoqda", "jarayonda"].includes(r.status)).length],
    ["Hal qilingan", reports.filter((r) => r.status === "hal_qilindi").length],
    ["Olingan tasdiqlar", reports.reduce((s, r) => s + confirmCount(r), 0)],
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Salom, {profile?.full_name || "foydalanuvchi"}! 👋</h1>
        <Link href="/muammo-yuborish" className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700">+ Yangi muammo</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-3xl font-extrabold text-brand-700">{v}</p><p className="text-sm text-gray-600">{l}</p></div>
        ))}
      </div>
      <h2 className="text-xl font-bold">Mening xabarlarim</h2>
      {reports.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-gray-500">Siz hali muammo yubormagansiz.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reports.map((r) => <ReportCard key={r.id} r={r} />)}</div>
      )}
    </div>
  );
}
