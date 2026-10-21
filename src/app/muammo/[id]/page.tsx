import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserAndRole } from "@/lib/supabase/server";
import { CATEGORIES, STATUSES } from "@/lib/constants";
import { confirmCount, fmtDate, type Report } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import AdminStatusSelect from "@/components/AdminStatusSelect";
import DeleteReportButton from "@/components/DeleteReportButton";
import { ReportsMapDynamic } from "@/components/DynamicMaps";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReportPage({ params }: { params: { id: string } }) {
  if (!uuid.test(params.id)) notFound();
  const { supabase, user, role } = await getUserAndRole();
  const { data } = await supabase.from("reports").select("*, confirmations(count)").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const r = data as Report;

  const [{ data: history }, { data: author }, mine] = await Promise.all([
    supabase.from("status_history").select("*").eq("report_id", r.id).order("created_at", { ascending: true }),
    supabase.from("profiles").select("full_name").eq("id", r.user_id).maybeSingle(),
    user ? supabase.from("confirmations").select("report_id").eq("report_id", r.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const isOwner = user?.id === r.user_id;
  const isAdmin = role === "admin";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} />
            <span className="text-sm text-gray-500">{CATEGORIES[r.category].emoji} {CATEGORIES[r.category].label}</span>
          </div>
          <h1 className="text-3xl font-bold">{r.title}</h1>
          <p className="text-sm text-gray-500">{r.region} · {fmtDate(r.created_at)}{isAdmin && author?.full_name ? ` · Muallif: ${author.full_name}` : ""}</p>
        </div>
        {r.photos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {r.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={p} href={p} target="_blank" rel="noreferrer"><img src={p} alt={r.title} className="h-56 w-full rounded-xl object-cover" /></a>
            ))}
          </div>
        )}
        <p className="whitespace-pre-wrap rounded-2xl border bg-white p-5">{r.description}</p>
        <ReportsMapDynamic reports={[r]} height="h-72" />
      </div>

      <aside className="space-y-5">
        <div className="space-y-3 rounded-2xl border bg-white p-5">
          <ConfirmButton reportId={r.id} userId={user?.id ?? null} initial={!!mine.data} count={confirmCount(r)}
            disabledReason={isOwner ? "O‘z muammongizni tasdiqlay olmaysiz" : undefined} />
          <p className="text-xs text-gray-500">Muammoni o‘zingiz ham ko‘rgan bo‘lsangiz, tasdiqlang.</p>
        </div>
        {isAdmin && (
          <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-semibold">Administrator: holatni o‘zgartirish</p>
            <AdminStatusSelect reportId={r.id} status={r.status} />
          </div>
        )}
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="mb-3 font-bold">Holat tarixi</h2>
          <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
            {(history ?? []).map((h) => (
              <li key={h.id} className="text-sm">
                <span className="font-semibold">{STATUSES[h.new_status as keyof typeof STATUSES]?.label}</span>
                <span className="block text-xs text-gray-500">{fmtDate(h.created_at)}</span>
              </li>
            ))}
          </ol>
        </div>
        {(isOwner && r.status === "yangi") || isAdmin ? <DeleteReportButton reportId={r.id} redirectTo={isAdmin ? "/admin" : "/dashboard"} /> : null}
        <Link href="/xarita" className="block text-sm font-semibold text-brand-700">← Xaritaga qaytish</Link>
      </aside>
    </div>
  );
}
