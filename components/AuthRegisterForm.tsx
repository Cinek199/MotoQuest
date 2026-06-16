"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthRegisterForm() {
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
      setMessage("Nick musi miec minimum 3 znaki.");
      return;
    }

    if (password.length < 6) {
      setMessage("Haslo musi miec minimum 6 znakow.");
      return;
    }

    setIsLoading(true);

    try {
      const { supabase } = await import("../lib/supabase");

      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .maybeSingle();

      if (checkError) {
        console.error("Username check error:", checkError);
        setMessage("Nie udalo sie sprawdzic nicku. Sprobuj ponownie.");
        return;
      }

      if (existingProfile) {
        setMessage("Ten nick jest juz zajety. Wybierz inny.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("user already")
        ) {
          setMessage("Ten e-mail jest juz zarejestrowany.");
          return;
        }

        console.error("Register auth error:", error);
        setMessage("Nie udalo sie utworzyc konta. Sprobuj ponownie.");
        return;
      }

      if (data.user?.identities && data.user.identities.length === 0) {
        setMessage("Ten e-mail jest juz zarejestrowany.");
        return;
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          username: cleanUsername,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Profile create after register error:", profileError);
        }
      }

      if (data.user) {
        setMessage(
          data.session
            ? "Konto utworzone. Mozesz sie zalogowac."
            : "Konto utworzone. Sprawdz e-mail, jesli Supabase wymaga potwierdzenia."
        );
        router.push("/login");
      }
    } catch (error) {
      console.error("Register error:", error);
      setMessage("Wystapil blad podczas rejestracji.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      style={{ display: "grid", gap: 12, maxWidth: 360 }}
    >
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
        placeholder="Haslo"
        required
        minLength={6}
        disabled={isLoading}
        style={{ padding: 12 }}
      />

      <button type="submit" disabled={isLoading} style={{ padding: 12 }}>
        {isLoading ? "Tworzenie konta..." : "Zarejestruj"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
