"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STATUSES, type StatusKey } from "@/lib/constants";

export default function AdminStatusSelect({ reportId, status }: { reportId: string; status: StatusKey }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState("");
  async function change(next: StatusKey) {
    setMsg("");
    const { error } = await createClient().from("reports").update({ status: next }).eq("id", reportId);
    if (error) return setMsg("Xatolik");
    setValue(next);
    router.refresh();
  }
  return (
    <span className="inline-flex items-center gap-2">
      <select value={value} onChange={(e) => change(e.target.value as StatusKey)} className="rounded-lg border bg-white px-2 py-1 text-sm">
        {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      {msg && <span className="text-xs text-red-600">{msg}</span>}
    </span>
  );
}
