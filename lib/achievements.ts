import { addAchievementNotification } from "./notifications";

export function unlockAchievement(
  id: string,
  title: string,
  xp: number
) {
  const achievements = JSON.parse(
    localStorage.getItem(
      "mq_achievements"
    ) || "[]"
  );

  const exists = achievements.find(
    (a: any) => a.id === id
  );

  if (exists) return false;

  achievements.push({
    id,
    title,
    xp,
  });

  localStorage.setItem(
    "mq_achievements",
    JSON.stringify(achievements)
  );

  addAchievementNotification({
    achievementId: id,
    title,
    xp,
  });

  return true;
}
