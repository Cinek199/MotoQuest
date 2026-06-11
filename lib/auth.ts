import { supabase } from "./supabase";

export async function signInAnonymously() {
  const { data, error } =
    await supabase.auth.signInAnonymously();

  if (error) {
    console.error(error);
    return null;
  }

  return data.user;
}