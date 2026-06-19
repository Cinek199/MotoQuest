"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const oauth = async (provider: "apple" | "google") => {
    setMessage("");
    const { supabase } = await import("../lib/supabase");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setMessage("Nie udalo sie uruchomic logowania zewnetrznego.");
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setMessage("Najpierw wpisz adres e-mail.");
      return;
    }
    const { supabase } = await import("../lib/supabase");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage(error ? "Nie udalo sie wyslac wiadomosci." : "Link do zmiany hasla zostal wyslany.");
  };

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
      if (error) throw new Error("Nieprawidlowy e-mail lub haslo.");
      if (data.user) await loadPlayer(data.user.id);
      window.dispatchEvent(new Event("motoquest-progress-updated"));
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udalo sie zalogowac.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="mq-auth-form">
      <AuthInput
        icon="mail"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="E-mail"
        disabled={isLoading}
      />
      <AuthInput
        icon="lock"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="Haslo"
        disabled={isLoading}
        action={() => setShowPassword((value) => !value)}
      />
      <button type="button" onClick={resetPassword} className="mq-auth-forgot">
        Nie pamietasz hasla?
      </button>
      <button type="submit" disabled={isLoading} className="mq-auth-primary">
        {isLoading ? "Logowanie..." : "Zaloguj sie"}
      </button>
      <AuthDivider />
      <OAuthButton label="Kontynuuj z Google" onClick={() => void oauth("google")} mark="G" />
      <OAuthButton label="Kontynuuj z Apple" onClick={() => void oauth("apple")} mark="A" />
      {message && <div className="mq-auth-message">{message}</div>}
      <div className="mq-auth-switch">
        Nie masz jeszcze konta? <Link href="/register">Zarejestruj sie</Link>
      </div>
    </form>
  );
}

export function AuthInput({
  action,
  disabled,
  icon,
  onChange,
  placeholder,
  type,
  value,
}: {
  action?: () => void;
  disabled: boolean;
  icon: "lock" | "mail" | "user";
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <label className="mq-auth-input">
      <span>{icon === "mail" ? "@" : icon === "lock" ? "#" : "U"}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        disabled={disabled}
      />
      {action && <button type="button" onClick={action} aria-label="Pokaz lub ukryj haslo">O</button>}
    </label>
  );
}

export function AuthDivider() {
  return <div className="mq-auth-divider"><span>lub</span></div>;
}

export function OAuthButton({ label, mark, onClick }: { label: string; mark: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mq-auth-oauth"><b>{mark}</b>{label}</button>;
}
