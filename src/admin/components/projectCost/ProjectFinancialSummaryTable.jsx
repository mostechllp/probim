// src/admin/components/projectCost/ProjectFinancialSummaryTable.jsx
import React from "react";

const fmtHours = (h) => {
  if (!h || h <= 0) return "0h";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const fmtAED = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return Number(n).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const ProjectFinancialSummaryTable = ({
  records = [],
  totals = {},
  loading,
  onSelectProject,
  selectedProjectId,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cost (AED)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget (AED)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Variance (AED)
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-spinner fa-spin mr-2 text-green-500"></i>
                    Loading financial summary...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-folder-open text-2xl mb-2 block opacity-50"></i>
                    No project cost data found for the selected period.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const hasBudget =
                    r.budget !== null &&
                    r.budget !== undefined &&
                    !isNaN(r.budget) &&
                    Number(r.budget) > 0;
                  
                  const variance = hasBudget ? r.budget - r.cost : null;
                  const isSelected = r.id === selectedProjectId;
                  const isOver = hasBudget && variance < 0;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectProject(r)} // Make whole row clickable
                      className={`border-b border-gray-200 dark:border-gray-700 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-green-50/50 dark:bg-green-900/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {r.name || "Unnamed Project"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                          <i className="fas fa-users text-[10px]"></i>
                          {r.employees || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        {fmtHours(r.hours)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        {fmtAED(r.cost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        {hasBudget ? (
                          fmtAED(r.budget)
                        ) : (
                          <span className="text-[11px] text-gray-400 italic bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            No budget set
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                          variance === null
                            ? "text-gray-400"
                            : isOver
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {variance === null ? "-" : fmtAED(variance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {/* Button kept for visual consistency, but row handles the click */}
                        <button
                          className={`text-xs font-bold flex items-center gap-1.5 mx-auto transition-colors px-3 py-1.5 rounded-lg ${
                            isSelected 
                              ? "bg-indigo-500 text-white" 
                              : "text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                          }`}
                        >
                          <i className="fas fa-users"></i>
                          {isSelected ? "Viewing" : "View Details"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {!loading && records.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 dark:bg-gray-700/60 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                    TOTAL SUMMARY
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-gray-800 dark:text-gray-100">
                    {totals.employees || 0}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {fmtHours(totals.hours)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {fmtAED(totals.cost)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {fmtAED(totals.budget)}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {fmtAED(totals.variance)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectFinancialSummaryTable;