"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "../../../services/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <main style={{ padding: 24, color: "white", background: "#0b0f14", minHeight: "100vh" }}>
      <h1>Logowanie</h1>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          style={{ padding: 12 }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          required
          style={{ padding: 12 }}
        />

        <button type="submit" style={{ padding: 12 }}>
          Zaloguj
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}