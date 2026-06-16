"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "../../../services/supabaseClient";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    setMessage("");

    if (cleanUsername.length < 3) {
      setMessage("Nick musi mieć minimum 3 znaki.");
      return;
    }

    if (password.length < 6) {
      setMessage("Hasło musi mieć minimum 6 znaków.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingProfile, error: checkError } = await supabaseClient
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (checkError) {
        setMessage("Nie udało się sprawdzić nicku. Spróbuj ponownie.");
        return;
      }

      if (existingProfile) {
        setMessage("Ten nick jest już zajęty. Wybierz inny.");
        return;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setMessage("Ten e-mail jest już zarejestrowany.");
          return;
        }

        setMessage(error.message);
        return;
      }

      if (data.user) {
        setMessage("Konto utworzone. Możesz się zalogować.");
        router.push("/login");
      }
    } catch (error) {
      console.error("Register error:", error);
      setMessage("Wystąpił błąd podczas rejestracji.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, color: "white", background: "#0b0f14", minHeight: "100vh" }}>
      <h1>Rejestracja</h1>

      <form onSubmit={handleRegister} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Nick"
          required
          minLength={3}
          disabled={isLoading}
          style={{ padding: 12 }}
        />

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail"
          required
          disabled={isLoading}
          style={{ padding: 12 }}
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Hasło"
          required
          minLength={6}
          disabled={isLoading}
          style={{ padding: 12 }}
        />

        <button type="submit" disabled={isLoading} style={{ padding: 12 }}>
          {isLoading ? "Tworzenie konta..." : "Zarejestruj"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}