import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  fetchEmployeeAttendanceForCalendar,
  fetchEmployeeDailyAttendance,
  fetchEmployeeMonthlyProjectHours,
  fetchEmployeeDailyProjectHours,
} from "../../store/slices/reportSlice";
import { fetchEmployees } from "../../store/slices/employeeSlice";
import { showToast } from "../../../components/common/Toast";

// Helper functions
const formatDateToDDMMYYYY = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateToYYYYMMDD = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatusColorForEmployee = (status) => {
  if (!status) return "bg-gray-200 dark:bg-gray-600";

  const statusLower = status.toLowerCase();
  if (
    statusLower === "present" ||
    statusLower === "ontime" ||
    statusLower === "on time"
  )
    return "bg-blue-500";
  if (statusLower === "absent" || statusLower === "absentee")
    return "bg-red-500";
  if (statusLower === "late") return "bg-yellow-500";
  if (statusLower === "half day" || statusLower === "halfday")
    return "bg-purple-500";
  if (statusLower === "leave") return "bg-indigo-500";
  if (statusLower === "holiday") return "bg-pink-500";
  return "bg-gray-200 dark:bg-gray-600";
};

const getStatusLabel = (status) => {
  if (!status) return "Unknown";
  const statusLower = status.toLowerCase();
  if (
    statusLower === "present" ||
    statusLower === "ontime" ||
    statusLower === "on time"
  )
    return "Present";
  if (statusLower === "absent" || statusLower === "absentee") return "Absent";
  if (statusLower === "late") return "Late";
  if (statusLower === "half day" || statusLower === "halfday")
    return "Half Day";
  if (statusLower === "leave") return "Leave";
  if (statusLower === "holiday") return "Holiday";
  return status;
};

// Helper function to get avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;

  if (avatarPath.startsWith("http")) return avatarPath;
  if (avatarPath.startsWith("data:")) return avatarPath;

  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  if (avatarPath.startsWith("/storage/")) {
    return `${baseUrl}${avatarPath}`;
  }

  if (
    avatarPath.startsWith("avatars/") ||
    avatarPath.startsWith("employees/") ||
    avatarPath.startsWith("photos/")
  ) {
    return `${baseUrl}/storage/${avatarPath}`;
  }

  return `${baseUrl}/storage/${avatarPath}`;
};

// Check if a date is Sunday
const isSunday = (date) => {
  return date.getDay() === 0;
};

// Check if a date is in the future (after today)
const isFutureDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
};

const EmployeeAttendancePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employeeId } = useParams();

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [dayDetails, setDayDetails] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [dailyProjectData, setDailyProjectData] = useState(null);

  const {
    employeeAttendanceCalendar,
    employeeAttendanceCalendarLoading,
    employeeDailyAttendance,
    employeeDailyAttendanceLoading,
    employeeMonthlyProjectHours,
    employeeMonthlyProjectHoursLoading,
    employeeDailyProjectHours,
    employeeDailyProjectHoursLoading,
  } = useSelector((state) => state.reports || {});

  // Get employees from employeeSlice (full data with avatars)
  const { employees = [], loading: employeesLoading } = useSelector(
    (state) => state.employees || { employees: [], loading: false },
  );

  // Fetch employees if not loaded
  useEffect(() => {
    if (employees.length === 0 && !employeesLoading) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, employees.length, employeesLoading]);

  // Find employee from the full employees list
  useEffect(() => {
    if (employees.length > 0 && employeeId) {
      const foundEmployee = employees.find((emp) => {
        const rawData = emp.raw || {};
        return (
          String(rawData.id) === String(employeeId) ||
          String(rawData.user_id) === String(employeeId) ||
          String(emp.id) === String(employeeId) ||
          String(emp.user_id) === String(employeeId) ||
          String(rawData.employee_id) === String(employeeId)
        );
      });

      if (foundEmployee) {
        const rawData = foundEmployee.raw || {};
        const avatarPath = rawData.avatar || foundEmployee.avatar;

        setEmployee({
          id: rawData.id,
          user_id: rawData.user_id,
          name:
            foundEmployee.name ||
            `${rawData.first_name || ""} ${rawData.last_name || ""}`.trim(),
          employee_id: rawData.employee_id || foundEmployee.employee_id,
          department:
            foundEmployee.department || rawData.user?.department?.name,
          avatar: avatarPath,
          email:
            rawData.company_email ||
            rawData.personal_email ||
            foundEmployee.email,
          first_name: rawData.first_name,
          last_name: rawData.last_name,
        });
        setAvatarError(false);
      } else {
        showToast("Employee not found", "error");
        navigate("/admin/reports/attendance-reports");
      }
    }
  }, [employees, employeeId, navigate]);

  // Fetch attendance data when month changes or employee changes
  useEffect(() => {
    if (!employee || !employeeId) return;

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    const apiEmployeeId = employee.user_id || employee.id;

    dispatch(
      fetchEmployeeAttendanceForCalendar({
        employeeId: apiEmployeeId,
        year,
        month,
      }),
    );
  }, [dispatch, selectedMonth, employee, employeeId]);

  // Fetch monthly project hours when month changes or employee changes
  useEffect(() => {
    if (!employee || !employeeId) return;

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    // Use employee.id (employee record ID) for the API
    const apiEmployeeId = employee.id;

    if (apiEmployeeId) {
      dispatch(
        fetchEmployeeMonthlyProjectHours({
          employeeId: apiEmployeeId,
          month: month,
          year: year,
        }),
      );
    }
  }, [dispatch, selectedMonth, employee, employeeId]);

  // Reset day details when switching months
  useEffect(() => {
    setShowDayDetails(false);
    setDayDetails(null);
    setDailyProjectData(null);
  }, [selectedMonth]);

  // Get day status for calendar
  const getDayStatus = (date) => {
    // Check if it's Sunday - mark as holiday
    if (isSunday(date)) {
      return { status: "holiday", count: 0, records: [] };
    }

    // Check if it's a future date
    if (isFutureDate(date)) {
      return { status: "future", count: 0, records: [] };
    }

    if (!employeeAttendanceCalendar?.data)
      return { status: "no-data", records: [] };

    const dateStr = formatDateToDDMMYYYY(date);
    const records = employeeAttendanceCalendar.data;
    const dateStrYYYYMMDD = formatDateToYYYYMMDD(date);

    const dayRecords = records.filter((r) => {
      const recordDate = r.date || r.log_date || r.attendance_date;
      return (
        recordDate === dateStr ||
        recordDate === dateStrYYYYMMDD ||
        formatDateToDDMMYYYY(recordDate) === dateStr ||
        formatDateToYYYYMMDD(recordDate) === dateStrYYYYMMDD
      );
    });

    if (dayRecords.length === 0) {
      return { status: "no-data", count: 0, records: [] };
    }

    const statuses = dayRecords.map((r) => {
      const status = (r.status || r.attendance_status || "").toLowerCase();
      if (
        status === "present" ||
        status === "ontime" ||
        status === "on time" ||
        status === "full day" ||
        status === "fullday"
      )
        return "present";
      if (status === "late") return "late";
      if (status === "absent" || status === "absentee") return "absent";
      if (status === "half day" || status === "halfday") return "halfday";
      if (status === "leave") return "leave";
      if (status === "holiday") return "holiday";
      return "present";
    });

    const uniqueStatuses = [...new Set(statuses)];

    if (uniqueStatuses.length === 1) {
      return {
        status: uniqueStatuses[0],
        count: dayRecords.length,
        records: dayRecords,
      };
    }

    return { status: "mixed", count: dayRecords.length, records: dayRecords };
  };

  // Get status display text for tile
  const getStatusDisplay = (status) => {
    const displays = {
      present: "P",
      absent: "A",
      late: "L",
      halfday: "H",
      mixed: "M",
      leave: "LV",
      holiday: "H",
      future: "",
      "no-data": "",
    };
    return displays[status] || "";
  };

  // Calendar tile className with colors - hide neighboring month dates
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const dayInfo = getDayStatus(date);
    const today = isToday(date);
    const sunday = isSunday(date);
    const future = isFutureDate(date);

    // Check if this date belongs to the current month
    const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();

    // If it's a neighboring month date, return special class to hide it
    if (!isCurrentMonth) {
      return "neighboring-month-hidden";
    }

    // Today highlight - overrides everything
    if (today) {
      return "today-highlight";
    }

    // Future dates - grayed out
    if (future) {
      return "future-date";
    }

    // Sunday - holiday
    if (sunday) {
      return "holiday-date";
    }

    // Status-based coloring
    if (dayInfo.status !== "no-data") {
      const statusClassMap = {
        present: "status-present",
        absent: "status-absent",
        late: "status-late",
        halfday: "status-halfday",
        mixed: "status-mixed",
        leave: "status-leave",
        holiday: "status-holiday",
      };
      return statusClassMap[dayInfo.status] || "";
    }

    return "no-data-date";
  };

  // Calendar tile content - hide content for neighboring months
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    // Hide content for neighboring month dates
    if (date.getMonth() !== selectedMonth.getMonth()) {
      return null;
    }

    const dayInfo = getDayStatus(date);
    if (dayInfo.status === "no-data" || dayInfo.status === "future")
      return null;

    const abbr = getStatusDisplay(dayInfo.status);
    if (!abbr) return null;

    // Get the appropriate text color class based on status
    const getTextColorClass = (status) => {
      const colorMap = {
        present: "text-green-800 dark:text-green-200",
        absent: "text-red-800 dark:text-red-200",
        late: "text-yellow-800 dark:text-yellow-200",
        halfday: "text-purple-800 dark:text-purple-200",
        mixed: "text-indigo-800 dark:text-indigo-200",
        leave: "text-indigo-800 dark:text-indigo-200",
        holiday: "text-pink-800 dark:text-pink-200",
      };
      return colorMap[status] || "text-gray-800 dark:text-gray-200";
    };

    return (
      <div className="flex justify-center items-center mt-0.5">
        <span
          className={`text-[9px] font-bold ${getTextColorClass(dayInfo.status)} drop-shadow-sm`}
        >
          {abbr}
        </span>
      </div>
    );
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Handle day click - fetch detailed attendance AND daily project hours
  const handleDayClick = async (date) => {
    if (isSunday(date) || isFutureDate(date)) {
      showToast(
        isSunday(date) ? "Sunday is a holiday" : "No data for future dates",
        "info",
      );
      return;
    }

    const dateStr = formatDateToYYYYMMDD(date);
    const dayInfo = getDayStatus(date);

    if (dayInfo.status === "no-data") {
      showToast("No attendance data for this day", "info");
      setShowDayDetails(false);
      setDayDetails(null);
      setDailyProjectData(null);
      return;
    }

    // Reset states before fetching
    setLoadingDay(true);
    setShowDayDetails(true);
    setSelectedDate(date);
    setDayDetails(null);
    setDailyProjectData(null);

    try {
      const apiEmployeeId = employee.user_id || employee.id;
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      // Fetch daily attendance
      const attendanceResult = await dispatch(
        fetchEmployeeDailyAttendance({
          employeeId: apiEmployeeId,
          date: dateStr,
        }),
      ).unwrap();

      // Set dayDetails directly from the result
      let attendanceData = null;
      if (attendanceResult?.data) {
        attendanceData = attendanceResult.data;
      } else if (attendanceResult) {
        attendanceData = attendanceResult;
      }

      // Update state with the attendance data
      setDayDetails(attendanceData);
      setLoadingDay(false);

      // Fetch daily project hours
      const apiEmployeeRecordId = employee.id;
      if (apiEmployeeRecordId) {
        const projectResult = await dispatch(
          fetchEmployeeDailyProjectHours({
            employeeId: apiEmployeeRecordId,
            date: dateStr,
            year: year,
            month: month,
          }),
        ).unwrap();

        let projectData = null;
        if (projectResult?.data?.employees?.length > 0) {
          const employeeProjectData = projectResult.data.employees.find(
            (emp) => String(emp.id) === String(apiEmployeeRecordId),
          );
          if (employeeProjectData) {
            projectData = employeeProjectData;
          }
        } else if (projectResult?.employees?.length > 0) {
          const employeeProjectData = projectResult.employees.find(
            (emp) => String(emp.id) === String(apiEmployeeRecordId),
          );
          if (employeeProjectData) {
            projectData = employeeProjectData;
          }
        } else if (projectResult?.data?.projects) {
          projectData = projectResult.data;
        } else if (projectResult?.projects) {
          projectData = projectResult;
        }
        setDailyProjectData(projectData);
      }
    } catch (error) {
      console.error("Error fetching daily details:", error);
      setLoadingDay(false);
      setDayDetails(null);
      setDailyProjectData(null);

      // Only show toast for actual errors, not "no data" cases
      if (
        !error.message?.includes("No detailed data") &&
        error.status !== 404
      ) {
        showToast("Failed to load day details", "error");
      }
    }
  };

  // Month navigation
  const goToPrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  const goToToday = () => {
    setSelectedMonth(new Date());
    setShowDayDetails(false);
    setDayDetails(null);
  };

  // Format worked hours
  const formatWorkedHours = (hours) => {
    if (!hours || hours === 0 || hours === "0") return "0 hrs";
    const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
    if (isNaN(numHours) || numHours === 0) return "0 hrs";
    const h = Math.floor(numHours);
    const m = Math.round((numHours - h) * 60);
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hr${h > 1 ? "s" : ""}`;
    return `${h} hr${h > 1 ? "s" : ""} ${m} min${m > 1 ? "s" : ""}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLower = String(status || "").toLowerCase();
    const configs = {
      present:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      ontime:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      "on time":
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      absent: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      absentee: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      late: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      "half day":
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      halfday:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      leave:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
      holiday:
        "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
    };

    const config =
      configs[statusLower] ||
      "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400";
    const label = getStatusLabel(status);

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config}`}
      >
        {label}
      </span>
    );
  };

  // Project hours component - Updated to use monthly data
  const ProjectHoursList = ({ projects, totalFormatted }) => {
    if (!projects || projects.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No project hours logged
        </p>
      );
    }

    return (
      <div className="space-y-2 mt-2">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Project-wise Hours:
          </p>
          {totalFormatted && (
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              Total: {totalFormatted}
            </span>
          )}
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
          {projects.map((project, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                {project.project_name || project.name || `Project ${idx + 1}`}
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                {project.formatted ||
                  formatWorkedHours(project.hours || project.worked_hours || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get employee's monthly project hours - with null safety
  const getEmployeeMonthlyHours = () => {
    if (!employee) return null;
    if (!employeeMonthlyProjectHours?.data?.employees) return null;

    const apiEmployeeId = employee.id;
    if (!apiEmployeeId) return null;

    const employeeData = employeeMonthlyProjectHours.data.employees.find(
      (emp) => String(emp.id) === String(apiEmployeeId),
    );

    return employeeData || null;
  };

  // Get the employee monthly hours with safe check
  const employeeMonthlyHours = employee ? getEmployeeMonthlyHours() : null;

  // Loading state
  if (!employee && employees.length > 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
          <p className="text-gray-500 dark:text-gray-400">
            Loading employee data...
          </p>
        </div>
      </div>
    );
  }

  if (employeesLoading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
          <p className="text-gray-500 dark:text-gray-400">
            Loading employees...
          </p>
        </div>
      </div>
    );
  }

  const isDailyLoading = loadingDay;
  const currentDayData = dayDetails;

  // Get initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar URL
  const avatarUrl = employee?.avatar ? getAvatarUrl(employee.avatar) : null;
  const initials = getInitials(employee?.name || "");

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
            <Link
              to="/admin/reports/attendance-reports"
              className="text-green-500 hover:text-green-600 font-medium"
            >
              Attendance Report
            </Link>
            <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
            <span className="text-gray-500">Employee Attendance</span>
          </div>

          {/* Employee Header with Avatar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={employee?.name || "Employee"}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 dark:border-blue-800 shadow-lg flex-shrink-0"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                    {initials}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {employee?.name || "Employee"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {employee?.employee_id || "ID: N/A"}
                  </span>
                  {employee?.department && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      {employee.department}
                    </span>
                  )}
                  {employee?.email && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      <i className="fas fa-envelope mr-1"></i>
                      {employee.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/admin/reports/attendance-reports"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-arrow-left"></i> Back to Report
            </Link>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Days
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {employeeAttendanceCalendar?.data?.length || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Present
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {employeeAttendanceCalendar?.data?.filter((r) => {
                const status = (
                  r.status ||
                  r.attendance_status ||
                  ""
                ).toLowerCase();
                return (
                  status === "present" ||
                  status === "ontime" ||
                  status === "on time" ||
                  status === "full day" ||
                  status === "fullday"
                );
              }).length || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Absent
            </div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {employeeAttendanceCalendar?.data?.filter((r) => {
                const status = (
                  r.status ||
                  r.attendance_status ||
                  ""
                ).toLowerCase();
                return status === "absent" || status === "absentee";
              }).length || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Late</div>
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {employeeAttendanceCalendar?.data?.filter((r) => {
                const status = (
                  r.status ||
                  r.attendance_status ||
                  ""
                ).toLowerCase();
                return status === "late";
              }).length || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Half Day
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {employeeAttendanceCalendar?.data?.filter((r) => {
                const status = (
                  r.status ||
                  r.attendance_status ||
                  ""
                ).toLowerCase();
                return status === "half day" || status === "halfday";
              }).length || 0}
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className="fas fa-chevron-left text-gray-600 dark:text-gray-400"></i>
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[140px] text-center">
              {selectedMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className="fas fa-chevron-right text-gray-600 dark:text-gray-400"></i>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              <i className="fas fa-calendar-day mr-1"></i> Today
            </button>
          </div>
        </div>

        {/* Calendar and Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            {employeeAttendanceCalendarLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex justify-center items-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                  <i className="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading attendance data...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-soft">
                <style>
                  {`
    /* Calendar Container */
