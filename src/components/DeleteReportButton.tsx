"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function DeleteReportButton({ reportId, redirectTo }: { reportId: string; redirectTo: string }) {
  const router = useRouter();
  return (
    <button className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
      onClick={async () => {
        if (!confirm("Muammoni o‘chirishni xohlaysizmi?")) return;
        const { error } = await createClient().from("reports").delete().eq("id", reportId);
        if (error) return alert("O‘chirib bo‘lmadi");
        router.push(redirectTo); router.refresh();
      }}>🗑️ O‘chirish</button>
  );
}
