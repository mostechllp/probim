// src/admin/pages/projects/ProjectCost.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";

import {
  fetchProjectCostSummary,
  fetchProjectCostBreakdown,
  exportProjectCost,
  clearProjectCostError,
  clearBreakdown,
  setActiveProjectMeta,
} from "../store/slices/projectCostSlice"; // Adjust path if needed

import PeriodSelector from "../components/projectCost/PeriodSelector";
import ProjectFinancialSummaryTable from "../components/projectCost/ProjectFinancialSummaryTable";
import EmployeeBreakdownPanel from "../components/projectCost/EmployeeBreakdownPanel";
import ExportModal from "../../components/common/ExportModal";
import RestrictedAccess from "../components/projectCost/RestrictedAccess";

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

const ProjectCost = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const { summary, breakdown, exportLoading, error } = useSelector(
    (state) => state.projectCost
  );

  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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

  // ── HANDLER FOR CLICKING A PROJECT ROW ──
  const handleOpenBreakdown = useCallback(
    (project) => {
      // 1. Set UI state
      setSelectedProjectId(project.id);
      setIsPanelOpen(true);
      
      // 2. Set the header name immediately
      dispatch(setActiveProjectMeta({ id: project.id, name: project.name }));

      // 3. Resolve date range
      const { start, end } = resolveRange();
      
      // 4. Trigger the API call to /api/admin/projects/cost/{id}
      dispatch(
        fetchProjectCostBreakdown({
          projectId: project.id,
          filter: period,
          start_date: start || undefined,
          end_date: end || undefined,
        })
      );
    },
    [dispatch, resolveRange, period]
  );

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedProjectId(null);
    dispatch(clearBreakdown());
  };

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

      {/* Summary table - Make sure this passes the click up */}
      <ProjectFinancialSummaryTable
        records={projects}
        summary={totals}
        loading={summary.loading}
        onSelectProject={handleOpenBreakdown} 
        selectedProjectId={selectedProjectId}
      />

      {/* Side panel */}
      {isPanelOpen && (
        <EmployeeBreakdownPanel
          project={{ name: breakdown.projectName }} 
          data={{
            employees: breakdown.employees,
            dailyHours: breakdown.dailyHours,
            loading: breakdown.loading, 
          }}
          period={periodLabel}
          onClose={handleClosePanel}
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