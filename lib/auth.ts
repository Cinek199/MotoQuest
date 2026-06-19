import { supabase } from "./supabase";

export async function signInAnonymously() {
  const rememberAccount = localStorage.getItem("mq_remember_account") !== "0";
  const sessionOnlyActive = sessionStorage.getItem("mq_session_only") === "1";

  if (!rememberAccount && !sessionOnlyActive) {
    await supabase.auth.signOut();
  }

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
