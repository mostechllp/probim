// src/admin/components/projectCost/ProjectFinancialSummaryTable.jsx
import React from "react";

const ProjectFinancialSummaryTable = ({
  records = [],
  summary = {},
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
                  const isSelected = r.id === selectedProjectId;
                  
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectProject(r)}
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
                          {r.employees_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        {r.total_hours_formatted || "0h"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        {r.total_cost_formatted || "0.00"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        {r.budget !== null && r.budget !== undefined ? (
                          r.budget_formatted
                        ) : (
                          <span className="text-[11px] text-gray-400 italic bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            No budget set
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                          r.variance === null
                            ? "text-gray-400"
                            : r.is_over_budget
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {r.variance_formatted || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
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

            {!loading && records.length > 0 && summary && (
              <tfoot>
                <tr className="bg-gray-100 dark:bg-gray-700/60 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                    TOTAL SUMMARY
                  </td>
                  <td className="px-4 py-4 text-sm text-right text-gray-800 dark:text-gray-100">
                    {summary.total_employees || 0}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {summary.total_hours_formatted || "0h"}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {summary.total_cost_formatted || "0.00"}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-mono text-gray-800 dark:text-gray-100">
                    {summary.total_budget_formatted || "0.00"}
                  </td>
                  <td className={`px-4 py-4 text-sm text-right font-mono ${summary.is_over_budget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {summary.total_variance_formatted || "-"}
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