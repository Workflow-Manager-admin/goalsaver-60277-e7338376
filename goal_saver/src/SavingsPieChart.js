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
 * Pie chart color palette (Goalie-friendly, colorblind-accessible)
 */
const PIE_COLORS = [
  "#25fff7",
  "#67ff83",
  "#ffde6e",
  "#ff57b2",
  "#38ffd9",
  "#50a8ff",
  "#7e42fa",
  "#f7c948",
  "#4caf50",
  "#fff35e",
  "#fa5d42",
  "#be50fc",
  "#2196f3"
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
        background: "linear-gradient(115deg, var(--goalie-card) 84%, #171d34 100%)",
        borderRadius: "21px",
        boxShadow:
          "0 3.5px 20px 0 #1e243a90, 0 1px 12px #10131b30",
        textAlign: "center"
      }}>
        <div className="pie-chart-header">Savings Distribution</div>
        <div style={{ color: "#7afe8e", fontWeight: 500, fontSize: 17, padding: "18px 0" }}>
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
        background: "linear-gradient(115deg, var(--goalie-card) 84%, #171d34 100%)",
        borderRadius: "21px",
        boxShadow: "0 3.5px 20px 0 #1e243a90, 0 1px 12px #10131b30",
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
            stroke="#232446"
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
              background: "#2b2947",
              borderRadius: 7,
              border: "1px solid #67ff83",
              color: "#25fff7",
              fontWeight: 600
            }}
            cursor={{ fill: "#232446" }}
          />
          <Legend
            iconType="circle"
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              color: "var(--goalie-accent)",
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
