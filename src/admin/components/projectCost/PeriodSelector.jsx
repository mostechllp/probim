// src/admin/components/projects/PeriodSelector.jsx
import React from "react";
import DateInput from "../common/DateInput"; // Assuming you have this

const PRESETS = [
  { value: "this_month", label: "This Month", icon: "fas fa-calendar-day" },
  { value: "last_month", label: "Last Month", icon: "fas fa-calendar-minus" },
  { value: "this_quarter", label: "This Quarter", icon: "fas fa-calendar-alt" },
  { value: "project_to_date", label: "Project to Date", icon: "fas fa-infinity" },
  { value: "custom", label: "Custom Range", icon: "fas fa-calendar" },
];

const PeriodSelector = ({
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              period === p.value
                ? "bg-green-500 text-white shadow-md border border-green-500"
                : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            <i className={p.icon}></i>
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Start Date
            </label>
            <DateInput value={customStart} onChange={setCustomStart} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              End Date
            </label>
            <DateInput value={customEnd} onChange={setCustomEnd} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;