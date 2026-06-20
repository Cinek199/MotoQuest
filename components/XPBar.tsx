"use client";

export default function XPBar({ xp }: { xp: number }) {
  const currentLevel = Math.floor(xp / 1000) + 1;
  const levelXp = xp % 1000;
  const progress = Math.min(100, (levelXp / 1000) * 100);
  const nextLevelXp = 1000 - levelXp;

  return (
    <section className="mq-xp-panel">
      <div className="mq-xp-panel-head">
        <div>
          <span className="mq-profile-eyebrow">Postep poziomu</span>
          <h2>Silnik progresu</h2>
          <p>Zbieraj kafelki, miasta i osiagniecia, aby szybciej awansowac.</p>
        </div>

        <div className="mq-xp-level-pill">
          <span>Level</span>
          <strong>{currentLevel}</strong>
        </div>
      </div>

      <div className="mq-xp-track">
        <div className="mq-xp-track-glow" style={{ width: `${progress}%` }} />
      </div>

      <div className="mq-xp-summary">
        <div className="mq-xp-summary-card">
          <span>Aktualnie</span>
          <strong>{levelXp} XP</strong>
        </div>
        <div className="mq-xp-summary-card">
          <span>Do nastepnego</span>
          <strong>{nextLevelXp} XP</strong>
        </div>
        <div className="mq-xp-summary-card">
          <span>Wszystkie XP</span>
          <strong>{xp}</strong>
        </div>
      </div>
    </section>
  );
}
