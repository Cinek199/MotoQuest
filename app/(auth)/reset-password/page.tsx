"use client";

import { useState } from "react";
import AuthShell from "../../../components/AuthShell";
import { supabase } from "../../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  return <AuthShell eyebrow="NOWE HASLO" title="Odzyskaj dostep" subtitle="Ustaw nowe bezpieczne haslo.">
    <form className="mq-auth-form" onSubmit={async (event) => { event.preventDefault(); const { error } = await supabase.auth.updateUser({ password }); setMessage(error ? "Nie udalo sie zmienic hasla." : "Haslo zmienione. Mozesz sie zalogowac."); }}>
      <label className="mq-auth-input"><span>#</span><input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nowe haslo" /></label>
      <button className="mq-auth-primary" type="submit">Zapisz nowe haslo</button>
      {message && <div className="mq-auth-message">{message}</div>}
    </form>
  </AuthShell>;
}
