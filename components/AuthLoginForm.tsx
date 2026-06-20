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
  const [rememberAccount, setRememberAccount] = useState(true);
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
      localStorage.setItem("mq_remember_account", rememberAccount ? "1" : "0");
      if (rememberAccount) sessionStorage.removeItem("mq_session_only");
      else sessionStorage.setItem("mq_session_only", "1");
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
        label="Adres e-mail"
        name="email"
        autoComplete="email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="E-mail"
        disabled={isLoading}
      />
      <AuthInput
        icon="lock"
        label="Haslo"
        name="password"
        autoComplete="current-password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="Haslo"
        disabled={isLoading}
        action={() => setShowPassword((value) => !value)}
      />
      <button type="button" onClick={resetPassword} disabled={isLoading} className="mq-auth-forgot">
        Nie pamietasz hasla?
      </button>
      <label className="mq-auth-remember">
        <input type="checkbox" checked={rememberAccount} onChange={(event) => setRememberAccount(event.target.checked)} />
        <span>Nie wylogowuj mnie po zamknieciu aplikacji</span>
      </label>
      <button type="submit" disabled={isLoading} className="mq-auth-primary">
        {isLoading && <span className="mq-auth-spinner" aria-hidden="true" />}
        {isLoading ? "Logowanie..." : "Zaloguj sie"}
      </button>
      <AuthDivider />
      <div className="mq-auth-socials">
        <OAuthButton disabled={isLoading} label="Kontynuuj z Google" onClick={() => void oauth("google")} mark="G" />
        <OAuthButton disabled={isLoading} label="Kontynuuj z Apple" onClick={() => void oauth("apple")} mark="A" />
      </div>
      {message && <div className="mq-auth-message" role="status"><span aria-hidden="true">!</span>{message}</div>}
      <div className="mq-auth-switch">
        Nie masz jeszcze konta? <Link href="/register">Zarejestruj sie</Link>
      </div>
    </form>
  );
}

export function AuthInput({
  action,
  autoComplete,
  disabled,
  icon,
  label,
  minLength,
  name,
  onChange,
  placeholder,
  type,
  value,
}: {
  action?: () => void;
  autoComplete?: string;
  disabled: boolean;
  icon: "lock" | "mail" | "user";
  label: string;
  minLength?: number;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <label className="mq-auth-field">
      <span className="mq-auth-field-label">{label}</span>
      <span className="mq-auth-input">
        <span className="mq-auth-input-icon"><AuthFieldIcon icon={icon} /></span>
        <input
          autoComplete={autoComplete}
          minLength={minLength}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          disabled={disabled}
        />
        {action && <button type="button" onClick={action} disabled={disabled} aria-label="Pokaz lub ukryj haslo"><EyeIcon hidden={type === "password"} /></button>}
      </span>
    </label>
  );
}

function AuthFieldIcon({ icon }: { icon: "lock" | "mail" | "user" }) {
  if (icon === "mail") return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (icon === "user") return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  return <svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>{hidden && <path d="m4 4 16 16"/>}</svg>;
}

export function AuthDivider() {
  return <div className="mq-auth-divider"><span>lub</span></div>;
}

export function OAuthButton({ disabled = false, label, mark, onClick }: { disabled?: boolean; label: string; mark: string; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="mq-auth-oauth"><b>{mark}</b><span>{label}</span></button>;
}
