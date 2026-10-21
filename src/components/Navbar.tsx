import Link from "next/link";
import { getUserAndRole } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const { supabase, user, role } = await getUserAndRole();
  let unread = 0;
  if (user) {
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
    unread = count ?? 0;
  }
  const link = "rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50";
  return (
    <header className="sticky top-0 z-[1000] border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold text-brand-700">📍 MuammoXaritasi</Link>
        <div className="flex flex-wrap items-center gap-1">
          <Link href="/xarita" className={link}>Xarita</Link>
          {user ? (
            <>
              <Link href="/muammo-yuborish" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ Muammo yuborish</Link>
              <Link href="/dashboard" className={link}>Boshqaruv paneli</Link>
              {role === "admin" && <Link href="/admin" className={link}>Admin</Link>}
              <Link href="/bildirishnomalar" className={link}>🔔{unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{unread}</span>}</Link>
              <Link href="/profil" className={link}>Profil</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/kirish" className={link}>Kirish</Link>
              <Link href="/royxatdan-otish" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">Ro‘yxatdan o‘tish</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
