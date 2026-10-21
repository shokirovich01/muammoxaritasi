import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserAndRole } from "@/lib/supabase/server";
import { CATEGORIES, STATUSES, type StatusKey } from "@/lib/constants";
import { confirmCount, fmtDate, type Report } from "@/lib/types";
import AdminStatusSelect from "@/components/AdminStatusSelect";
export const metadata = { title: "Admin — MuammoXaritasi" };

export default async function Admin({ searchParams }: { searchParams: { holat?: string } }) {
  const { supabase, user, role } = await getUserAndRole();
  if (!user) redirect("/kirish");
  if (role !== "admin") redirect("/dashboard");
  const { data } = await supabase.from("reports").select("*, confirmations(count)").order("created_at", { ascending: false }).limit(500);
  const all = (data ?? []) as Report[];
  const filter = searchParams.holat && searchParams.holat in STATUSES ? (searchParams.holat as StatusKey) : null;
  const list = filter ? all.filter((r) => r.status === filter) : all;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Administrator paneli</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin" className={`rounded-full border px-3 py-1 text-sm ${!filter ? "bg-brand-600 text-white" : "bg-white"}`}>Barchasi ({all.length})</Link>
        {Object.entries(STATUSES).map(([k, v]) => (
          <Link key={k} href={`/admin?holat=${k}`} className={`rounded-full border px-3 py-1 text-sm ${filter === k ? "bg-brand-600 text-white" : "bg-white"}`}>
            {v.label} ({all.filter((r) => r.status === k).length})
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr><th className="p-3">Sarlavha</th><th className="p-3">Toifa</th><th className="p-3">Hudud</th><th className="p-3">Sana</th><th className="p-3">👍</th><th className="p-3">Holat</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><Link href={`/muammo/${r.id}`} className="font-semibold text-brand-700 hover:underline">{r.title}</Link></td>
                <td className="p-3">{CATEGORIES[r.category].label}</td>
                <td className="p-3">{r.region}</td>
                <td className="p-3">{fmtDate(r.created_at)}</td>
                <td className="p-3">{confirmCount(r)}</td>
                <td className="p-3"><AdminStatusSelect reportId={r.id} status={r.status} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Muammolar topilmadi.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