.react-calendar {
  width: 100% !important;
  border: none !important;
  background: transparent !important;
  font-family: inherit !important;
}
.react-calendar__navigation {
  display: none !important;
}

/* Weekday Headers */
.react-calendar__month-view__weekdays {
  color: #6b7280 !important;
  font-weight: 600 !important;
  font-size: 0.65rem !important;
  text-transform: uppercase !important;
  padding: 0.25rem 0 !important;
}
.react-calendar__month-view__weekdays__weekday {
  padding: 0.25rem 0 !important;
}
.react-calendar__month-view__weekdays abbr {
  text-decoration: none !important;
  cursor: default !important;
  font-size: 0.65rem !important;
}

/* Month View - Fix grid layout */
.react-calendar__month-view__weekdays {
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
}

.react-calendar__month-view__days {
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
  gap: 2px !important;
}

/* Tile Base Styles */
.react-calendar__tile {
  padding: 0 !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
  aspect-ratio: 1 !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  min-height: 40px !important;
  max-height: 56px !important;
  border: 2px solid transparent !important;
  cursor: pointer !important;
  font-weight: 500 !important;
}
.react-calendar__tile abbr {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  color: inherit !important;
}

/* Hide neighboring month dates but keep the space */
.neighboring-month-hidden {
  visibility: hidden !important;
  pointer-events: none !important;
  background: transparent !important;
  border-color: transparent !important;
  min-height: 40px !important;
  max-height: 56px !important;
  aspect-ratio: 1 !important;
  width: 100% !important;
}

