
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(
          list: {
            name: string;
            value: string;
            options?: import("cookie").CookieSerializeOptions;
          }[]
        ) {
          try {
            list.forEach(({ name, value, options }) => {
              store.set(name, value, options);
            });
          } catch {
            // Server Component ichida cookie yozish imkonsiz bo‘lishi mumkin.
          }
        },
      },
    }
  );
}

export async function getUserAndRole() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { supabase, user, role: null };
  }

  return { supabase, user, role: profile.role };
}
