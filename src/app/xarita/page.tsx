import { createClient } from "@/lib/supabase/server";
import type { Report } from "@/lib/types";
import MapExplorer from "@/components/MapExplorer";

export const metadata = { title: "Xarita — MuammoXaritasi" };

export default async function MapPage() {
 const supabase = await createClient();
const { data } = await supabase.from("reports").select("*, confirmations(count)").order("created_at", { ascending: false }).limit(1000);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Muammolar xaritasi</h1>
      <MapExplorer reports={(data ?? []) as Report[]} />
    </div>
  );
}
