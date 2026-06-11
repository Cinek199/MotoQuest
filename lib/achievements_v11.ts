
export function checkAchievements() {
  const tiles = JSON.parse(localStorage.getItem("mq_tiles") || "[]").length;
  const towns = JSON.parse(localStorage.getItem("mq_towns") || "[]").length;

  const achievements = JSON.parse(
    localStorage.getItem("mq_achievements") || "[]"
  );

  const unlock = (id:string,title:string,xp:number) => {
    if (achievements.some((a:any)=>a.id===id)) return;

    achievements.push({id,title,xp});

    localStorage.setItem(
      "mq_achievements",
      JSON.stringify(achievements)
    );
  };

  if (tiles >= 1) unlock("tile-1","Pierwszy kafelek",50);
  if (tiles >= 10) unlock("tile-10","10 kafelków",150);
  if (tiles >= 50) unlock("tile-50","50 kafelków",500);

  if (towns >= 1) unlock("town-1","Pierwsza miejscowość",100);
  if (towns >= 10) unlock("town-10","10 miejscowości",300);
}
