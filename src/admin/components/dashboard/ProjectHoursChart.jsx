import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, COLORS } from "../../pages/Dashboard";

export const ProjectHoursChart = ({ data, onBarClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[280px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No hours data available
        </p>
      </div>
    );
  }

  const truncatedData = data.map((item) => ({
    ...item,
    displayName:
      item.name && item.name.length > 15
        ? item.name.substring(0, 15) + "..."
        : item.name || "Unknown",
    fullName: item.name || "Unknown",
    originalData: item,
  }));

  const handleBarClick = (entry, index) => {
    if (entry && onBarClick) {
      const payload = {
        activePayload: [
          {
            payload: {
              id: entry.id || entry.projectId,
              name: entry.fullName || entry.name,
              hours: entry.hours,
              originalData: entry.originalData || entry,
            },
          },
        ],
      };
      onBarClick(payload);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-clock text-gray-500 dark:text-gray-400"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total working hours per project
        </h3>
        <span className="text-xs text-gray-400 ml-auto">
          Click a bar for details
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={truncatedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
            tickFormatter={(value) => `${value}h`}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value, name, props) => {
              const fullName =
                props?.payload?.fullName || props?.payload?.name || "";
              return [`${value} hours`, fullName];
            }}
          />
          <Bar
            dataKey="hours"
            fill={COLORS.aqua}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            cursor="pointer"
            onClick={handleBarClick}
          >
            {truncatedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-400 text-center mt-2">
        <i className="fas fa-hand-pointer mr-1"></i> Click on any bar to view
        employee details
      </div>
    </div>
  );
};