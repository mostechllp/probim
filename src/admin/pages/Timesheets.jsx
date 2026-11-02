// src/admin/pages/projects/Timesheets.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";

import {
  fetchTimesheets,
  updateTimesheetStatus,
  exportTimesheets,
  clearTimesheetError,
} from "../store/slices/timesheetSlice";

import PeriodSelector from "../components/projectCost/PeriodSelector";
import ExportModal from "../../components/common/ExportModal";

// ────────────────────────────────────────────────────────────
// 🛑 STATIC DATA TOGGLE (Set to false when API is ready)
// ────────────────────────────────────────────────────────────
const USE_MOCK_DATA = true;

const MOCK_RECORDS = [
  { id: 1, employeeName: "Ahmed Khan", projectName: "Burj Vista Tower", date: "2026-10-24", hours: 8.5, status: "Pending", manager: "Sarah Smith" },
  { id: 2, employeeName: "Ravi Patel", projectName: "Marina Mall Extension", date: "2026-10-24", hours: 9.0, status: "Pending", manager: "Sarah Smith" },
  { id: 3, employeeName: "Maria Garcia", projectName: "Burj Vista Tower", date: "2026-10-23", hours: 7.5, status: "Approved", manager: "Sarah Smith" },
  { id: 4, employeeName: "John Doe", projectName: "Al Reem Villas", date: "2026-10-23", hours: 8.0, status: "Approved", manager: "Ahmed Khan" },
  { id: 5, employeeName: "Ahmed Khan", projectName: "Burj Vista Tower", date: "2026-10-23", hours: 8.0, status: "Approved", manager: "Sarah Smith" },
  { id: 6, employeeName: "Lisa Wong", projectName: "Yas Island Hotel", date: "2026-10-22", hours: 10.0, status: "Rejected", manager: "John Doe" },
];

const MOCK_STATS = { totalHours: 51.0, pendingApprovals: 2, approvedHours: 31.5 };

// ────────────────────────────────────────────────────────────
// Date helpers
// ────────────────────────────────────────────────────────────
const toISODate = (d) => d.toISOString().split("T")[0];

const getPresetRange = (preset) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "this_month":
      return { start: toISODate(new Date(y, m, 1)), end: toISODate(new Date(y, m + 1, 0)) };
    case "last_month":
      return { start: toISODate(new Date(y, m - 1, 1)), end: toISODate(new Date(y, m, 0)) };
    case "this_quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { start: toISODate(new Date(y, qStart, 1)), end: toISODate(new Date(y, qStart + 3, 0)) };
    }
    case "project_to_date":
    default:
      return { start: null, end: null };
  }
};

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

const Timesheets = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const { records, stats, loading, actionLoading, exportLoading, error } = useSelector(
    (state) => state.timesheets
  );

  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Local state for Mock Data
  const [mockData, setMockData] = useState({ records: [], stats: {}, loading: true });

  const resolveRange = useCallback(() => {
    return period === "custom"
      ? { start: customStart, end: customEnd }
      : getPresetRange(period);
  }, [period, customStart, customEnd]);

  // Fetch data
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setMockData((prev) => ({ ...prev, loading: true }));
      setTimeout(() => {
        setMockData({ records: MOCK_RECORDS, stats: MOCK_STATS, loading: false });
      }, 500);
      return;
    }

    const { start, end } = resolveRange();
    dispatch(fetchTimesheets({ start_date: start, end_date: end, preset: period }));
  }, [dispatch, resolveRange, period]);

  // Surface errors
  useEffect(() => {
    if (error && !USE_MOCK_DATA) {
      showToast(error, "error");
      dispatch(clearTimesheetError());
    }
  }, [error, dispatch]);

  const handleUpdateStatus = async (id, status) => {
    if (USE_MOCK_DATA) {
      setMockData((prev) => ({
        ...prev,
        records: prev.records.map((r) => (r.id === id ? { ...r, status } : r)),
      }));
      showToast(`Timesheet ${status.toLowerCase()} (Mock)`, "success");
      return;
    }

    try {
      await dispatch(updateTimesheetStatus({ id, status })).unwrap();
      showToast(`Timesheet ${status.toLowerCase()} successfully`, "success");
    } catch (e) {
      showToast(e || "Failed to update status", "error");
    }
  };

  const handleExport = async (format) => {
    if (USE_MOCK_DATA) {
      showToast(`Mock Export triggered as ${format.toUpperCase()}`, "info");
      setTimeout(() => setIsExportOpen(false), 500);
      return;
    }

    const { start, end } = resolveRange();
    try {
      await dispatch(exportTimesheets({ format, filters: { start_date: start, end_date: end } })).unwrap();
      showToast(`Timesheets exported as ${format.toUpperCase()}`, "success");
      setIsExportOpen(false);
    } catch (e) {
      showToast(e || "Export failed", "error");
    }
  };

  // Determine data source
  const displayRecords = USE_MOCK_DATA ? mockData.records : records;
  const displayStats = USE_MOCK_DATA ? mockData.stats : stats;
  const isLoading = USE_MOCK_DATA ? mockData.loading : loading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            Timesheets & Hours
            {USE_MOCK_DATA && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase tracking-wider font-bold border border-amber-200">
                Mock Data Active
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage and approve employee hours logged against projects.
          </p>
        </div>
        <button
          onClick={() => setIsExportOpen(true)}
          disabled={exportLoading}
          className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg disabled:opacity-50 self-start md:self-auto"
        >
          <i className="fas fa-file-export"></i>
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <i className="fas fa-clock text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Logged Hours</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{displayStats.totalHours}h</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <i className="fas fa-hourglass-half text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{displayStats.pendingApprovals}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Approved Hours</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{displayStats.approvedHours}h</p>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <PeriodSelector
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                      <i className="fas fa-spinner fa-spin mr-2 text-green-500"></i> Loading timesheets...
                    </td>
                  </tr>
                ) : displayRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                      No timesheet records found for this period.
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((r) => (
                    <tr key={r.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.employeeName}</p>
                        <p className="text-[11px] text-gray-500">Mgr: {r.manager}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{r.projectName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{r.date}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-gray-800 dark:text-gray-200">{r.hours}h</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          r.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(r.id, "Approved")}
                              disabled={actionLoading}
                              className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center transition-colors"
                              title="Approve"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, "Rejected")}
                              disabled={actionLoading}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center transition-colors"
                              title="Reject"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No actions needed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export Timesheets"
        subtitle="Download timesheet records for the selected period"
        totalRecords={displayRecords.length}
        formats={["excel", "pdf", "csv"]}
        defaultFormat="excel"
        loading={exportLoading}
      />
    </div>
  );
};

export default Timesheets;