import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({
  children,
  eyebrow,
  subtitle,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  subtitle: string;
  title: ReactNode;
}) {
  return (
    <main className="mq-auth-page">
      <div className="mq-auth-atmosphere" aria-hidden="true" />
      <section className="mq-auth-card" aria-labelledby="mq-auth-title">
        <div className="mq-auth-brand">
          <div className="mq-auth-logo-frame">
            <span className="mq-auth-logo-ring" aria-hidden="true" />
            <img className="mq-auth-logo" src="/icon-512.png" alt="MotoQuest" />
          </div>
          <div className="mq-auth-wordmark">MOTO<span>QUEST</span></div>
          <div className="mq-auth-eyebrow">{eyebrow}</div>
        </div>

        <div className="mq-auth-heading">
          <h1 id="mq-auth-title" className="mq-auth-title">{title}</h1>
          <p className="mq-auth-subtitle">{subtitle}</p>
        </div>

        <div className="mq-auth-content">{children}</div>

        <Link href="/#profile" className="mq-auth-back">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          Wroc do profilu
        </Link>
        <div className="mq-auth-security" aria-hidden="true">
          <span /> Bezpieczny dostep do Twojego swiata
        </div>
      </section>
    </main>
  );
}
