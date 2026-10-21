"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmButton({ reportId, userId, initial, count, disabledReason }:
  { reportId: string; userId: string | null; initial: boolean; count: number; disabledReason?: string }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [n, setN] = useState(count);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!userId) return router.push("/kirish");
    setBusy(true);
    const supabase = createClient();
    if (on) {
      const { error } = await supabase.from("confirmations").delete().eq("report_id", reportId).eq("user_id", userId);
      if (!error) { setOn(false); setN(n - 1); }
    } else {
      const { error } = await supabase.from("confirmations").insert({ report_id: reportId, user_id: userId });
      if (!error) { setOn(true); setN(n + 1); }
    }
    setBusy(false);
    router.refresh();
  }
  if (disabledReason) return <p className="text-sm text-gray-500">👍 {n} ta tasdiq · {disabledReason}</p>;
  return (
    <button onClick={toggle} disabled={busy}
      className={`rounded-lg px-4 py-2 font-semibold ${on ? "bg-brand-600 text-white" : "border border-brand-600 text-brand-700 hover:bg-brand-50"}`}>
      👍 {on ? "Tasdiqlandi" : "Men ham ko‘rdim"} ({n})
    </button>
  );
}
