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

  // Prevent background scrolling when panel is open
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Create a map for quick lookup of daily hours by date
  const dailyDataMap = React.useMemo(() => {
    const map = {};
    dailyHours.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [dailyHours]);

  // Find max daily hours to determine highest color intensity
  const maxDailyHours = Math.max(...dailyHours.map((d) => d.hours || 0), 1);

  // Get days in the current month based on the first day of dailyHours
  const getCalendarDays = () => {
    if (dailyHours.length === 0) return { days: [], firstDayOfWeek: 0 };
    
    const firstDateStr = dailyHours[0].date; // e.g., "2026-11-01"
    const [year, month] = firstDateStr.split("-");
    
    const date = new Date(year, parseInt(month) - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday...

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, "0");
      const currentDateStr = `${year}-${month}-${dayStr}`;
      days.push({
        dayNum: i,
        dateStr: currentDateStr,
        data: dailyDataMap[currentDateStr] || { hours: 0, cost: 0, formatted_hours: "0h" },
      });
    }

    return { days, firstDayOfWeek };
  };

  const { days, firstDayOfWeek } = getCalendarDays();

  // Determine background color based on hours worked
  const getDayBgColor = (hours) => {
    if (hours === 0) return "bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500";
    
    const intensity = hours / maxDailyHours;
    if (intensity > 0.8) return "bg-green-500 text-white shadow-sm hover:bg-green-600";
    if (intensity > 0.5) return "bg-green-400 text-white shadow-sm hover:bg-green-500";
    if (intensity > 0.2) return "bg-green-300 text-green-900 shadow-sm hover:bg-green-400";
    return "bg-green-100 text-green-800 shadow-sm hover:bg-green-200";
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[890] transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-out Panel */}
      <div className="fixed top-0 bottom-0 right-0 w-full md:w-1/2 h-screen bg-white dark:bg-gray-800 shadow-2xl z-[900] flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate pr-4 flex items-center gap-3">
              {project?.name || "Project Details"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              Period: {period.replace(/_/g, " ")}
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
                    employees.map((emp, idx) => (
                      <div
                        key={emp.user_id || emp.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          {emp.avatar ? (
                            <img 
                              src={emp.avatar} 
                              alt={emp.name} 
                              className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-200" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                              {emp.name ? emp.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {emp.name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {emp.designation || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
                            {emp.total_hours_formatted || fmtHours(emp.total_hours)}
                          </p>
                          <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                            AED {fmtAED(emp.total_cost)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Daily Hours Calendar View */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span><i className="fas fa-calendar-alt mr-2"></i> Daily Activity</span>
                  <span className="text-[10px] text-gray-400 normal-case font-normal">Hover for details</span>
                </h4>
                
                {dailyHours.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    No daily logs available.
                  </p>
                ) : (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm">
                    
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {weekDays.map((day) => (
                        <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Empty cells for days before the 1st */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                      ))}
                      
                      {/* Actual days */}
                      {days.map((day) => {
                        const hasHours = day.data.hours > 0;
                        const bgClass = getDayBgColor(day.data.hours);

                        return (
                          <div 
                            key={day.dateStr}
                            className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-semibold transition-all group cursor-default ${bgClass}`}
                          >
                            <span className={hasHours ? "opacity-80 text-[10px]" : "opacity-50 text-[10px]"}>
                              {day.dayNum}
                            </span>
                            {hasHours && (
                              <span className="text-xs font-bold">{fmtHours(day.data.hours)}</span>
                            )}

                            {/* Hover Tooltip for Calendar Day */}
                            {hasHours && (
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-lg whitespace-nowrap pointer-events-none transition-opacity z-10 shadow-xl flex flex-col items-center gap-0.5">
                                <span className="font-bold border-b border-gray-700 pb-0.5 mb-0.5 w-full text-center">
                                  {day.dateStr}
                                </span>
                                <span>{day.data.formatted_hours || fmtHours(day.data.hours)} Logged</span>
                                <span className="text-green-400">AED {fmtAED(day.data.cost)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-gray-500 font-medium">
                      <span>Less</span>
                      <div className="w-3 h-3 rounded-sm bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-100"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                      <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                      <span>More</span>
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