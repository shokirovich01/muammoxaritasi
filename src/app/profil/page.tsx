import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
export const metadata = { title: "Profil — MuammoXaritasi" };

export default async function Profile() {
  const { supabase, user } = await getUserAndRole();
  if (!user) redirect("/kirish");
  const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Mening profilim</h1>
      <ProfileForm userId={user.id} email={user.email ?? ""} fullName={data?.full_name ?? ""} phone={data?.phone ?? ""} />
    </div>
  );
}
