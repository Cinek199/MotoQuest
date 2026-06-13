"use client";

import { useEffect, useState } from "react";

import {
  AppNotification,
  getNotifications,
  markNotificationsAsRead,
} from "../lib/notifications";

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(markNotificationsAsRead());

    const syncNotifications = () => setNotifications(getNotifications());

    window.addEventListener("mq-notifications-updated", syncNotifications);

    return () => {
      window.removeEventListener("mq-notifications-updated", syncNotifications);
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#08090b] shadow-2xl shadow-black/50">
      <div className="p-3">
        <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-zinc-950/90">
          <div className="relative border-b border-white/10 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_44%)]" />
            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">
                MotoQuest
              </div>
              <h2 className="mt-1 text-2xl font-black text-white">
                Powiadomienia
              </h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Osiagniecia i wazne zdarzenia, ktore mogly umknac podczas jazdy.
              </p>
            </div>
          </div>

          {notifications.length > 0 ? (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-xl font-black text-orange-400">
                0
              </div>
              <div className="mt-4 text-lg font-black text-white">
                Brak powiadomien
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Gdy odblokujesz osiagniecie, pojawi sie tutaj.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function NotificationCard({
  notification,
}: {
  notification: AppNotification;
}) {
  return (
    <article className="flex items-start gap-3 p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-500/35 bg-orange-500/10 text-orange-400">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
          <path d="M6 6H4a3 3 0 0 0 3 3" />
          <path d="M18 6h2a3 3 0 0 1-3 3" />
          <path d="M12 13v4" />
          <path d="M9 21h6" />
          <path d="M10 17h4" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-black text-white">
              {notification.title}
            </h3>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {notification.message}
            </p>
          </div>

          {typeof notification.xp === "number" && (
            <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-black text-orange-300">
              +{notification.xp} XP
            </span>
          )}
        </div>

        <div className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
          {formatNotificationDate(notification.createdAt)}
        </div>
      </div>
    </article>
  );
}

function formatNotificationDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("pl-PL", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
