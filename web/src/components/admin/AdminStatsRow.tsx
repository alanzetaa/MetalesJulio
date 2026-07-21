import type { StatTile } from "../../utils/adminStats";

export function AdminStatsRow({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="admin-stats-row">
      {tiles.map((t) => (
        <div className="admin-stat-tile" key={t.etiqueta} style={{ "--stat-color": t.color } as React.CSSProperties}>
          <b>{t.valor}</b>
          <span>{t.etiqueta}</span>
        </div>
      ))}
    </div>
  );
}
