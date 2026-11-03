// src/admin/pages/projects/ProjectCost.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";

import {
  fetchProjectCostSummary,
  exportProjectCost,
  clearProjectCostError,
} from "../store/slices/projectCostSlice";

import PeriodSelector from "../components/projectCost/PeriodSelector";
import ProjectFinancialSummaryTable from "../components/projectCost/ProjectFinancialSummaryTable";
import EmployeeBreakdownPanel from "../components/projectCost/EmployeeBreakdownPanel";
import ExportModal from "../../components/common/ExportModal";
import RestrictedAccess from "../components/projectCost/RestrictedAccess";

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
// Access control
// ────────────────────────────────────────────────────────────
const isRestrictedUser = (user) => {
  if (!user) return false;
  const type = (user?.type || "").toLowerCase();
  const role = (user?.role?.name || user?.role || "").toLowerCase();
  const allPerms = user?.permissions?.all === true;

  return (
    allPerms ||
    type === "super_admin" ||
    type === "superadmin" ||
    type === "admin" ||
    role.includes("super admin") ||
    role.includes("management") ||
    role.includes("director")
  );
};

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
const ProjectCost = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const { summary, exportLoading, error } = useSelector(
    (state) => state.projectCost
  );

  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Holds the project object clicked from the table (which includes employees and daily_hours)
  const [selectedProject, setSelectedProject] = useState(null);

  const accessGranted = useMemo(() => isRestrictedUser(user), [user]);

  const resolveRange = useCallback(() => {
    return period === "custom"
      ? { start: customStart, end: customEnd }
      : getPresetRange(period);
  }, [period, customStart, customEnd]);

  // Fetch summary
  useEffect(() => {
    if (!accessGranted) return;
    const { start, end } = resolveRange();
    
    dispatch(
      fetchProjectCostSummary({
        filter: period,
        start_date: start || undefined,
        end_date: end || undefined,
      })
    );
  }, [dispatch, resolveRange, period, accessGranted]);

  // Surface errors
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearProjectCostError());
    }
  }, [error, dispatch]);

  // Open side panel directly using the data from the selected project row
  const handleOpenBreakdown = useCallback((project) => {
    setSelectedProject(project);
  }, []);

  // Export handler
  const handleExport = async (format) => {
    const { start, end } = resolveRange();
    try {
      await dispatch(
        exportProjectCost({
          format,
          filters: {
            filter: period,
            start_date: start || undefined,
            end_date: end || undefined,
          },
        })
      ).unwrap();
      showToast(`Project cost report exported as ${format.toUpperCase()}`, "success");
      setIsExportOpen(false);
    } catch (e) {
      showToast(e || "Export failed", "error");
    }
  };

  if (!accessGranted) {
    return <RestrictedAccess />;
  }

  // Safely extract data from the API response structure
  const apiData = summary.data || {};
  const projects = apiData.projects || [];
  const totals = apiData.summary || {};
  const periodLabel = apiData.period?.label || period;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            Project Cost
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Project-wise employees, hours, cost, budget and variance in AED.
          </p>
        </div>
        <button
          onClick={() => setIsExportOpen(true)}
          disabled={exportLoading}
          className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg disabled:opacity-50 self-start md:self-auto"
        >
          <i className="fas fa-file-export"></i>
          Export Report
        </button>
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

      {/* Summary table */}
      <ProjectFinancialSummaryTable
        records={projects}
        summary={totals}
        loading={summary.loading}
        onSelectProject={handleOpenBreakdown}
        selectedProjectId={selectedProject?.id}
      />

      {/* Side panel */}
      {selectedProject && (
        <EmployeeBreakdownPanel
          project={selectedProject}
          data={{
            employees: selectedProject.employees || [],
            dailyHours: selectedProject.daily_hours || [],
            loading: false, // No longer loading from API
          }}
          period={periodLabel}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Export modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export Project Cost Report"
        subtitle="Download project cost summary with employee breakdown"
        totalRecords={projects?.length || 0}
        formats={["excel", "pdf"]}
        defaultFormat="excel"
        loading={exportLoading}
      />
    </div>
  );
};

export default ProjectCost;