import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { COLORS } from "../../pages/Dashboard";

export const AvgPunchTimeCard = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No punch time data available
        </p>
      </div>
    );
  }

  const dailyData = Array.isArray(data.daily) ? data.daily : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <i className="fas fa-clock-hour-4 text-gray-500 dark:text-gray-400"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Avg punch-in time
        </h3>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            This week avg
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {data.thisWeekAvg || "09:14"}
          </div>
          <div className="text-xs text-green-500 mt-1">
            {data.trend || "No trend data"}
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Daily avg this week
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart
              data={dailyData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS.blue}
                strokeWidth={1.5}
                dot={{ r: 2, fill: COLORS.blue }}
              />
              <Tooltip
                formatter={(value) => {
                  if (typeof value !== "number") return value;
                  const h = Math.floor(value);
                  const m = Math.round((value - h) * 60)
                    .toString()
                    .padStart(2, "0");
                  return `${h}:${m}`;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};