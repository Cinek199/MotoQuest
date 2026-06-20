"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthDivider, AuthInput, OAuthButton } from "./AuthLoginForm";

export default function AuthRegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const oauth = async (provider: "apple" | "google") => {
    const { supabase } = await import("../lib/supabase");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setMessage("Nie udalo sie uruchomic rejestracji zewnetrznej.");
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    setMessage("");
    if (cleanUsername.length < 3) return setMessage("Nick musi miec minimum 3 znaki.");
    if (password.length < 6) return setMessage("Haslo musi miec minimum 6 znakow.");
    setIsLoading(true);

    try {
      const { supabase } = await import("../lib/supabase");
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .maybeSingle();
      if (existing) throw new Error("Ten nick jest juz zajety.");

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { username: cleanUsername } },
      });
      if (error || data.user?.identities?.length === 0) {
        throw new Error("Nie udalo sie utworzyc konta. E-mail moze byc juz zajety.");
      }
      setMessage("Konto utworzone. Sprawdz e-mail, jesli wymagane jest potwierdzenie.");
      window.setTimeout(() => router.push("/login"), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Blad rejestracji.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="mq-auth-form">
      <AuthInput icon="user" label="Nick kierowcy" name="username" autoComplete="username" type="text" value={username} onChange={setUsername} placeholder="Twoj unikalny nick" disabled={isLoading} />
      <div className="mq-auth-hint">Min. 3 znaki, unikalny</div>
      <AuthInput icon="mail" label="Adres e-mail" name="email" autoComplete="email" type="email" value={email} onChange={setEmail} placeholder="E-mail" disabled={isLoading} />
      <AuthInput icon="lock" label="Haslo" name="password" autoComplete="new-password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="Haslo" disabled={isLoading} action={() => setShowPassword((value) => !value)} />
      <div className="mq-auth-hint">Min. 6 znakow</div>
      <button type="submit" disabled={isLoading} className="mq-auth-primary">
        {isLoading && <span className="mq-auth-spinner" aria-hidden="true" />}
        {isLoading ? "Tworzenie konta..." : "Zarejestruj sie"}
      </button>
      <AuthDivider />
      <div className="mq-auth-socials">
        <OAuthButton disabled={isLoading} label="Zarejestruj sie przez Google" onClick={() => void oauth("google")} mark="G" />
        <OAuthButton disabled={isLoading} label="Zarejestruj sie przez Apple" onClick={() => void oauth("apple")} mark="A" />
      </div>
      {message && <div className="mq-auth-message" role="status"><span aria-hidden="true">!</span>{message}</div>}
      <div className="mq-auth-switch">Masz juz konto? <Link href="/login">Zaloguj sie</Link></div>
    </form>
  );
}
