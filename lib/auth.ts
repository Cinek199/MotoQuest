import { supabase } from "./supabase";

export async function signInAnonymously() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const { data, error } =
    await supabase.auth.signInAnonymously();

  if (error) {
    console.error("Anonymous sign in error:", error.message);
    return null;
  }

  return data.user;
}
