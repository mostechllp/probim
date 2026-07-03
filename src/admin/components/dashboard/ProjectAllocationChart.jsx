import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, COLORS } from "../../pages/Dashboard";

export const ProjectAllocationChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[280px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No project data available
        </p>
      </div>
    );
  }

  const truncatedData = data.map((item) => ({
    ...item,
    displayName:
      item.name && item.name.length > 12
        ? item.name.substring(0, 12) + "..."
        : item.name || "Unknown",
    fullName: item.name || "Unknown",
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-chart-bar text-gray-500 dark:text-gray-400"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Employees per project
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={truncatedData}
          margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="displayName"
            tick={{ fontSize: 10, fill: "#898781" }}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={40}
            interval={0}
            dy={5}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
            grid={{ stroke: "#e1e0d9", strokeWidth: 0.5 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value, name, props) => {
              const fullName =
                props?.payload?.fullName || props?.payload?.name || "";
              return [`${value} employees`, fullName];
            }}
          />
          <Bar
            dataKey="employees"
            fill={COLORS.blue}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          >
            {truncatedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};