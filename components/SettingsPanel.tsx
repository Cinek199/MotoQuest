"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "../lib/profile";
import { supabase } from "../lib/supabase";

const options = [
  ["mq-setting-notifications", "Powiadomienia", "Osiagniecia, misje i nowe odkrycia"],
  ["mq-setting-discovery", "Efekty odkrywania", "Animowana mgla i podswietlenia"],
  ["mq-setting-wake", "Nie wygaszaj podczas jazdy", "Aktywne podczas korzystania z mapy"],
] as const;

export default function SettingsPanel() {
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setValues(Object.fromEntries(options.map(([key]) => [key, localStorage.getItem(key) !== "0"])));
    setNickname(getProfile().nickname);
  }, []);

  const toggle = (key: string) => {
    setValues((current) => {
      const next = !current[key];
      localStorage.setItem(key, next ? "1" : "0");
      return { ...current, [key]: next };
    });
  };

  const saveNickname = async () => {
    const clean = nickname.trim();
    if (clean.length < 3) return setStatus("Nick musi miec minimum 3 znaki.");

    const { data: { user } } = await supabase.auth.getUser();
    if (user && !user.is_anonymous) {
      const { data: taken } = await supabase.from("profiles").select("id").ilike("username", clean).neq("id", user.id).maybeSingle();
      if (taken) return setStatus("Ten nick jest juz zajety.");
      const { error } = await supabase.from("profiles").upsert({ id: user.id, username: clean, updated_at: new Date().toISOString() });
      if (error) return setStatus("Nie udalo sie zapisac nicku w chmurze.");
    }

    saveProfile({ ...getProfile(), nickname: clean });
    window.dispatchEvent(new Event("motoquest-progress-updated"));
    setStatus("Nick zostal zapisany.");
  };

  return (
    <div className="mq-settings-panel">
      <div className="mq-settings-brand"><img src="/icon-512.png" alt="" /><div><b>MotoQuest</b><span>Mapa odkrywania</span></div></div>
      <div className="mq-settings-group">
        <h2>Profil</h2>
        <div className="mq-settings-nick">
          <label htmlFor="settings-nickname">Nick uzytkownika</label>
          <div><input id="settings-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} /><button type="button" onClick={() => void saveNickname()}>Zapisz</button></div>
          {status && <small>{status}</small>}
        </div>
      </div>
      <div className="mq-settings-group">
        <h2>Preferencje</h2>
        {options.map(([key, title, description]) => (
          <button key={key} type="button" className="mq-setting-row" onClick={() => toggle(key)}>
            <span><b>{title}</b><small>{description}</small></span>
            <i className={values[key] ? "is-on" : ""}><em /></i>
          </button>
        ))}
      </div>
      <div className="mq-settings-group">
        <h2>Konto</h2>
        <Link href="/login" className="mq-setting-link">Zaloguj sie lub zmien konto</Link>
        <button type="button" className="mq-setting-link danger" onClick={async () => { await supabase.auth.signOut(); location.href = "/login"; }}>Wyloguj sie</button>
      </div>
      <div className="mq-settings-version">MotoQuest 1.3</div>
    </div>
  );
}
