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
} from "../store/slices/projectCostSlice";

import PeriodSelector from "../components/projectCost/PeriodSelector";
import ProjectFinancialSummaryTable from "../components/projectCost/ProjectFinancialSummaryTable";
import EmployeeBreakdownPanel from "../components/projectCost/EmployeeBreakdownPanel";
import ExportModal from "../../components/common/ExportModal";
import RestrictedAccess from "../components/projectCost/RestrictedAccess";

// ────────────────────────────────────────────────────────────
// 🛑 STATIC DATA TOGGLE (Set to false when API is ready)
// ────────────────────────────────────────────────────────────
const USE_MOCK_DATA = true;

const MOCK_SUMMARY = {
  records: [
    { id: 1, name: "Burj Vista Tower", employees: 8, hours: 1240.5, cost: 185000.00, budget: 250000.00 },
    { id: 2, name: "Marina Mall Extension", employees: 12, hours: 2850.0, cost: 420000.00, budget: 400000.00 }, // Over budget
    { id: 3, name: "Al Reem Villas", employees: 4, hours: 420.0, cost: 65000.00, budget: null }, // No budget set
    { id: 4, name: "Downtown Office Fit-out", employees: 6, hours: 890.0, cost: 120000.00, budget: 150000.00 },
    { id: 5, name: "Yas Island Hotel", employees: 15, hours: 3100.0, cost: 580000.00, budget: 600000.00 },
  ],
  totals: { 
    employees: 45, 
    hours: 8500.5, 
    cost: 1370000.00, 
    budget: 1400000.00, 
    variance: 30000.00 
  }
};

const MOCK_BREAKDOWN = {
  employees: [
    { id: 101, name: "Ahmed Khan", role: "Project Manager", hours: 160, cost: 24000 },
    { id: 102, name: "Sarah Smith", role: "Lead Architect", hours: 145, cost: 21750 },
    { id: 103, name: "Ravi Patel", role: "Civil Engineer", hours: 120, cost: 14400 },
    { id: 104, name: "Maria Garcia", role: "BIM Modeler", hours: 180, cost: 16200 },
    { id: 105, name: "John Doe", role: "Site Supervisor", hours: 200, cost: 20000 },
  ],
  dailyHours: [
    { date: "2026-10-01", hours: 8 },
    { date: "2026-10-02", hours: 7.5 },
    { date: "2026-10-03", hours: 9 },
    { date: "2026-10-04", hours: 6 },
    { date: "2026-10-05", hours: 8.5 },
    { date: "2026-10-06", hours: 4 },
    { date: "2026-10-07", hours: 8 },
    { date: "2026-10-08", hours: 8 },
    { date: "2026-10-09", hours: 7 },
    { date: "2026-10-10", hours: 5.5 },
  ]
};

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
      return {
        start: toISODate(new Date(y, m, 1)),
        end: toISODate(new Date(y, m + 1, 0)),
      };
    case "last_month":
      return {
        start: toISODate(new Date(y, m - 1, 1)),
        end: toISODate(new Date(y, m, 0)),
      };
    case "this_quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return {
        start: toISODate(new Date(y, qStart, 1)),
        end: toISODate(new Date(y, qStart + 3, 0)),
      };
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

  const { summary, breakdown, exportLoading, error } = useSelector(
    (state) => state.projectCost
  );

  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Local state for Mock Data
  const [mockSummaryData, setMockSummaryData] = useState(MOCK_SUMMARY);
  const [mockBreakdownData, setMockBreakdownData] = useState({
    loading: false,
    employees: [],
    dailyHours: [],
  });

  const accessGranted = useMemo(() => isRestrictedUser(user), [user]);

  // Resolve active date range
  const resolveRange = useCallback(() => {
    return period === "custom"
      ? { start: customStart, end: customEnd }
      : getPresetRange(period);
  }, [period, customStart, customEnd]);

  // Fetch summary whenever period changes
  useEffect(() => {
    if (!accessGranted) return;
    
    if (USE_MOCK_DATA) {
      // Simulate network delay for UI feel
      setMockSummaryData((prev) => ({ ...prev, loading: true }));
      setTimeout(() => {
        setMockSummaryData(MOCK_SUMMARY);
      }, 500);
      return;
    }

    const { start, end } = resolveRange();
    dispatch(
      fetchProjectCostSummary({
        start_date: start || undefined,
        end_date: end || undefined,
        preset: period,
      })
    );
  }, [dispatch, resolveRange, period, accessGranted]);

  // Surface errors
  useEffect(() => {
    if (error && !USE_MOCK_DATA) {
      showToast(error, "error");
      dispatch(clearProjectCostError());
    }
  }, [error, dispatch]);

  // Open side panel + fetch employee breakdown
  const handleOpenBreakdown = useCallback(
    (project) => {
      setSelectedProject(project);
      
      if (USE_MOCK_DATA) {
        setMockBreakdownData((prev) => ({ ...prev, loading: true }));
        setTimeout(() => {
          setMockBreakdownData({
            loading: false,
            employees: MOCK_BREAKDOWN.employees,
            dailyHours: MOCK_BREAKDOWN.dailyHours,
          });
        }, 400);
        return;
      }

      const { start, end } = resolveRange();
      dispatch(
        fetchProjectCostBreakdown({
          projectId: project.id,
          start_date: start || undefined,
          end_date: end || undefined,
        })
      );
    },
    [dispatch, resolveRange]
  );

  // Export handler
  const handleExport = async (format) => {
    if (USE_MOCK_DATA) {
      showToast(`Mock Export triggered as ${format.toUpperCase()}`, "info");
      setTimeout(() => setIsExportOpen(false), 500);
      return;
    }

    const { start, end } = resolveRange();
    try {
      await dispatch(
        exportProjectCost({
          format,
          filters: {
            start_date: start || undefined,
            end_date: end || undefined,
            preset: period,
          },
        })
      ).unwrap();
      showToast(
        `Project cost report exported as ${format.toUpperCase()}`,
        "success"
      );
      setIsExportOpen(false);
    } catch (e) {
      showToast(e || "Export failed", "error");
    }
  };

  if (!accessGranted) {
    return <RestrictedAccess />;
  }

  // Determine data source
  const displaySummary = USE_MOCK_DATA ? mockSummaryData : summary;
  const displayBreakdown = USE_MOCK_DATA ? mockBreakdownData : breakdown;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            Project Cost
            {USE_MOCK_DATA && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase tracking-wider font-bold border border-amber-200">
                Mock Data Active
              </span>
            )}
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
        records={displaySummary.records}
        totals={displaySummary.totals}
        loading={displaySummary.loading}
        onSelectProject={handleOpenBreakdown}
        selectedProjectId={selectedProject?.id}
      />

      {/* Side panel */}
      {selectedProject && (
        <EmployeeBreakdownPanel
          project={selectedProject}
          data={displayBreakdown}
          period={period}
          onClose={() => {
            setSelectedProject(null);
            if (!USE_MOCK_DATA) dispatch(clearBreakdown());
          }}
        />
      )}

      {/* Export modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        title="Export Project Cost Report"
        subtitle="Download project cost summary with employee breakdown"
        totalRecords={displaySummary.records?.length || 0}
        formats={["excel", "pdf"]}
        defaultFormat="excel"
        loading={exportLoading || (USE_MOCK_DATA && false)}
      />
    </div>
  );
};

export default ProjectCost;