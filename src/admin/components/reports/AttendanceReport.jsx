import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import EntriesSelector from "../common/EntriesSelector";
import { showToast } from "../../../components/common/Toast";
import Pagination from "../common/Paginations";
import { fetchAttendanceReport } from "../../store/slices/reportSlice";
import ExportModal from "../../../components/common/ExportModal";
import { exportToCSV, formatDate } from "../../../utils/reportUtils";
import { generateAttendancePDF } from "../../../utils/reportPDFConfigs";
import { fetchEmployeeProjectWorkingTime } from "../../store/slices/projectAssignmentSlice";
import { fetchEmployees } from "../../store/slices/employeeSlice";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { getPhotoUrl, getFallbackAvatar } from "../../../utils/imageHelper";

const AttendanceReport = () => {
  const dispatch = useDispatch();
  const {
    records = [],
    loading,
    totalCount,
    lastPage,
  } = useSelector((state) => state.attendance || {});
  
  const { employees = [] } = useSelector((state) => state.employees || { employees: [] });

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Modal state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Day details modal
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [dayProjectHours, setDayProjectHours] = useState([]);
  const [loadingDayHours, setLoadingDayHours] = useState(false);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Fetch attendance data with filters
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(
        fetchAttendanceReport({
          page: 1,
          per_page: 1000,
          company: companyFilter !== "all" ? companyFilter : undefined,
          search: searchTerm || undefined,
          start_date: startDate,
          end_date: endDate,
        }),
      );
    };
    fetchData();
  }, [dispatch, companyFilter, searchTerm, startDate, endDate]);

  // Fetch employees data
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [companyFilter, searchTerm, perPage, startDate, endDate]);

  // Build a map of employee name to user_id and avatar
  const employeeDataMap = {};
  employees.forEach(emp => {
    const name = emp.name || `${emp.first_name} ${emp.last_name}`.trim();
    if (name) {
      employeeDataMap[name] = {
        user_id: emp.user_id || emp.user?.id || null,
        avatar: emp.avatar || emp.user?.avatar || null,
        employee_id: emp.employee_id || null,
      };
    }
    // Also map by employee_id
    if (emp.employee_id) {
      employeeDataMap[emp.employee_id] = {
        user_id: emp.user_id || emp.user?.id || null,
        avatar: emp.avatar || emp.user?.avatar || null,
        employee_id: emp.employee_id,
      };
    }
  });
  
  console.log("Employee Data Map:", employeeDataMap);

  // Get unique employees from records
  const uniqueEmployees = () => {
    const employeeMap = new Map();
    records.forEach(record => {
      // Get the user data from the map using the name or employee_id
      const name = record.name || record.employeeName || "Unknown";
      const empData = employeeDataMap[name] || employeeDataMap[record.employee_id] || {};
      
      const key = record.employee_id || record.employeeId || name;
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          employee_id: record.employee_id || record.employeeId,
          name: name,
          department: record.department || "-",
          designation: record.designation || "-",
          company: record.company || "-",
          user_id: empData.user_id || null,
          avatar: empData.avatar || null,
        });
      }
    });
    return Array.from(employeeMap.values());
  };

  const employeesList = uniqueEmployees();
  const filteredEmployees = employeesList.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFiltered = filteredEmployees.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageData = filteredEmployees.slice(start, start + perPage);

  // Get attendance records for a specific employee
  const getEmployeeAttendance = (employeeName) => {
    return records.filter(r => 
      (r.name || r.employeeName) === employeeName
    );
  };

  // Handle employee click - show calendar modal
  const handleEmployeeClick = (employee) => {
    const attendance = getEmployeeAttendance(employee.name);
    setSelectedEmployee(employee);
    setEmployeeAttendance(attendance);
    setSelectedMonth(new Date());
    setShowEmployeeModal(true);
  };

  // Helper to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parse date string to Date object
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
    }
    
    // Handle YYYY-MM-DD format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {
      return null;
    }
    
    return null;
  };

  // Handle day click in calendar
  const handleDayClick = async (date) => {
    console.log("Day clicked:", date);
    const dateStr = formatDateToDDMMYYYY(date);
    console.log("Formatted date:", dateStr);
    console.log("Employee attendance records:", employeeAttendance);
    
    const dayRecords = employeeAttendance.filter(r => {
      const recordDate = r.date || r.log_date;
      if (!recordDate) return false;
      
      const parsedDate = parseDateString(recordDate);
      if (!parsedDate) return false;
      
      const formattedDate = formatDateToDDMMYYYY(parsedDate);
      console.log(`Comparing: ${formattedDate} === ${dateStr}`);
      return formattedDate === dateStr;
    });

    console.log("Found day records:", dayRecords);

    if (dayRecords.length === 0) {
      showToast(`No attendance record for ${dateStr}`, "info");
      return;
    }

    // Get the user_id - use the mapped user_id from selectedEmployee
    let userId = selectedEmployee?.user_id || null;
    
    // If no user_id, try to find it from the employeeDataMap
    if (!userId && selectedEmployee?.name) {
      userId = employeeDataMap[selectedEmployee.name]?.user_id || null;
    }
    
    // If still no user_id, try using the record's id (which is the user_id)
    if (!userId) {
      userId = dayRecords[0]?.id || dayRecords[0]?.userid || null;
    }
    
    console.log("User ID for API call:", userId);
    
    setSelectedDayData({
      date: date,
      records: dayRecords,
      employee: selectedEmployee,
      userId: userId,
    });
    setShowDayModal(true);
    
    // Fetch project hours for this day if userId exists
    if (userId) {
      setLoadingDayHours(true);
      try {
        console.log("Fetching project hours for user:", userId);
        const result = await dispatch(
          fetchEmployeeProjectWorkingTime(userId)
        ).unwrap();
        console.log("Project hours result:", result);
        
        // The API returns data in the response.data.data structure
        let projectData = [];
        if (result.data && Array.isArray(result.data)) {
          projectData = result.data;
        } else if (result.data && result.data.data && Array.isArray(result.data.data)) {
          projectData = result.data.data;
        } else if (Array.isArray(result)) {
          projectData = result;
        }
        
        // Filter projects for this specific day
        const dayProjects = projectData.filter(project => {
          return project.daily_logs?.some(log => {
            const logDate = formatDateToDDMMYYYY(new Date(log.date));
            return logDate === dateStr;
          });
        });
        
        console.log("Day projects:", dayProjects);
        setDayProjectHours(dayProjects);
      } catch (error) {
        console.error("Error fetching project hours:", error);
        setDayProjectHours([]);
      } finally {
        setLoadingDayHours(false);
      }
    } else {
      console.warn("No user_id found for employee");
      setDayProjectHours([]);
      setLoadingDayHours(false);
    }
  };

  // Get status for calendar tile
  const getDayStatus = (date) => {
    const dateStr = formatDateToDDMMYYYY(date);
    
    const dayRecords = employeeAttendance.filter(r => {
      const recordDate = r.date || r.log_date;
      if (!recordDate) return false;
      
      const parsedDate = parseDateString(recordDate);
      if (!parsedDate) return false;
      
      const formattedDate = formatDateToDDMMYYYY(parsedDate);
      return formattedDate === dateStr;
    });

    if (dayRecords.length === 0) return null;
    
    const hasPresent = dayRecords.some(r => r.status === "Present");
    const hasAbsent = dayRecords.some(r => r.status === "Absent");
    const hasLate = dayRecords.some(r => r.status === "Late");
    
    if (hasPresent && !hasAbsent && !hasLate) return "present";
    if (hasLate) return "late";
    if (hasAbsent) return "absent";
    return "present";
  };

  // Get tile class for calendar
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const status = getDayStatus(date);
    if (!status) return '';
    
    const baseClass = 'transition-colors rounded-lg';
    if (status === 'present') return `${baseClass} bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40`;
    if (status === 'absent') return `${baseClass} bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40`;
    if (status === 'late') return `${baseClass} bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/40`;
    return baseClass;
  };

  // Tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const status = getDayStatus(date);
    if (!status) return null;
    
    const dotColors = {
      present: 'bg-green-500',
      absent: 'bg-red-500',
      late: 'bg-yellow-500',
    };
    
    return (
      <div className="flex justify-center mt-0.5">
        <div className={`w-2 h-2 rounded-full ${dotColors[status]}`}></div>
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === "Present") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <i className="fas fa-check-circle text-green-500 text-[10px]"></i>
          Present
        </span>
      );
    }
    if (status === "Late") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <i className="fas fa-clock text-amber-500 text-[10px]"></i>
          Late
        </span>
      );
    }
    if (status === "Absent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <i className="fas fa-user-slash text-red-500 text-[10px]"></i>
          Absent
        </span>
      );
    }
    return null;
  };

  // Transform attendance data for export
  const getExportData = () => {
    const allRecords = records || [];
    return allRecords.map(record => ({
      date: formatDate(record.date),
      employee_name: record.name || record.employeeName || "-",
      department: record.department || "-",
      punch_in: record.punch_in || record.punchIn || "-",
      punch_out: record.punch_out || record.punchOut || "-",
      duration: record.worked_hours ? `${record.worked_hours}h` : "-",
      status: record.status || "Unknown",
      late_by: record.late_by || "-",
    }));
  };

  const handleExport = async (format) => {
    const exportData = getExportData();
    
    if (exportData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    const headers = [
      { key: "date", label: "Date" },
      { key: "employee_name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "punch_in", label: "Punch In" },
      { key: "punch_out", label: "Punch Out" },
      { key: "duration", label: "Duration" },
      { key: "status", label: "Status" },
      { key: "late_by", label: "Late By" },
    ];

    const filename = `attendance_report_${startDate}_to_${endDate}`;

    if (format === "csv") {
      exportToCSV(exportData, headers, `${filename}.csv`);
      showToast("Attendance report exported successfully!", "success");
    } else if (format === "pdf") {
      generateAttendancePDF(records, {
        start_date: startDate,
        end_date: endDate,
        company: companyFilter !== "all" ? companyFilter : null,
        search: searchTerm || null,
      });
      showToast("PDF report generated successfully!", "success");
    }
  };

  // Calculate stats
  const totalPresent = records.filter(r => r.status === "Present").length;
  const totalLate = records.filter(r => r.status === "Late").length;
  const totalAbsent = records.filter(r => r.status === "Absent").length;

  // Get unique companies for filter
  const uniqueCompanies = [
    ...new Set(records.map((record) => record.company).filter(Boolean)),
  ];

  // Helper to get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

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
            View employee attendance summary and monthly calendars
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {employeesList.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600 dark:text-blue-400"></i>
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
                  Late
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {totalLate}
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
        </div>

        {/* Date Range Filter */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-calendar-alt mr-1"></i> START DATE
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-calendar-alt mr-1"></i> END DATE
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  showToast("Filters applied successfully", "success");
                }}
                className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium text-sm flex items-center gap-2 hover:bg-green-600 transition-all"
              >
                <i className="fas fa-filter"></i> Apply
              </button>
              <button
                onClick={() => {
                  const firstDayOfMonth = new Date();
                  firstDayOfMonth.setDate(1);
                  setStartDate(firstDayOfMonth.toISOString().split("T")[0]);
                  setEndDate(new Date().toISOString().split("T")[0]);
                  setCompanyFilter("all");
                  setSearchTerm("");
                  setCurrentPage(1);
                  showToast("Filters reset successfully", "success");
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <i className="fas fa-undo-alt"></i> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 md:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs md:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
          >
            <option value="all">All Companies</option>
            {uniqueCompanies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
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
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Search by employee name..."
            />
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <i className="fas fa-download"></i> Export Report
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && records.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-green-500 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">
              Loading attendance records...
            </p>
          </div>
        ) : (
          <>
            {/* Employee Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
              <div className="min-w-[600px] md:min-w-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        S.No
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        EMPLOYEE
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DEPARTMENT
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DESIGNATION
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        TOTAL DAYS
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.length > 0 ? (
                      pageData.map((employee, idx) => {
                        const attendance = getEmployeeAttendance(employee.name);
                        const avatarUrl = employee.avatar ? getPhotoUrl(employee.avatar) : null;
                        const initials = getInitials(employee.name);
                        
                        return (
                          <tr
                            key={employee.employee_id || idx}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                              {start + idx + 1}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <div className="flex items-center gap-2 md:gap-3">
                                {/* Avatar / Profile Picture */}
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={employee.name}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      // Show fallback initials
                                      const parent = e.target.parentElement;
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0';
                                      fallback.textContent = initials;
                                      parent.appendChild(fallback);
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0">
                                    {initials}
                                  </div>
                                )}
                                <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  {employee.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {employee.department}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {employee.designation}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {attendance.length}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3">
                              <button
                                onClick={() => handleEmployeeClick(employee)}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all"
                              >
                                <i className="fas fa-calendar-alt mr-1"></i> View Calendar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <i className="fas fa-users text-4xl text-gray-300 dark:text-gray-600"></i>
                            <p>No employees found</p>
                            <p className="text-xs">Try changing the date range or filters</p>
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

      {/* Employee Calendar Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmployeeModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  <i className="fas fa-user text-blue-500 mr-2"></i>
                  {selectedEmployee.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedEmployee.department} • {selectedEmployee.designation}
                </p>
                <p className="text-xs text-gray-400">
                  {employeeAttendance.length} attendance records
                </p>
                {selectedEmployee.user_id && (
                  <p className="text-xs text-gray-400">User ID: {selectedEmployee.user_id}</p>
                )}
              </div>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>

            {/* Modal Body - Calendar */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <style>
                {`
                  .employee-calendar {
                    width: 100% !important;
                    border: none !important;
                    background: transparent !important;
                    font-family: inherit !important;
                  }
                  .employee-calendar .react-calendar__navigation {
                    display: flex !important;
                    margin-bottom: 0.5rem !important;
                  }
                  .employee-calendar .react-calendar__navigation button {
                    color: #4b5563 !important;
                    font-weight: 600 !important;
                    font-size: 0.875rem !important;
                    padding: 0.5rem !important;
                  }
                  .employee-calendar .react-calendar__navigation button:hover {
                    background: #f3f4f6 !important;
                    border-radius: 8px !important;
                  }
                  .employee-calendar .react-calendar__navigation button:disabled {
                    opacity: 0.5 !important;
                  }
                  .employee-calendar .react-calendar__month-view__weekdays {
                    color: #6b7280 !important;
                    font-weight: 600 !important;
                    font-size: 0.75rem !important;
                    text-transform: uppercase !important;
                  }
                  .employee-calendar .react-calendar__month-view__weekdays__weekday {
                    padding: 0.5rem 0 !important;
                  }
                  .employee-calendar .react-calendar__month-view__weekdays abbr {
                    text-decoration: none !important;
                    cursor: default !important;
                  }
                  .employee-calendar .react-calendar__tile {
                    padding: 0.5rem 0.25rem !important;
                    border-radius: 8px !important;
                    transition: all 0.2s ease !important;
                    position: relative !important;
                    aspect-ratio: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    color: inherit !important;
                    cursor: pointer !important;
                  }
                  .employee-calendar .react-calendar__tile:hover {
                    transform: scale(1.05) !important;
                    z-index: 1 !important;
                    background: #f3f4f6 !important;
                  }
                  .dark .employee-calendar .react-calendar__tile:hover {
                    background: #374151 !important;
                  }
                  .employee-calendar .react-calendar__tile--active {
                    background: #2ecc71 !important;
                    color: white !important;
                  }
                  .employee-calendar .react-calendar__tile abbr {
                    font-size: 0.875rem !important;
                    font-weight: 500 !important;
                  }
                  .employee-calendar .react-calendar__month-view__days__day--weekend {
                    color: #ef4444 !important;
                  }
                  .dark .employee-calendar .react-calendar__month-view__days__day--weekend {
                    color: #f87171 !important;
                  }
                  .employee-calendar .react-calendar__month-view__days__day--neighboringMonth {
                    color: #9ca3af !important;
                  }
                  .employee-calendar .react-calendar__tile--now {
                    background: #f0fdf4 !important;
                    border: 2px solid #22c55e !important;
                  }
                  .dark .employee-calendar .react-calendar__tile--now {
                    background: #064e3b !important;
                    border-color: #34d399 !important;
                  }
                `}
              </style>
              <Calendar
                className="employee-calendar"
                value={selectedMonth}
                onChange={setSelectedMonth}
                tileClassName={tileClassName}
                tileContent={tileContent}
                onClickDay={handleDayClick}
                maxDetail="month"
                minDetail="month"
                formatDay={(locale, date) => date.getDate()}
              />
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Present
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  Late
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Absent
                </span>
                <span className="text-gray-400 ml-2">
                  Click on a day to view project hours
                </span>
              </div>

              {/* Show count of attendance days */}
              <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                Showing {employeeAttendance.length} attendance records for {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {showDayModal && selectedDayData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDayModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  <i className="fas fa-calendar-day text-green-500 mr-2"></i>
                  {selectedDayData.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDayData.employee?.name || "Employee"}
                </p>
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {/* Day Attendance */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <i className="fas fa-clock text-blue-500 mr-2"></i>
                  Attendance Details
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  {selectedDayData.records.map((record, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Punch In: {record.punch_in || record.punchIn || "No punch in"}
                        {record.punch_out || record.punchOut ? ` | Punch Out: ${record.punch_out || record.punchOut}` : ""}
                        {record.worked_hours !== undefined && record.worked_hours > 0 ? ` | Worked: ${record.worked_hours}h` : ""}
                      </span>
                      {getStatusBadge(record.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Hours */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <i className="fas fa-project-diagram text-indigo-500 mr-2"></i>
                  Project Hours
                </h4>
                
                {loadingDayHours ? (
                  <div className="text-center py-4">
                    <i className="fas fa-spinner fa-spin text-indigo-500 text-xl"></i>
                    <p className="text-sm text-gray-500 mt-1">Loading project hours...</p>
                  </div>
                ) : dayProjectHours && dayProjectHours.length > 0 ? (
                  <div className="space-y-2">
                    {dayProjectHours.map((project, idx) => {
                      const dateStr = formatDateToDDMMYYYY(selectedDayData.date);
                      const dayLog = project.daily_logs?.find(log => {
                        const logDate = formatDateToDDMMYYYY(new Date(log.date));
                        return logDate === dateStr;
                      });
                      
                      return (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                              {project.project_name || `Project #${project.project_id}`}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
                              {dayLog?.working_time_formatted || `${dayLog?.working_time_minutes || 0} mins`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-info-circle text-xl mb-1"></i>
                    <p className="text-sm">No project hours recorded for this day</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDayModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Attendance Report"
        totalRecords={records.length}
        formats={["csv", "pdf"]}
        defaultFormat="csv"
      />
    </div>
  );
};

export default AttendanceReport;