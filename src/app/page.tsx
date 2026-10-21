import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import type { Report } from "@/lib/types";
import ReportCard from "@/components/ReportCard";
import MapExplorer from "@/components/MapExplorer";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("*, confirmations(count)").order("created_at", { ascending: false }).limit(300);
  const reports = (data ?? []) as Report[];
  const solved = reports.filter((r) => r.status === "hal_qilindi").length;
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 px-6 py-14 text-center text-white">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Muammoni ko‘rdingizmi? Xaritaga belgilang.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-50">Yo‘l chuqurlari, o‘chgan chiroqlar, chiqindi va suv oqishi — hammasini birgalikda aniqlaymiz va hal qilamiz.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/muammo-yuborish" className="rounded-xl bg-white px-6 py-3 font-bold text-brand-700 hover:bg-brand-50">+ Muammo yuborish</Link>
          <Link href="/xarita" className="rounded-xl border border-white px-6 py-3 font-bold hover:bg-white/10">Xaritani ko‘rish</Link>
        </div>
        <div className="mt-10 flex justify-center gap-10 text-center">
          <div><p className="text-3xl font-extrabold">{reports.length}</p><p className="text-sm text-brand-50">Xabar qilingan</p></div>
          <div><p className="text-3xl font-extrabold">{solved}</p><p className="text-sm text-brand-50">Hal qilingan</p></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-white p-4 text-center shadow-sm"><div className="text-3xl">{v.emoji}</div><p className="mt-1 text-sm font-semibold">{v.label}</p></div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Jonli xarita</h2>
        <MapExplorer reports={reports} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">So‘nggi muammolar</h2>
        {reports.length === 0 ? (
          <p className="rounded-2xl border bg-white p-8 text-center text-gray-500">Hozircha muammolar yo‘q. Birinchi bo‘lib xabar bering!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reports.slice(0, 6).map((r) => <ReportCard key={r.id} r={r} />)}</div>
        )}
      </section>
    </div>
  );
}
