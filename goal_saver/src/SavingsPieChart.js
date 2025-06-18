import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * Pie chart color palette (Goalie - modern airy pastel for light theme, accessible)
 */
const PIE_COLORS = [
  "#a5ecec",   // pastel teal
  "#b9dbfa",   // pastel blue
  "#fde2e4",   // blush
  "#fff4d1",   // light yellow
  "#c4e4b6",   // light mint
  "#ede2f8",   // lavender
  "#f2f7ff",   // powder blue
  "#ffe0e9",   // very soft pink
  "#ffecd2",   // pale apricot
  "#eafcfc",   // crystal blue
  "#ffd4a3",   // light peach
  "#bee1e6",   // mint sky
  "#ffe9f0",   // hint pink
];

// PUBLIC_INTERFACE
function SavingsPieChart({ goals }) {
  /**
   * Prepare data for pie chart:
   * Only include goals with savings > 0.
   */
  const data = Array.isArray(goals)
    ? goals
        .filter((g) => g.progress > 0)
        .map((g) => ({
          name: g.title,
          value: g.progress,
        }))
    : [];

  if (!data.length) {
    return (
      <section className="pie-chart-section" style={{
        margin: "38px 0 41px 0",
        padding: "30px 0 29px 0",
        background: "linear-gradient(115deg, #f6fbff 90%, #f2f7ff 100%)",
        borderRadius: "18px",
        boxShadow: "0 3px 10px 0 #d2e4ff32, 0 1px 6px #fafaff13",
        textAlign: "center"
      }}>
        <div className="pie-chart-header">Savings Distribution</div>
        <div style={{ color: "#6fc1be", fontWeight: 500, fontSize: 17, padding: "18px 0" }}>
          No savings added yet.<br />Add savings to your goals to see your distribution!
        </div>
      </section>
    );
  }

  return (
    <section
      className="pie-chart-section"
      aria-label="Savings distribution pie chart"
      style={{
        margin: "38px 0 41px 0",
        padding: "30px 0 29px 0",
        background: "linear-gradient(115deg, #f8fbfd 90%, #f2f7ff 100%)",
        borderRadius: "18px",
        boxShadow: "0 3px 10px 0 #d2e4ff32, 0 1px 6px #fafaff13",
      }}
    >
      <div className="pie-chart-header">Savings Distribution</div>
      <ResponsiveContainer width="100%" height={250} minWidth={290}>
        <PieChart width={350} height={250}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={35}
            labelLine={false}
            label={({ percent, name }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            isAnimationActive={true}
            stroke="#e4e8f0"
            strokeWidth={3}
            aria-label="Pie segment"
          >
            {data.map((entry, idx) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[idx % PIE_COLORS.length]}
                tabIndex={0}
                aria-label={`${entry.name} slice: ₹${entry.value}`}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
            contentStyle={{
              background: "#f7fafc",
              borderRadius: 7,
              border: "1px solid #b2f3e9",
              color: "#5796bb",
              fontWeight: 600
            }}
            cursor={{ fill: "#eff7ff" }}
          />
          <Legend
            iconType="circle"
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              color: "#79a8ba",
              fontWeight: 700,
              fontSize: 13,
              marginTop: 14
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}

export default SavingsPieChart;
