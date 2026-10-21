"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function LogoutButton() {
  const router = useRouter();
  return (
    <button className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50"
      onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>
      Chiqish
    </button>
  );
}
