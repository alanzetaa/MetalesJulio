import type { StatTile } from "../../utils/adminStats";

export function AdminStatsRow({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="admin-stats-row">
      {tiles.map((t) =>
        t.onClick ? (
          <button
            type="button"
            className="admin-stat-tile admin-stat-tile-clickable"
            key={t.etiqueta}
            style={{ "--stat-color": t.color } as React.CSSProperties}
            onClick={t.onClick}
          >
            <b>{t.valor}</b>
            <span>{t.etiqueta}</span>
          </button>
        ) : (
          <div className="admin-stat-tile" key={t.etiqueta} style={{ "--stat-color": t.color } as React.CSSProperties}>
            <b>{t.valor}</b>
            <span>{t.etiqueta}</span>
          </div>
        )
      )}
    </div>
  );
}
