// src/admin/components/projectCost/EmployeeBreakdownPanel.jsx
import React from "react";
import { createPortal } from "react-dom";

const fmtHours = (h) => {
  if (!h || h <= 0) return "0h";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const fmtAED = (n) =>
  n === null || n === undefined
    ? "-"
    : Number(n).toLocaleString("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

const EmployeeBreakdownPanel = ({ project, data, period, onClose }) => {
  const employees = data?.employees || [];
  const dailyHours = data?.dailyHours || [];
  const isLoading = data?.loading;

  // Find max daily hours for progress bar scaling
  const maxDailyHours = Math.max(...dailyHours.map((d) => d.hours || 0), 1);

  // Prevent background scrolling when panel is open
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Use React Portal to append directly to the <body> so it escapes any parent wrappers
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-out Panel - half screen width on desktop */}
      <div className="fixed top-0 bottom-0 right-0 w-full md:w-1/2 h-screen bg-white dark:bg-gray-800 shadow-2xl z-[1000] flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate pr-4">
              {project?.name || "Project Details"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              Period: {period.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors flex-shrink-0"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl text-green-500 mb-3"></i>
              <p className="text-sm">Loading breakdown...</p>
            </div>
          ) : (
            <>
              {/* Employee Stats List */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  <i className="fas fa-users mr-2"></i> Employee Breakdown
                </h4>
                <div className="space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      No employees recorded for this period.
                    </p>
                  ) : (
                    employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {emp.name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {emp.role || "Employee"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                            {fmtHours(emp.hours)}
                          </p>
                          <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                            AED {fmtAED(emp.cost)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Daily Hours Bar Chart */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  <i className="fas fa-chart-bar mr-2"></i> Daily Hours
                </h4>
                {dailyHours.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    No daily logs available.
                  </p>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-end gap-1.5 h-32 w-full">
                      {dailyHours.map((day, idx) => {
                        const heightPct = (day.hours / maxDailyHours) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative">
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none transition-opacity z-10">
                              {day.date}: {fmtHours(day.hours)}
                            </div>
                            {/* Bar */}
                            <div
                              className="w-full bg-indigo-500 hover:bg-indigo-400 rounded-t-sm transition-all"
                              style={{ height: `${Math.max(heightPct, 4)}%` }}
                            ></div>
                            {/* X Axis Label */}
                            <span className="text-[9px] text-gray-400 mt-2 rotate-45 origin-left">
                              {day.date.split("-")[2]} {/* Just the day number */}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default EmployeeBreakdownPanel;