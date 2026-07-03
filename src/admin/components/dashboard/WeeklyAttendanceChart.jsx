import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS } from "../../pages/Dashboard";

export const WeeklyAttendanceChart = ({ data }) => {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No attendance data available
        </p>
      </div>
    );
  }

  const chartData = data.labels.map((label, i) => ({
    name: label,
    present: data.present?.[i] || 0,
    leave: data.leave?.[i] || 0,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <i className="fas fa-chart-line text-gray-500 dark:text-gray-400"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Weekly attendance trend
        </h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#898781" }}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Area
            type="monotone"
            dataKey="present"
            fill={`${COLORS.blue}18`}
            stroke={COLORS.blue}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.blue }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="leave"
            stroke={COLORS.yellow}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: COLORS.yellow }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};