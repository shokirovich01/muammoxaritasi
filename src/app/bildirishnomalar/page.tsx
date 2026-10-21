import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/supabase/server";
import NotificationList from "@/components/NotificationList";
import type { Notification } from "@/lib/types";
export const metadata = { title: "Bildirishnomalar — MuammoXaritasi" };

export default async function Page() {
  const { supabase, user } = await getUserAndRole();
  if (!user) redirect("/kirish");
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Bildirishnomalar</h1>
      <NotificationList items={(data ?? []) as Notification[]} />
    </div>
  );
}
