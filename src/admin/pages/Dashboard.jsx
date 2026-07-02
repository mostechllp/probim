// src/admin/pages/Dashboard.js

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchEmployees } from "../store/slices/employeeSlice";
import { fetchProjects } from "../store/slices/projectSlice";
import {
  fetchDashboard,
  fetchMonthlyHoursByProject,
  fetchEmployeeDetails,
  clearMonthlyHours,
} from "../store/slices/dashboardSlice";
import { fetchAssignments } from "../store/slices/projectAssignmentSlice";
import { StatsCard } from "../components/dashboard/StatsCard";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Area,
  ComposedChart,
} from "recharts";
import { showToast } from "../../components/common/Toast";

// ─── COLOR PALETTE ──────────────────────────────────────────────────────
const COLORS = {
  blue: "#2a78d6",
  aqua: "#1baf7a",
  yellow: "#eda100",
  violet: "#4a3aa7",
  red: "#e34948",
  green: "#008300",
  orange: "#f97316",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

const STATUS_COLORS = {
  "On time": "#2a78d6",
  Late: "#eda100",
  Absent: "#e34948",
  WFH: "#1baf7a",
  Leave: "#4a3aa7",
};

const CHART_COLORS = [
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#e34948",
  "#4a3aa7",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────
const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusBadge = (status) => {
  const statusMap = {
    on_time: { label: "On time", className: "badge-success" },
    "on-time": { label: "On time", className: "badge-success" },
    ontime: { label: "On time", className: "badge-success" },
    late: { label: "Late", className: "badge-warn" },
    absent: { label: "Absent", className: "badge-danger" },
    wfh: { label: "WFH", className: "badge-blue" },
    leave: { label: "Leave", className: "badge-violet" },
  };
  return statusMap[status] || { label: status, className: "badge-gray" };
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────

// 1. Project Allocation Chart (Employees per project)
const ProjectAllocationChart = ({ data }) => {
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

// 2. Project Hours Chart (Horizontal bar) - Clickable with onBarClick
const ProjectHoursChart = ({ data, onBarClick }) => {
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

// 3. Weekly Attendance Trend
const WeeklyAttendanceChart = ({ data }) => {
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

// 4. Today's Status (Donut Chart)
const TodayStatusChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No status data available
        </p>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No status data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[220px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <i className="fas fa-chart-donut text-gray-500 dark:text-gray-400"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Today's status
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] || COLORS.blue}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value, name) => [`${value} employees`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5 text-xs">
          {chartData.map((item) => (
            <span
              key={item.name}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{
                  backgroundColor: STATUS_COLORS[item.name] || COLORS.blue,
                }}
              />
              {item.name} {item.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Avg Punch-in Time
const AvgPunchTimeCard = ({ data }) => {
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

// 6. Recent Punch-ins
const RecentPunchesList = ({ punches }) => {
  const safePunches = Array.isArray(punches) ? punches : [];

  if (safePunches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-[280px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No punch-in data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-login text-gray-500 dark:text-gray-400"></i>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Recent punch-ins
        </h3>
      </div>
      <div className="max-h-[210px] overflow-y-auto">
        {safePunches.slice(0, 8).map((punch, index) => {
          const status = punch.status || "unknown";
          const badge = getStatusBadge(status);
          const dotColor =
            {
              on_time: COLORS.aqua,
              "on-time": COLORS.aqua,
              ontime: COLORS.aqua,
              late: COLORS.yellow,
              absent: COLORS.red,
              wfh: COLORS.blue,
              leave: COLORS.violet,
            }[status] || COLORS.blue;

          return (
            <div
              key={index}
              className="flex items-center gap-2.5 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                {getInitials(punch.name)}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {punch.name || "Unknown"}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {punch.time || "—"}
              </span>
              <span className={`badge ${badge.className}`}>{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 7. Punch-in Distribution
const PunchDistributionChart = ({ data }) => {
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

  const getBarColor = (label) => {
    if (!label) return COLORS.blue;
    if (label.includes("8:")) return COLORS.aqua;
    if (label.includes("9:"))
      return label.includes("9:30") ? COLORS.yellow : COLORS.blue;
    return COLORS.red;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-chart-area text-gray-500 dark:text-gray-400"></i>
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
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {safeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.label)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── PROJECT HOURS DETAIL MODAL ────────────────────────────────────────
const ProjectHoursModal = ({
  isOpen,
  onClose,
  project,
  month,
  year,
  employees,
}) => {
  const dispatch = useDispatch();
  const { data: monthlyData, loading } = useSelector(
    (state) => state.dashboard.monthlyHours,
  );
  const employeeDetails = useSelector(
    (state) => state.dashboard.employeeDetails,
  );
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      dispatch(
        fetchMonthlyHoursByProject({
          projectId: project.id || project.projectId,
        }),
      );
    }
  }, [isOpen, project, dispatch]);

  const employeesData = monthlyData?.employees || [];

  const uniqueEmployees = employeesData.map((item) => ({
    id: item.user_id || item.id,
    name: item.name || `Employee #${item.user_id || item.id}`,
  }));

  const filteredData =
    employeeFilter === "all"
      ? employeesData
      : employeesData.filter(
          (item) =>
            String(item.user_id) === String(employeeFilter) ||
            String(item.id) === String(employeeFilter),
        );

  const totalHours = filteredData.reduce(
    (sum, item) => sum + (parseFloat(item.total_hours) || 0),
    0,
  );
  const totalEmployees = filteredData.length;

  const handleEmployeeClick = async (employeeId) => {
    try {
      const matchedEmployee = employees.find(
        (e) =>
          String(e.user_id) === String(employeeId) ||
          String(e.id) === String(employeeId),
      );

      const employeeRecordId = matchedEmployee?.id || employeeId;

      if (!employeeDetails[employeeRecordId]) {
        await dispatch(fetchEmployeeDetails(employeeRecordId)).unwrap();
      }
      setSelectedEmployee(employeeRecordId);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error("Failed to load employee details:", error);
      showToast("Failed to load employee details", "error");
    }
  };

  const periodInfo =
    monthlyData?.period ||
    (month && year
      ? `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1]} ${year}`
      : "Current Month");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              <i className="fas fa-project-diagram text-indigo-500 mr-2"></i>
              {project?.name || project?.fullName || "Project"} - Monthly Hours
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {periodInfo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : employeesData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <i className="fas fa-clock text-4xl mb-3 text-gray-300"></i>
              <p>No hours logged for this project this month</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {totalHours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total Hours
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {totalEmployees}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Employees
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredData.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Entries
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <i className="fas fa-filter text-indigo-500 mr-1"></i> Filter:
                </label>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Employees</option>
                  {uniqueEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredData.length} entries
                </span>
                {employeeFilter !== "all" && (
                  <button
                    onClick={() => setEmployeeFilter("all")}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-times mr-1"></i> Clear
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Employee
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Hours
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Projects
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, idx) => {
                      const hours = parseFloat(item.total_hours) || 0;
                      const projects = item.projects || [];
                      const projectNames = projects
                        .map((p) => p.project_name)
                        .join(", ");

                      return (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {item.name ||
                              `Employee #${item.user_id || item.id}`}
                          </td>
                          <td className="px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {item.total_formatted || `${hours}h`}
                          </td>
                          <td
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate"
                            title={projectNames}
                          >
                            {projectNames || "-"}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() =>
                                handleEmployeeClick(item.user_id || item.id)
                              }
                              className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1"
                            >
                              <i className="fas fa-user text-[10px]"></i> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <i className="fas fa-info-circle mr-1"></i>
            Click "View" to see employee details
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Employee Details Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowEmployeeModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                <i className="fas fa-user text-indigo-500 mr-2"></i>
                Employee Details
              </h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {(() => {
                const emp = employeeDetails[selectedEmployee];
                if (!emp) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
                      <p>Loading employee details...</p>
                    </div>
                  );
                }

                const name =
                  `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
                  emp.employee_id ||
                  `Employee #${emp.id}`;
                const user = emp.user || {};

                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.designation?.name || "No Designation"} •{" "}
                          {user.department?.name || "No Department"}
                        </p>
                        <p className="text-xs text-gray-400">
                          Employee ID: {emp.employee_id || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Email
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {emp.company_email || user.email || "N/A"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Phone
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {emp.company_mobile_number || "N/A"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Joining Date
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {formatDateDisplay(emp.joining_date)}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Status
                        </div>
                        <div className="text-sm font-medium">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                          >
                            {user.status || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  const { stats, charts, recentData, loading } = useSelector(
    (state) => state.dashboard,
  );
  const { projects, loading: projectsLoading } = useSelector(
    (state) => state.projects || { projects: [], loading: false },
  );
  const { assignments } = useSelector(
    (state) => state.projectAssignments || { assignments: [], loading: false },
  );

  const [showProjectHoursModal, setShowProjectHoursModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalMonth, setModalMonth] = useState(new Date().getMonth() + 1);
  const [modalYear, setModalYear] = useState(new Date().getFullYear());

  const userType = user?.type || "admin";
  const basePath = userType === "admin" ? "/admin" : "/employee";

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchProjects());
    dispatch(fetchAssignments());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const totalEmployees = employees?.length || 0;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const totalAssignments = assignments.length;
  const totalTaggedEmployees = assignments.reduce(
    (sum, a) => sum + (a.projectIds?.length || 0),
    0,
  );

  const todayStatus = charts?.today_status || {};
  const punchedInToday =
    Object.values(todayStatus).reduce((a, b) => a + b, 0) ||
    stats?.today?.punched_in ||
    0;
  const lateArrivals = todayStatus.Late || stats?.today?.late || 0;
  const absentToday = todayStatus.Absent || stats?.today?.absent || 0;

  const projectStats = charts?.project_stats || {};
  const totalProjects = projectStats.total_projects || projects.length;
  const activeProjectsCount = projectStats.active_projects || activeProjects;
  const totalAssignmentsCount =
    projectStats.total_assignments || totalAssignments;
  const employeesAssigned =
    projectStats.employees_assigned || totalTaggedEmployees;

  const allocationData = charts?.project_allocation || [];
  const hoursData = charts?.project_hours || [];

  const handleNavigate = (route) => {
    navigate(`${basePath}${route}`);
  };

  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const projectData = data.activePayload[0].payload;
      const projectName =
        projectData.fullName || projectData.name || projectData.displayName;
      const matchedProject = projects.find((p) => p.name === projectName);
      const projectId =
        matchedProject?.id || projectData.id || projectData.projectId;

      if (projectId) {
        setSelectedProject({
          id: projectId,
          name: projectName,
          projectId: projectId,
        });
        setModalMonth(new Date().getMonth() + 1);
        setModalYear(new Date().getFullYear());
        setShowProjectHoursModal(true);
      } else {
        showToast("Project ID not found", "error");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <WelcomeBanner
        stats={{ totalEmployees, punchedInToday, absentToday }}
        user={user}
      />

      {/* ─── ROW 1: Overview (8 cards in a single row) ────────────────────── */}
      <div className="section-label text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-4 mb-2">
        Overview
      </div>
      <div className="stats-grid grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4 mb-6">
        <StatsCard
          title="Total Employees"
          value={totalEmployees}
          icon="fas fa-users"
          color="green"
          route="/employees"
          onClick={() => handleNavigate("/employees")}
        />
        <StatsCard
          title="Punched In Today"
          value={punchedInToday}
          icon="fas fa-fingerprint"
          color="blue"
          route="/attendances"
          onClick={() => handleNavigate("/attendances")}
        />
        <StatsCard
          title="Late Arrivals"
          value={lateArrivals}
          icon="fas fa-clock"
          color="amber"
          route="/attendances"
          onClick={() => handleNavigate("/attendances")}
        />
        <StatsCard
          title="Absent Today"
          value={absentToday}
          icon="fas fa-user-slash"
          color="red"
          route="/attendances"
          onClick={() => handleNavigate("/attendances")}
        />
        <StatsCard
          title="Total Projects"
          value={totalProjects}
          icon="fas fa-project-diagram"
          color="purple"
          route="/projects"
          onClick={() => handleNavigate("/projects")}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjectsCount}
          icon="fas fa-play-circle"
          color="green"
          route="/projects"
          onClick={() => handleNavigate("/projects")}
        />
        <StatsCard
          title="Total Assignments"
          value={totalAssignmentsCount}
          icon="fas fa-link"
          color="orange"
          route="/project-assignments"
          onClick={() => handleNavigate("/project-assignments")}
        />
        <StatsCard
          title="Employees Assigned"
          value={employeesAssigned}
          icon="fas fa-user-check"
          color="blue"
          route="/project-assignments"
          onClick={() => handleNavigate("/project-assignments")}
        />
      </div>

      {/* ─── ROW 3: Project Allocation & Hours ────────────────────────── */}
      <div className="section-label text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-4 mb-2">
        Project Allocation & Hours
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ProjectAllocationChart data={allocationData} />
        <ProjectHoursChart data={hoursData} onBarClick={handleBarClick} />
      </div>

      {/* ─── ROW 4: Attendance Analytics (3 equal height cards) ────────── */}
      <div className="section-label text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-4 mb-2">
        Attendance Analytics
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="h-[220px]">
          <WeeklyAttendanceChart data={charts?.weekly_attendance} />
        </div>
        <div className="h-[220px]">
          <TodayStatusChart data={charts?.today_status} />
        </div>
        <div className="h-[220px]">
          <AvgPunchTimeCard data={charts?.avg_punch_time} />
        </div>
      </div>

      {/* ─── ROW 5: Today's Punch-in Activity ──────────────────────────── */}
      <div className="section-label text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-4 mb-2">
        Today's Punch-in Activity
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RecentPunchesList punches={charts?.recent_punches || []} />
        <PunchDistributionChart data={charts?.punch_distribution || []} />
      </div>

      {/* ─── PROJECT HOURS DETAIL MODAL ───────────────────────────────── */}
      <ProjectHoursModal
        isOpen={showProjectHoursModal}
        onClose={() => {
          setShowProjectHoursModal(false);
          setSelectedProject(null);
          dispatch(clearMonthlyHours());
        }}
        project={selectedProject}
        month={modalMonth}
        year={modalYear}
        employees={employees}
      />
    </div>
  );
};

export default Dashboard;
