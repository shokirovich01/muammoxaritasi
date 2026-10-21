import { STATUSES, type StatusKey } from "@/lib/constants";
export default function StatusBadge({ status }: { status: StatusKey }) {
  const s = STATUSES[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}
