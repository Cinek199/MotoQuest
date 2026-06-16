"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const [{ supabase }, { loadPlayer }] = await Promise.all([
        import("../lib/supabase"),
        import("../lib/playerService"),
      ]);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage("Nieprawidlowy e-mail lub haslo.");
        return;
      }

      if (data.user) {
        try {
          await loadPlayer(data.user.id);
        } catch (loadError) {
          console.error("Load player after login error:", loadError);
          setMessage("Zalogowano, ale nie udalo sie pobrac postepu.");
        }
      }

      window.dispatchEvent(new Event("motoquest-progress-updated"));
      window.dispatchEvent(new Event("storage"));
      router.replace("/");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Nie udalo sie zalogowac. Sprobuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      style={{ display: "grid", gap: 12, maxWidth: 360 }}
    >
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
        disabled={isLoading}
        style={{ padding: 12 }}
      />

      <button type="submit" disabled={isLoading} style={{ padding: 12 }}>
        {isLoading ? "Logowanie..." : "Zaloguj"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
