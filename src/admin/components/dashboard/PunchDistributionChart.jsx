import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Blue shades palette
const BLUE_SHADES = [
  "#1a56db", // Darkest - highest value
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd", // Lightest - lowest value
];

export const PunchDistributionChart = ({ data }) => {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[280px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No punch distribution data available
        </p>
      </div>
    );
  }

  // Get blue shade based on value (higher value = darker)
  const getBlueShade = (value) => {
    if (!value || value === 0) return BLUE_SHADES[4];
    
    const maxValue = Math.max(...safeData.map(d => d.value));
    if (maxValue === 0) return BLUE_SHADES[2];
    
    const ratio = value / maxValue;
    const index = Math.floor((1 - ratio) * (BLUE_SHADES.length - 1));
    return BLUE_SHADES[Math.min(index, BLUE_SHADES.length - 1)];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-chart-area text-blue-500"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Punch-in distribution (by hour)
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart
          data={safeData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
            grid={{ stroke: "#e1e0d9", strokeWidth: 0.5 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value) => [`${value} employees`, ""]}
            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {safeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBlueShade(entry.value)}
                style={{
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const element = e.target;
                  element.style.opacity = "0.8";
                  element.style.transform = "scaleY(1.05)";
                }}
                onMouseLeave={(e) => {
                  const element = e.target;
                  element.style.opacity = "1";
                  element.style.transform = "scaleY(1)";
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};