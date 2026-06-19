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
      <section className="mq-auth-card">
        <div className="mq-auth-eyebrow">{eyebrow}</div>
        <img className="mq-auth-logo" src="/icon-512.png" alt="MotoQuest" />
        <h1 className="mq-auth-title">{title}</h1>
        <p className="mq-auth-subtitle">{subtitle}</p>
        {children}
        <Link href="/#profile" className="mq-auth-back">Wroc do profilu</Link>
      </section>
    </main>
  );
}
