"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProfile, saveProfile } from "../lib/profile";
import { supabase } from "../lib/supabase";

const options = [
  [
    "mq-setting-notifications",
    "Powiadomienia",
    "Osiagniecia, misje i nowe odkrycia",
  ],
  [
    "mq-setting-discovery",
    "Efekty odkrywania",
    "Animowana mgla i podswietlenia mapy",
  ],
  [
    "mq-setting-wake",
    "Nie wygaszaj podczas jazdy",
    "Aktywne podczas korzystania z mapy",
  ],
] as const;

export default function SettingsPanel() {
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setValues(
      Object.fromEntries(
        options.map(([key]) => [key, localStorage.getItem(key) !== "0"])
      )
    );
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

    if (clean.length < 3) {
      return setStatus("Nick musi miec minimum 3 znaki.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !user.is_anonymous) {
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", clean)
        .neq("id", user.id)
        .maybeSingle();

      if (taken) {
        return setStatus("Ten nick jest juz zajety.");
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
        username: clean,
      });

      if (error) {
        return setStatus("Nie udalo sie zapisac nicku w chmurze.");
      }
    }

    saveProfile({ ...getProfile(), nickname: clean });
    window.dispatchEvent(new Event("motoquest-progress-updated"));
    setStatus("Nick zostal zapisany.");
  };

  return (
    <section className="mq-settings-panel">
      <div className="mq-settings-hero">
        <div className="mq-settings-hero-mark">MQ</div>
        <div>
          <span className="mq-profile-eyebrow">Ustawienia konta</span>
          <h2>Centrum kontroli MotoQuest</h2>
          <p>
            Tutaj zarzadzasz tozsamoscia kierowcy, preferencjami i dostepem do
            chmury.
          </p>
        </div>
      </div>

      <div className="mq-settings-group">
        <div className="mq-settings-group-head">
          <span className="mq-profile-eyebrow">Profil</span>
          <h3>Nick uzytkownika</h3>
        </div>

        <div className="mq-settings-nick">
          <label htmlFor="settings-nickname">Jak bedziesz widoczny w rankingach</label>
          <div className="mq-settings-nick-row">
            <input
              id="settings-nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
            <button type="button" onClick={() => void saveNickname()}>
              Zapisz
            </button>
          </div>
          {status ? <small>{status}</small> : null}
        </div>
      </div>

      <div className="mq-settings-group">
        <div className="mq-settings-group-head">
          <span className="mq-profile-eyebrow">Preferencje</span>
          <h3>Komfort jazdy i odkrywania</h3>
        </div>

        <div className="mq-settings-list">
          {options.map(([key, title, description]) => (
            <button
              key={key}
              type="button"
              className="mq-setting-row"
              onClick={() => toggle(key)}
            >
              <span className="mq-setting-copy">
                <b>{title}</b>
                <small>{description}</small>
              </span>
              <i className={values[key] ? "is-on" : ""}>
                <em />
              </i>
            </button>
          ))}
        </div>
      </div>

      <div className="mq-settings-group">
        <div className="mq-settings-group-head">
          <span className="mq-profile-eyebrow">Konto</span>
          <h3>Dostep i bezpieczenstwo</h3>
        </div>

        <div className="mq-settings-actions">
          <Link href="/login" className="mq-setting-link">
            Zaloguj sie lub zmien konto
          </Link>
          <button
            type="button"
            className="mq-setting-link danger"
            onClick={async () => {
              await supabase.auth.signOut();
              location.href = "/login";
            }}
          >
            Wyloguj sie
          </button>
        </div>
      </div>

      <div className="mq-settings-version">MotoQuest 1.4</div>
    </section>
  );
}
