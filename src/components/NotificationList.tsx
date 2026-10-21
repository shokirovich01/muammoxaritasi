"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fmtDate, type Notification } from "@/lib/types";

export default function NotificationList({ items }: { items: Notification[] }) {
  const router = useRouter();
  const unread = items.filter((n) => !n.is_read).length;
  async function markAll() {
    await createClient().from("notifications").update({ is_read: true }).eq("is_read", false);
    router.refresh();
  }
  if (!items.length) return <p className="rounded-2xl border bg-white p-8 text-center text-gray-500">Hozircha bildirishnomalar yo‘q.</p>;
  return (
    <div className="space-y-3">
      {unread > 0 && <button onClick={markAll} className="text-sm font-semibold text-brand-700 underline">Barchasini o‘qilgan deb belgilash</button>}
      {items.map((n) => (
        <div key={n.id} className={`rounded-xl border p-4 ${n.is_read ? "bg-white" : "border-brand-500 bg-brand-50"}`}>
          <p className="text-sm">{n.message}</p>
          <p className="mt-1 flex items-center gap-3 text-xs text-gray-500">{fmtDate(n.created_at)}
            {n.report_id && <Link href={`/muammo/${n.report_id}`} className="font-semibold text-brand-700">Ko‘rish →</Link>}</p>
        </div>
      ))}
    </div>
  );
}