.neighboring-month-hidden abbr {
  visibility: hidden !important;
  color: transparent !important;
}

/* Ensure empty tiles still take up space */
.react-calendar__month-view__days__day--neighboringMonth {
  visibility: hidden !important;
  pointer-events: none !important;
  background: transparent !important;
  min-height: 40px !important;
  max-height: 56px !important;
  aspect-ratio: 1 !important;
  width: 100% !important;
}

/* Remove default neighboring month styling that might conflict */
.react-calendar__month-view__days__day--neighboringMonth abbr {
  visibility: hidden !important;
  color: transparent !important;
}

/* Weekend styling */
.react-calendar__month-view__days__day--weekend {
  color: #ef4444 !important;
}
.dark .react-calendar__month-view__days__day--weekend {
  color: #f87171 !important;
}

/* TODAY - Blue highlight */
.today-highlight {
  background: #3b82f6 !important;
  color: white !important;
  border-radius: 6px !important;
  font-weight: 700 !important;
  border-color: #2563eb !important;
}
.today-highlight abbr {
  color: white !important;
}
.today-highlight:hover {
  background: #2563eb !important;
}
.dark .today-highlight {
  background: #60a5fa !important;
  color: #1a1a1a !important;
}
.dark .today-highlight abbr {
  color: #1a1a1a !important;
}
.dark .today-highlight:hover {
  background: #93bbfc !important;
}

