"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "../../../services/supabaseClient";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
      setMessage("Nick musi mieć minimum 3 znaki.");
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user) {
      setMessage("Konto utworzone. Możesz się zalogować.");
      router.push("/login");
    }
  };

  return (
    <main style={{ padding: 24, color: "white", background: "#0b0f14", minHeight: "100vh" }}>
      <h1>Rejestracja</h1>

      <form onSubmit={handleRegister} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nick"
          required
          minLength={3}
          style={{ padding: 12 }}
        />

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
          minLength={6}
          style={{ padding: 12 }}
        />

        <button type="submit" style={{ padding: 12 }}>
          Zarejestruj
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}