"use client";

import { useState } from "react";
import AuthShell from "../../../components/AuthShell";
import { AuthInput } from "../../../components/AuthLoginForm";
import { supabase } from "../../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  return <AuthShell eyebrow="Ochrona konta" title="Odzyskaj dostep" subtitle="Ustaw nowe bezpieczne haslo.">
    <form className="mq-auth-form" onSubmit={async (event) => { event.preventDefault(); const { error } = await supabase.auth.updateUser({ password }); setMessage(error ? "Nie udalo sie zmienic hasla." : "Haslo zmienione. Mozesz sie zalogowac."); }}>
      <AuthInput icon="lock" label="Nowe haslo" name="new-password" autoComplete="new-password" minLength={6} type="password" value={password} onChange={setPassword} placeholder="Minimum 6 znakow" disabled={false} />
      <button className="mq-auth-primary" type="submit">Zapisz nowe haslo</button>
      {message && <div className="mq-auth-message">{message}</div>}
    </form>
  </AuthShell>;
}
