import { getJson, setJson, STORAGE_KEYS } from "./storage";

export type AppNotification = {
  achievementId?: string;
  createdAt: number;
  id: string;
  message: string;
  readAt: number | null;
  title: string;
  type: "achievement";
  xp?: number;
};

export function getNotifications() {
  return getJson<AppNotification[]>(STORAGE_KEYS.notifications, []);
}

export function getUnreadNotificationsCount() {
  return getNotifications().filter((notification) => !notification.readAt).length;
}

export function addAchievementNotification({
  achievementId,
  title,
  xp,
}: {
  achievementId: string;
  title: string;
  xp: number;
}) {
  const notifications = getNotifications();
  const id = `achievement-${achievementId}`;

  if (notifications.some((notification) => notification.id === id)) {
    return;
  }

  setJson(STORAGE_KEYS.notifications, [
    {
      achievementId,
      createdAt: Date.now(),
      id,
      message: `Odblokowano osiagniecie i dodano +${xp} XP.`,
      readAt: null,
      title,
      type: "achievement",
      xp,
    },
    ...notifications,
  ]);

  window.dispatchEvent(new Event("mq-notifications-updated"));
}

export function markNotificationsAsRead() {
  const now = Date.now();
  const notifications = getNotifications();
  const changed = notifications.some((notification) => !notification.readAt);

  if (!changed) {
    return notifications;
  }

  const nextNotifications = notifications.map((notification) => {
    if (notification.readAt) {
      return notification;
    }

    return {
      ...notification,
      readAt: now,
    };
  });

  setJson(STORAGE_KEYS.notifications, nextNotifications);
  window.dispatchEvent(new Event("mq-notifications-updated"));

  return nextNotifications;
}