/* FUTURE - Grayed out */
.future-date {
  background: #f9fafb !important;
  color: #d1d5db !important;
  cursor: default !important;
  border-color: #e5e7eb !important;
}
.future-date abbr {
  color: #d1d5db !important;
}
.dark .future-date {
  background: #1f2937 !important;
  color: #4b5563 !important;
  border-color: #374151 !important;
}
.dark .future-date abbr {
  color: #4b5563 !important;
}

/* HOLIDAY - Very Light Pastel Pink */
.holiday-date {
  background: #fdf2f8 !important;
  color: #9d174d !important;
  border-color: #fbcfe8 !important;
  cursor: default !important;
}
.holiday-date abbr {
  color: #9d174d !important;
}
.dark .holiday-date {
  background: #831843 !important;
  color: #fdf2f8 !important;
  border-color: #be185d !important;
}
.dark .holiday-date abbr {
  color: #fdf2f8 !important;
}

/* STATUS - Present (Very Light Pastel Green) */
.status-present {
  background: #dcfce7 !important;
  color: #166534 !important;
  border-color: #86efac !important;
}
.status-present abbr {
  color: #166534 !important;
}
.status-present:hover {
  background: #86efac !important;
  transform: scale(1.02) !important;
}
.dark .status-present {
  background: #14532d !important;
  color: #dcfce7 !important;
  border-color: #22c55e !important;
}
.dark .status-present abbr {
  color: #dcfce7 !important;
}

