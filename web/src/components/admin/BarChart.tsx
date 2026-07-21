import type { ChartBarItem } from "../../utils/adminCharts";

export function BarChart({ items }: { items: ChartBarItem[] }) {
  if (!items.length) {
    return <div className="admin-empty-chart">Todavía no hay datos suficientes.</div>;
  }
  const max = Math.max(...items.map((i) => i.value));
  return (
    <>
      {items.map((item, i) => {
        const pct = max > 0 ? Math.max((item.value / max) * 100, 3) : 3;
        return (
          <div className="admin-chart-bar-wrap" key={i}>
            <div className="admin-chart-bar" style={{ height: `${pct}%`, background: item.color ?? "var(--color-accent)" }}>
              <span className="admin-chart-tooltip">
                {item.tooltip ?? item.label}: {item.value}
              </span>
            </div>
            <span className="admin-chart-label">{item.label}</span>
          </div>
        );
      })}
    </>
  );
}
