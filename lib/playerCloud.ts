
import { supabase } from "./supabase";

export async function syncVoivodeships(userId:string, voivodeships:string[]) {
  return supabase
    .from("players")
    .upsert({
      id:userId,
      discovered_voivodeships: voivodeships
    });
}
