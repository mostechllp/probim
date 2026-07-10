import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import EntriesSelector from "../common/EntriesSelector";
import { showToast } from "../../../components/common/Toast";
import Pagination from "../common/Paginations";
import {
  exportReport,
  fetchAllAttendanceReport,
  fetchAttendanceReport,
  fetchEmployeesForFilter,
} from "../../store/slices/reportSlice";
import ExportModal from "../../../components/common/ExportModal";
import DateInput from "../common/DateInput";

const AttendanceReport = () => {
  const dispatch = useDispatch();
  const {
    attendanceRecords: records = [],
    attendanceLoading: loading = false,
    attendanceTotalCount: totalCount = 0,
    attendanceLastPage: lastPage = 1,
    exportLoading = false,
    employeesList = [],
  } = useSelector((state) => state.reports || {});

  // Local state for filters (these will be applied when "Apply" is clicked)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter values that are displayed in the UI
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("custom");

  // Actual filter values that are sent to the API (only updated on Apply)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [appliedEmployeeFilter, setAppliedEmployeeFilter] = useState("all");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("all");

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Applied date range (only updated on Apply)
  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);

  // Fetch employees for filter dropdown
  useEffect(() => {
    dispatch(fetchEmployeesForFilter());
  }, [dispatch]);

  // Fetch attendance data with applied filters
  useEffect(() => {
    const fetchData = async () => {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: appliedSearchTerm || undefined,
        start_date: appliedStartDate,
        end_date: appliedEndDate,
      };

      // Add employee filter only if not "all"
      if (appliedEmployeeFilter !== "all" && appliedEmployeeFilter) {
        const empId = parseInt(appliedEmployeeFilter);
        params.employee_id = isNaN(empId) ? appliedEmployeeFilter : empId;
      }

      console.log("Fetch attendance with applied params:", params);

      await dispatch(fetchAttendanceReport(params));
    };
    fetchData();
  }, [
    dispatch,
    currentPage,
    perPage,
    appliedEmployeeFilter,
    appliedSearchTerm,
    appliedStartDate,
    appliedEndDate,
  ]);

  // Reset to first page when applied filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    appliedEmployeeFilter,
    appliedSearchTerm,
    perPage,
    appliedStartDate,
    appliedEndDate,
  ]);

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // Clear records when employee filter changes (before applying)
    // This prevents showing old data while fetching new data
    if (employeeFilter !== appliedEmployeeFilter) {
      // Optionally clear records here to prevent showing old data
      // But we want to keep the loading state clean
    }
  }, [employeeFilter, appliedEmployeeFilter]);

  // Update the fetch attendance useEffect to handle loading state better
  useEffect(() => {
    const fetchData = async () => {
      // Clear records before fetching new data
      // This prevents showing old data while loading
      if (
        appliedEmployeeFilter !== "all" ||
        appliedSearchTerm ||
        appliedStartDate !== startDate
      ) {
        // The loading state will show while fetching
      }

      const params = {
        page: currentPage,
        per_page: perPage,
        search: appliedSearchTerm || undefined,
        start_date: appliedStartDate,
        end_date: appliedEndDate,
      };

      // Add employee filter only if not "all"
      if (appliedEmployeeFilter !== "all" && appliedEmployeeFilter) {
        const empId = parseInt(appliedEmployeeFilter);
        params.employee_id = isNaN(empId) ? appliedEmployeeFilter : empId;
      }

      console.log("Fetch attendance with applied params:", params);

      await dispatch(fetchAttendanceReport(params));
    };
    fetchData();
  }, [
    dispatch,
    currentPage,
    perPage,
    appliedEmployeeFilter,
    appliedSearchTerm,
    appliedStartDate,
    appliedEndDate,
  ]);

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);

    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case "today":
        start = today;
        end = today;
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        start = yesterday;
        end = yesterday;
        break;
      case "this_week":
        const weekStart = new Date(today);
        const day = today.getDay() || 7;
        weekStart.setDate(today.getDate() - day + 1);
        start = weekStart;
        end = today;
        break;
      case "this_month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = monthStart;
        end = today;
        break;
      case "custom":
      default:
        return;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const hasOvertimeValue = (overtime) => {
    if (!overtime || overtime === "-" || overtime === "0" || overtime === 0)
      return false;
    if (typeof overtime === "string" && overtime.trim() !== "") return true;
    if (typeof overtime === "number" && overtime > 0) return true;
    return false;
  };

  const handleApplyFilters = () => {
    // Apply the filters by updating the applied state
    setAppliedEmployeeFilter(employeeFilter);
    setAppliedSearchTerm(searchTerm);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setCurrentPage(1);

    // Force a re-fetch by dispatching with a timestamp
    // This ensures the API call is made with fresh parameters
    const params = {
      page: 1,
      per_page: perPage,
      search: searchTerm || undefined,
      start_date: startDate,
      end_date: endDate,
    };

    if (employeeFilter !== "all" && employeeFilter) {
      const empId = parseInt(employeeFilter);
      params.employee_id = isNaN(empId) ? employeeFilter : empId;
    }

    // Directly dispatch with the new params
    dispatch(fetchAttendanceReport(params));

    showToast("Filters applied successfully", "success");
  };
  const handleResetFilters = () => {
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const newStartDate = firstDayOfMonth.toISOString().split("T")[0];
  const newEndDate = new Date().toISOString().split("T")[0];

  setStartDate(newStartDate);
  setEndDate(newEndDate);
  setEmployeeFilter("all");
  setSearchTerm("");
  setDatePreset("custom");
  setCurrentPage(1);

  // Reset the applied filters
  setAppliedEmployeeFilter("all");
  setAppliedSearchTerm("");
  setAppliedStartDate(newStartDate);
  setAppliedEndDate(newEndDate);

  // Force a re-fetch with reset params
  const params = {
    page: 1,
    per_page: perPage,
    search: undefined,
    start_date: newStartDate,
    end_date: newEndDate,
  };

  // Don't include employee_id when reset
  dispatch(fetchAttendanceReport(params));

  showToast("Filters reset successfully", "success");
};

  const handleExport = async (format) => {
    showToast(`Preparing ${format.toUpperCase()} export...`, "success");

    try {
      const filters = {
        start_date: appliedStartDate,
        end_date: appliedEndDate,
      };

      if (appliedEmployeeFilter !== "all" && appliedEmployeeFilter) {
        filters.employee_id =
          parseInt(appliedEmployeeFilter) || appliedEmployeeFilter;
      }

      if (appliedSearchTerm) {
        filters.search = appliedSearchTerm;
      }

      if (exportType === "all") {
        filters.export_all = true;
      }

      console.log("Export filters:", filters);

      const result = await dispatch(
        exportReport({
          reportType: "attendance",
          format: format,
          filters: filters,
        }),
      ).unwrap();

      if (result.success) {
        showToast(
          `${format.toUpperCase()} report exported successfully!`,
          "success",
        );
        setShowExportModal(false);
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast(
        typeof error === "string" ? error : "Failed to export report",
        "error",
      );
    }
  };

  const formatTime = (time) => {
    if (!time) return "-";
    return time;
  };

  const formatWorkedHours = (hours) => {
    if (!hours || hours === 0 || hours === "0") return "-";
    const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
    if (isNaN(numHours) || numHours === 0) return "-";
    const h = Math.floor(numHours);
    const m = Math.round((numHours - h) * 60);
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${h} hr${h > 1 ? "s" : ""} ${m} min${m > 1 ? "s" : ""}`;
  };

  const getStatusBadge = (status, overtime = 0) => {
    const statusLower = String(status || "").toLowerCase();
    const hasOvertime = overtime > 0;

    const statusConfigs = {
      present: {
        bg: hasOvertime
          ? "bg-emerald-100 dark:bg-emerald-900/30"
          : "bg-green-100 dark:bg-green-900/30",
        text: hasOvertime
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-green-700 dark:text-green-400",
        icon: hasOvertime ? "fa-star" : "fa-check-circle",
        label: hasOvertime ? "Present + OT" : "Present",
      },
      absent: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: "fa-user-slash",
        label: "Absent",
      },
      late: {
        bg: hasOvertime
          ? "bg-amber-100 dark:bg-amber-900/30"
          : "bg-yellow-100 dark:bg-yellow-900/30",
        text: hasOvertime
          ? "text-amber-700 dark:text-amber-400"
          : "text-yellow-700 dark:text-yellow-400",
        icon: hasOvertime ? "fa-star" : "fa-clock",
        label: hasOvertime ? "Late + OT" : "Late",
      },
      "half day": {
        bg: hasOvertime
          ? "bg-indigo-100 dark:bg-indigo-900/30"
          : "bg-blue-100 dark:bg-blue-900/30",
        text: hasOvertime
          ? "text-indigo-700 dark:text-indigo-400"
          : "text-blue-700 dark:text-blue-400",
        icon: hasOvertime ? "fa-star" : "fa-hourglass-half",
        label: hasOvertime ? "Half Day + OT" : "Half Day",
      },
      halfday: {
        bg: hasOvertime
          ? "bg-indigo-100 dark:bg-indigo-900/30"
          : "bg-blue-100 dark:bg-blue-900/30",
        text: hasOvertime
          ? "text-indigo-700 dark:text-indigo-400"
          : "text-blue-700 dark:text-blue-400",
        icon: hasOvertime ? "fa-star" : "fa-hourglass-half",
        label: hasOvertime ? "Half Day + OT" : "Half Day",
      },
      "full day": {
        bg: hasOvertime
          ? "bg-purple-100 dark:bg-purple-900/30"
          : "bg-purple-100 dark:bg-purple-900/30",
        text: hasOvertime
          ? "text-purple-700 dark:text-purple-400"
          : "text-purple-700 dark:text-purple-400",
        icon: "fa-check-double",
        label: hasOvertime ? "Full Day + OT" : "Full Day",
      },
      fullday: {
        bg: hasOvertime
          ? "bg-purple-100 dark:bg-purple-900/30"
          : "bg-purple-100 dark:bg-purple-900/30",
        text: hasOvertime
          ? "text-purple-700 dark:text-purple-400"
          : "text-purple-700 dark:text-purple-400",
        icon: hasOvertime ? "fa-star" : "fa-check-double",
        label: hasOvertime ? "Full Day + OT" : "Full Day",
      },
      holiday: {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-700 dark:text-pink-400",
        icon: "fa-calendar-day",
        label: "Holiday",
      },
      leave: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-400",
        icon: "fa-umbrella-beach",
        label: "Leave",
      },
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: "fa-spinner",
        label: "Pending",
      },
    };

    const config = statusConfigs[statusLower] || {
      bg: "bg-gray-100 dark:bg-gray-700/30",
      text: "text-gray-700 dark:text-gray-400",
      icon: "fa-circle",
      label: status || "Unknown",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <i className={`fas ${config.icon} text-[10px]`}></i>
        {config.label}
      </span>
    );
  };

  // Calculate stats for summary
  const allRecords = records || [];
  const totalPresent = allRecords.filter(
    (r) => r.status !== "Absent" && !r.lateBy,
  ).length;
  const totalHalfDay = allRecords.filter((r) => {
    const status = String(r.status || r.attendance_status || "").toLowerCase();
    return status === "half day" || status === "halfday";
  }).length;
  const totalAbsent = allRecords.filter((r) => r.status === "Absent").length;
  const totalOvertime = allRecords.filter((r) => {
    const overtime = r.overtime;
    if (!overtime || overtime === "-" || overtime === "0" || overtime === 0)
      return false;
    if (typeof overtime === "string" && overtime.trim() !== "") return true;
    if (typeof overtime === "number" && overtime > 0) return true;
    return false;
  }).length;

  const filteredRecords = allRecords;
  const totalFiltered = totalCount || filteredRecords.length;
  const totalPages = lastPage || Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;

  return (
    <div className="w-full overflow-x-hidden">
      <main className="content px-4 py-4 md:px-6 md:py-6 w-full overflow-x-hidden">
        {/* Page Header with Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
            <Link
              to="/admin/reports"
              className="text-green-500 hover:text-green-600 font-medium"
            >
              Reports
            </Link>
            <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
            <span className="text-gray-500">Attendance Report</span>
          </div>
          <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent">
            Attendance Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Detailed attendance logs with punch in/out times, duration, and
            overtime
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalFiltered}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-check text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Present
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalPresent}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-check text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Half Day
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {totalHalfDay}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-amber-600 dark:text-amber-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Absent
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {totalAbsent}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-slash text-red-600 dark:text-red-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Overtime
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totalOvertime}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-emerald-600 dark:text-emerald-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Filter - All in One Row */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-clock mr-1"></i> DATE RANGE
              </label>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
              >
                <option value="custom">Custom Range</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-calendar-alt mr-1"></i> START
              </label>
              <DateInput
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="dd/mm/yyyy"
                type="general"
              />
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-calendar-alt mr-1"></i> END
              </label>
              <DateInput
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="dd/mm/yyyy"
                type="general"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-user mr-1"></i> EMPLOYEE
              </label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
              >
                <option value="all">All Employees</option>
                {Array.isArray(employeesList) &&
                  employeesList.map((employee) => (
                    <option key={employee.id} value={String(employee.id)}>
                      {employee.name || `Employee ${employee.id}`}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium text-sm flex items-center gap-2 hover:bg-green-600 transition-all"
              >
                <i className="fas fa-filter"></i> Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <i className="fas fa-undo-alt"></i> Reset
              </button>
            </div>
          </div>
        </div>
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
          <EntriesSelector
            value={perPage}
            onChange={(val) => {
              setPerPage(val);
              setCurrentPage(1);
            }}
          />
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs md:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
            >
              <option value="all">Export All Data</option>
              <option value="current">Export Current Page</option>
            </select>

            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <i className="fas fa-download"></i> Export Report
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-green-500 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">
              Loading attendance records...
            </p>
          </div>
        ) : (
          <>
            {/* Attendance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
              <div className="min-w-[900px] md:min-w-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        S.No
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DATE
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        EMPLOYEE
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DEPARTMENT
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        PUNCH IN
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        PUNCH OUT
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        WORKED HOURS
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        OVERTIME
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, idx) => {
                        const hasOvertime = hasOvertimeValue(record.overtime);
                        const isLate = record.lateBy && record.lateBy > 0;

                        return (
                          <tr
                            key={record.id || idx}
                            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors dark:bg-emerald-900/5`}
                          >
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                              {start + idx + 1}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {record.date
                                ? (() => {
                                    try {
                                      if (record.date.includes("/")) {
                                        const parts = record.date.split("/");
                                        if (parts.length === 3) {
                                          const date = new Date(
                                            `${parts[2]}-${parts[1]}-${parts[0]}`,
                                          );
                                          if (!isNaN(date.getTime())) {
                                            return date.toLocaleDateString(
                                              "en-GB",
                                              {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                              },
                                            );
                                          }
                                        }
                                      }
                                      const date = new Date(record.date);
                                      if (!isNaN(date.getTime())) {
                                        return date.toLocaleDateString(
                                          "en-GB",
                                          {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          },
                                        );
                                      }
                                      return record.date;
                                    } catch (e) {
                                      return record.date;
                                    }
                                  })()
                                : "-"}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {record.employeeName || record.name || "-"}
                              {hasOvertime && (
                                <span className="ml-1 text-[8px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                                  OT
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {record.department || "-"}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                              <span
                                className={`font-semibold ${isLate ? "text-amber-600 dark:text-amber-400" : "text-gray-800 dark:text-gray-200"}`}
                              >
                                {formatTime(record.punchIn)}
                              </span>
                              {isLate && (
                                <span className="ml-1 text-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                  Late
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                              {record.punchOut ? (
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {formatTime(record.punchOut)}
                                </span>
                              ) : (
                                <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Not Punched Out
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {record.working_hours !== undefined &&
                              record.working_hours !== null &&
                              record.working_hours !== 0 &&
                              record.working_hours !== "0" ? (
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {formatWorkedHours(record.working_hours)}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                              {hasOvertime ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  {record.overtime}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              {getStatusBadge(
                                record.attendance_status || record.status,
                                hasOvertime,
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <i className="fas fa-calendar-times text-4xl text-gray-300 dark:text-gray-600"></i>
                            <p>No attendance records found</p>
                            <p className="text-xs">
                              Try changing the date range or filters
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalFiltered > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalFiltered}
                itemsPerPage={perPage}
              />
            )}
          </>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Attendance Report"
        totalRecords={exportType === "all" ? totalCount : records.length}
        formats={["csv", "pdf", "xlsx"]}
        defaultFormat="csv"
        subtitle={
          exportType === "all"
            ? `Exporting all ${totalCount} records across all pages`
            : `Exporting ${records.length} records from current page`
        }
        isLoading={exportLoading}
      />
    </div>
  );
};

export default AttendanceReport;