/* STATUS - Absent (Very Light Pastel Red) */
.status-absent {
  background: #fee2e2 !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}
.status-absent abbr {
  color: #991b1b !important;
}
.status-absent:hover {
  background: #fca5a5 !important;
  transform: scale(1.02) !important;
}
.dark .status-absent {
  background: #7f1d1d !important;
  color: #fee2e2 !important;
  border-color: #dc2626 !important;
}
.dark .status-absent abbr {
  color: #fee2e2 !important;
}

/* STATUS - Late (Very Light Pastel Yellow) */
.status-late {
  background: #fef9c3 !important;
  color: #854d0e !important;
  border-color: #fde047 !important;
}
.status-late abbr {
  color: #854d0e !important;
}
.status-late:hover {
  background: #fde047 !important;
  transform: scale(1.02) !important;
}
.dark .status-late {
  background: #78350f !important;
  color: #fef9c3 !important;
  border-color: #eab308 !important;
}
.dark .status-late abbr {
  color: #fef9c3 !important;
}

/* STATUS - Half Day (Very Light Pastel Purple) */
.status-halfday {
  background: #f3e8ff !important;
  color: #6b21a8 !important;
  border-color: #d8b4fe !important;
}
.status-halfday abbr {
  color: #6b21a8 !important;
}
.status-halfday:hover {
  background: #d8b4fe !important;
  transform: scale(1.02) !important;
}
.dark .status-halfday {
  background: #4c1d95 !important;
  color: #f3e8ff !important;
  border-color: #8b5cf6 !important;
}
.dark .status-halfday abbr {
  color: #f3e8ff !important;
}

/* STATUS - Mixed (Very Light Pastel Indigo) */
.status-mixed {
  background: #e0e7ff !important;
  color: #3730a3 !important;
  border-color: #a5b4fc !important;
}
.status-mixed abbr {
  color: #3730a3 !important;
}
.status-mixed:hover {
  background: #a5b4fc !important;
  transform: scale(1.02) !important;
}
.dark .status-mixed {
  background: #1e1b4b !important;
  color: #e0e7ff !important;
  border-color: #6366f1 !important;
}
.dark .status-mixed abbr {
  color: #e0e7ff !important;
}

/* STATUS - Leave (Very Light Pastel Indigo) */
.status-leave {
  background: #e0e7ff !important;
  color: #3730a3 !important;
  border-color: #a5b4fc !important;
}
.status-leave abbr {
  color: #3730a3 !important;
}
.status-leave:hover {
  background: #a5b4fc !important;
  transform: scale(1.02) !important;
}
.dark .status-leave {
  background: #1e1b4b !important;
  color: #e0e7ff !important;
  border-color: #6366f1 !important;
}
.dark .status-leave abbr {
  color: #e0e7ff !important;
}

/* No Data - Light Gray */
.no-data-date {
  background: #f9fafb !important;
  color: #9ca3af !important;
  border-color: #e5e7eb !important;
  cursor: default !important;
}
.no-data-date abbr {
  color: #9ca3af !important;
}
.dark .no-data-date {
  background: #1f2937 !important;
  color: #6b7280 !important;
  border-color: #374151 !important;
}
.dark .no-data-date abbr {
  color: #6b7280 !important;
}

/* Tile Hover - only for clickable tiles */
.react-calendar__tile:not(.future-date):not(.holiday-date):not(.no-data-date):hover {
  transform: scale(1.05) !important;
  z-index: 10 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

/* Tile Active state */
.react-calendar__tile--active {
  transform: scale(1.05) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
  outline: 3px solid #3b82f6 !important;
  outline-offset: 2px !important;
}
  `}
                </style>
                <Calendar
                  value={null}
                  activeStartDate={selectedMonth}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (
                      selectedMonth.getMonth() !== activeStartDate.getMonth() ||
                      selectedMonth.getFullYear() !== activeStartDate.getFullYear()
                    ) {
                      setSelectedMonth(activeStartDate);
                    }
                  }}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  onClickDay={handleDayClick}
                  maxDetail="month"
                  minDetail="month"
                  formatDay={(locale, date) => date.getDate()}
                />

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-1">
                    Legend:
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-green-200 border border-green-400"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Present
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-red-200 border border-red-400"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Absent
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Late
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-purple-200 border border-purple-400"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Half Day
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-pink-200 border border-pink-400"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Holiday
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      No Data
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"></span>
                    <span className="text-gray-600 dark:text-gray-300">
                      Future
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Always visible */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-soft sticky top-4 max-h-[600px] overflow-y-auto">
              {/* Day Details View */}
              {showDayDetails ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      <i className="fas fa-calendar-day text-blue-500 mr-2"></i>
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </h4>
                    <button
                      onClick={() => {
                        setShowDayDetails(false);
                        setDayDetails(null);
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  {isDailyLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Loading day details...
                        </p>
                      </div>
                    </div>
                  ) : currentDayData ? (
                    <div className="space-y-3">
                      {/* Status and Basic Info */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Status
                          </p>
                          <div className="mt-0.5">
                            {getStatusBadge(
                              currentDayData.status ||
                              currentDayData.attendance_status,
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Worked Hours
                          </p>
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {formatWorkedHours(
                              currentDayData.worked_hours ||
                              currentDayData.working_hours ||
                              0,
                            )}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Punch In
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {currentDayData.punch_in ||
                              currentDayData.punchIn ||
                              "--"}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Punch Out
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {currentDayData.punch_out ||
                              currentDayData.punchOut ||
                              "--"}
                          </p>
                        </div>
                      </div>

                      {/* Overtime */}
                      <div className={`${currentDayData.overtime && currentDayData.overtime !== "-" && currentDayData.overtime !== "0" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-700/30 border-transparent"} border rounded-lg p-2`}>
                        <div className="flex items-center gap-2">
                          <i className={`fas fa-clock ${currentDayData.overtime && currentDayData.overtime !== "-" && currentDayData.overtime !== "0" ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}></i>
                          <span className={`text-sm font-semibold ${currentDayData.overtime && currentDayData.overtime !== "-" && currentDayData.overtime !== "0" ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                            Overtime:{" "}
                            {currentDayData.overtime && currentDayData.overtime !== "-" ? formatWorkedHours(currentDayData.overtime) : "0 hrs"}
                          </span>
                        </div>
                      </div>

                      {/* Daily Project Hours */}
                      {/* Daily Project Hours */}
                      {employeeDailyProjectHoursLoading ? (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <div className="flex justify-center py-2">
                            <i className="fas fa-spinner fa-spin text-blue-500"></i>
                            <span className="text-xs text-gray-500 ml-2">
                              Loading project hours...
                            </span>
                          </div>
                        </div>
                      ) : dailyProjectData ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                              <i className="fas fa-clock mr-1"></i>
                              Daily Project Hours
                            </p>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                              Total:{" "}
                              {dailyProjectData.total_formatted ||
                                formatWorkedHours(
                                  dailyProjectData.total_hours || 0,
                                )}
                            </span>
                          </div>
                          <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                            {dailyProjectData.projects
                              .filter((p) => (p.total_hours || 0) > 0)
                              .map((project, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-white/60 dark:bg-gray-700/30 px-2 py-1.5 rounded-lg"
                                >
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                                    {project.project_name ||
                                      `Project ${idx + 1}`}
                                  </span>
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                                    {project.formatted ||
                                      formatWorkedHours(
                                        project.total_hours || 0,
                                      )}
                                  </span>
                                </div>
                              ))}
                            {dailyProjectData.projects.filter(
                              (p) => (p.total_hours || 0) > 0,
                            ).length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  No project hours logged for this day
                                </p>
                              )}
                          </div>
                        </div>
                      ) : null}

                      {/* Notes */}
                      {currentDayData.notes && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Notes
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {currentDayData.notes}
                          </p>
                        </div>
                      )}

                      {/* Late reason */}
                      {currentDayData.late_by && currentDayData.late_by > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
                            <span className="text-sm text-yellow-700 dark:text-yellow-400">
                              Late by: {currentDayData.late_by} minutes
                              {currentDayData.late_reason &&
                                ` - ${currentDayData.late_reason}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <i className="fas fa-info-circle text-2xl mb-2 block"></i>
                      <p>No attendance data for this day</p>
                    </div>
                  )}
                </>
              ) : (
                // Monthly Summary - Default view
                <>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    <i className="fas fa-chart-bar text-blue-500 mr-2"></i>
                    Monthly Summary
                    {employeeMonthlyHours && (
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                        {employeeMonthlyHours.total_formatted ||
                          `${employeeMonthlyHours.total_hours || 0} hrs`}
                      </span>
                    )}
                  </h4>

                  {employeeMonthlyProjectHoursLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Loading monthly summary...
                        </p>
                      </div>
                    </div>
                  ) : employeeMonthlyHours ? (
                    <div className="space-y-3">
                      {/* Total Hours Card */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total Hours
                        </p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {employeeMonthlyHours.total_formatted ||
                            `${employeeMonthlyHours.total_hours || 0} hrs`}
                        </p>
                      </div>

                      {/* Project Breakdown */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Project Breakdown:
                        </p>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                          {employeeMonthlyHours.projects &&
                            employeeMonthlyHours.projects
                              .filter((p) => (p.total_hours || 0) > 0)
                              .map((project, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors"
                                >
                                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                                    {project.project_name ||
                                      `Project ${idx + 1}`}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                    {project.formatted ||
                                      formatWorkedHours(
                                        project.total_hours || 0,
                                      )}
                                  </span>
                                </div>
                              ))}
                          {(!employeeMonthlyHours.projects ||
                            employeeMonthlyHours.projects.filter(
                              (p) => (p.total_hours || 0) > 0,
                            ).length === 0) && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-4">
                                No project hours logged this month
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Click to view details hint */}
                      <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                        <i className="fas fa-hand-pointer mr-1"></i>
                        Click on a day in the calendar to view attendance
                        details
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <i className="fas fa-info-circle text-2xl mb-2 block"></i>
                      <p>No data available for this month</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeAttendancePage;
