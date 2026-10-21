import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/supabase/server";
import ReportForm from "@/components/ReportForm";
export const metadata = { title: "Muammo yuborish — MuammoXaritasi" };

export default async function Page() {
  const { user } = await getUserAndRole();
  if (!user) redirect("/kirish");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Yangi muammo yuborish</h1>
      <ReportForm userId={user.id} />
    </div>
  );
}
