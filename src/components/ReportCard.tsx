import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { confirmCount, fmtDate, type Report } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function ReportCard({ r }: { r: Report }) {
  return (
    <Link href={`/muammo/${r.id}`} className="block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      {r.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photos[0]} alt={r.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-brand-50 text-5xl">{CATEGORIES[r.category].emoji}</div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">{CATEGORIES[r.category].label}</span>
          <StatusBadge status={r.status} />
        </div>
        <h3 className="line-clamp-2 font-bold">{r.title}</h3>
        <p className="text-xs text-gray-500">{r.region} · {fmtDate(r.created_at)} · 👍 {confirmCount(r)}</p>
      </div>
    </Link>
  );
}
