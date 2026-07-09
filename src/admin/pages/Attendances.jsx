/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { showToast } from "../../components/common/Toast";
import {
  fetchAttendanceRecords,
  fetchPunchInToday,
  fetchPunchInYesterday,
  fetchPunchOutToday,
  fetchLateComers,
  fetchAbsentees,
  fetchAttendanceStats,
} from "../store/slices/attendanceSlice";
import { fetchEmployees } from "../store/slices/employeeSlice";

// Helper function to get status color
const getStatusColor = (status) => {
  if (!status) return "bg-gray-200 dark:bg-gray-600";

  const statusLower = status.toLowerCase();
  if (statusLower === "present") return "bg-green-500";
  if (statusLower === "absent" || statusLower === "absentee")
    return "bg-red-500";
  if (statusLower === "late") return "bg-yellow-500";
  if (statusLower === "half day") return "bg-blue-500";
  if (statusLower === "leave") return "bg-purple-500";
  if (statusLower === "holiday") return "bg-pink-500";
  return "bg-gray-400";
};

// Helper to parse date from DD/MM/YYYY to Date object
const parseDateFromString = (dateStr) => {
  if (!dateStr) return null;

  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  return null;
};

// Helper to format date to DD/MM/YYYY for comparison
const formatDateToDDMMYYYY = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to format date from YYYY-MM-DD to DD/MM/YYYY
const formatDateToDisplay = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

const Attendances = () => {
  const dispatch = useDispatch();
  const { records, punchInToday, lateComers, absentees, loading, stats } =
    useSelector((state) => state.attendance);
  const { employees } = useSelector(
    (state) => state.employees || { employees: [] },
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [dayData, setDayData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const [pendingDayModal, setPendingDayModal] = useState(false);
  const calendarRef = useRef(null);

  // Get unique employees for filter
  // Get unique employees for filter
const uniqueEmployeesMap = new Map();

records.forEach((record) => {
  // Get employee name from record
  let name = record.name || record.employee_name || record.employeeName;
  if (!name && record.user) {
    if (record.user.employee) {
      name =
        `${record.user.employee.first_name || ""} ${record.user.employee.last_name || ""}`.trim() ||
        record.user.employee.employee_id;
    }
    if (!name && record.user.username) {
      name = record.user.username;
    }
  }
  
  const id =
    record.employee_id ||
    record.user_id ||
    record.userid ||
    record.id ||
    record.user?.id;
  
  const employeeName = name || `Employee #${record.employee_id || record.id}`;
  
  // Use the employee name as the key to deduplicate
  // This ensures each employee appears only once
  if (id && employeeName && !uniqueEmployeesMap.has(employeeName)) {
    uniqueEmployeesMap.set(employeeName, { id, name: employeeName });
  }
});

const uniqueEmployees = Array.from(uniqueEmployeesMap.values());
  // Fetch attendance data on mount and when month changes
  useEffect(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    const monthParam = `${year}-${String(month).padStart(2, "0")}`;

    dispatch(
      fetchAttendanceRecords({
        page: 1,
        per_page: 1000,
        month: monthParam,
      }),
    );

    dispatch(fetchAttendanceStats());
    dispatch(fetchPunchInToday());
    dispatch(fetchPunchInYesterday());
    dispatch(fetchPunchOutToday());
    dispatch(fetchLateComers());
    dispatch(fetchAbsentees());
    dispatch(fetchEmployees());

    if (pendingDate && pendingDayModal) {
      const dateStr = formatDateToDDMMYYYY(pendingDate);
    }
  }, [dispatch, selectedMonth]);

  useEffect(() => {
    if (pendingDate && pendingDayModal) {
      const dateStr = formatDateToDDMMYYYY(pendingDate);
      const dayRecords = records.filter((r) => {
        const recordDate = r.date || r.log_date || r.attendance_date;
        return (
          recordDate === dateStr || formatDateToDDMMYYYY(recordDate) === dateStr
        );
      });

      if (dayRecords.length > 0) {
        setDayData(dayRecords);
        setSelectedDate(pendingDate);
        setShowDayModal(true);
        setPendingDayModal(false);
        setPendingDate(null);
      } else {
        setPendingDayModal(false);
        setPendingDate(null);
      }
    }
  }, [records, pendingDate, pendingDayModal]);

  // Process records for calendar
  const getDayStatus = (date) => {
    const dateStr = formatDateToDDMMYYYY(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate > today) {
      return { status: "future", count: 0, records: [] };
    }

    const dayRecords = records.filter((r) => {
      const recordDate = r.date || r.log_date || r.attendance_date;
      return (
        recordDate === dateStr || formatDateToDDMMYYYY(recordDate) === dateStr
      );
    });

    if (dayRecords.length === 0) {
      return { status: "no-data", count: 0, records: [] };
    }

    const statuses = dayRecords.map((r) => {
      const status = (r.status || r.attendance_status || "").toLowerCase();
      if (status === "present" || status === "ontime" || status === "on time")
        return "present";
      if (status === "late") return "late";
      if (status === "absent" || status === "absentee") return "absent";
      if (status === "half day") return "halfday";
      if (status === "leave") return "leave";
      if (status === "holiday") return "holiday";

      if (
        r.punch_in &&
        r.punch_in !== "--" &&
        r.punch_in !== "-" &&
        r.punch_in !== ""
      ) {
        if (r.late_by && r.late_by > 0) return "late";
        if (status === "late") return "late";
        return "present";
      }
      return "absent";
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

  const getEmployeeAvatarUrl = (record, employees) => {
    if (!employees || !employees.length) return null;

    const employeeId =
      record.employee_id || record.user_id || record.userid || record.id;

    const employee = employees.find((e) => {
      const empId = e.id || e.employee_id || e.user_id;
      return (
        String(empId) === String(employeeId) ||
        String(e.employee_id) === String(employeeId) ||
        String(e.user_id) === String(employeeId)
      );
    });

    if (!employee) {
      const empName = getEmployeeName(record);
      if (empName) {
        const nameMatch = employees.find((e) => {
          const fullName = `${e.first_name || ""} ${e.last_name || ""}`.trim();
          return fullName === empName || e.name === empName;
        });
        if (nameMatch) {
          const avatarValue = nameMatch.avatar || nameMatch.avatar_path;
          return getAvatarUrlFromValue(avatarValue);
        }
      }
      return null;
    }

    const avatarValue =
      employee.avatar ||
      employee.avatar_path ||
      employee.photo ||
      employee.profile_photo;
    return getAvatarUrlFromValue(avatarValue);
  };

  const getAvatarUrlFromValue = (avatarValue) => {
    if (!avatarValue) return null;

    if (typeof avatarValue === "object" && avatarValue.path) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
      return `${baseUrl}/storage/${avatarValue.path}`;
    }

    if (typeof avatarValue === "string") {
      if (avatarValue.startsWith("/tmp/")) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
        return `${baseUrl}/storage/temp/${avatarValue.replace("/tmp/", "")}`;
      }
      if (avatarValue.startsWith("data:")) return avatarValue;
      if (avatarValue.startsWith("http")) return avatarValue;

      const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
      if (avatarValue.startsWith("/storage/")) {
        return `${baseUrl}${avatarValue}`;
      }
      if (
        avatarValue.startsWith("avatars/") ||
        avatarValue.startsWith("employees/") ||
        avatarValue.startsWith("photos/")
      ) {
        return `${baseUrl}/storage/${avatarValue}`;
      }
      return `${baseUrl}/storage/${avatarValue}`;
    }

    return null;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // COMPACT CALENDAR - Smaller tiles and dots
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const dayInfo = getDayStatus(date);
    if (dayInfo.status === "no-data" || dayInfo.status === "future")
      return null;

    return (
      <div className="flex justify-center mt-0.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(dayInfo.status)}`}
        ></div>
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const dayInfo = getDayStatus(date);
    const today = isToday(date);

    let classes = "transition-colors text-xs";

    if (today) {
      classes +=
        " today-highlight !bg-green-500 !text-white hover:!bg-green-600 rounded-md";
      return classes;
    }

    if (dayInfo.status === "future") {
      return classes + " text-gray-300 dark:text-gray-600";
    }

    if (dayInfo.status !== "no-data") {
      classes += " hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md";
      if (dayInfo.status === "present")
        classes += " bg-green-50 dark:bg-green-900/20";
      else if (dayInfo.status === "absent")
        classes += " bg-red-50 dark:bg-red-900/20";
      else if (dayInfo.status === "late")
        classes += " bg-yellow-50 dark:bg-yellow-900/20";
      else if (dayInfo.status === "mixed")
        classes += " bg-blue-50 dark:bg-blue-900/20";
      else if (dayInfo.status === "halfday")
        classes += " bg-purple-50 dark:bg-purple-900/20";
      else if (dayInfo.status === "leave")
        classes += " bg-pink-50 dark:bg-pink-900/20";
      else if (dayInfo.status === "holiday")
        classes += " bg-indigo-50 dark:bg-indigo-900/20";
    }

    return classes;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (date) => {
    const dateStr = formatDateToDDMMYYYY(date);
    const currentMonth = selectedMonth.getMonth();
    const clickedMonth = date.getMonth();

    if (clickedMonth !== currentMonth) {
      setSelectedMonth(date);
      setPendingDate(date);
      setPendingDayModal(true);
      return;
    }

    const dayRecords = records.filter((r) => {
      const recordDate = r.date || r.log_date || r.attendance_date;
      return (
        recordDate === dateStr || formatDateToDDMMYYYY(recordDate) === dateStr
      );
    });

    if (dayRecords.length === 0) {
      return;
    }

    setDayData(dayRecords);
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const handleMonthClick = () => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, "0");
    const monthRecords = records.filter((r) => {
      const dateStr = r.date || r.log_date || r.attendance_date;
      if (!dateStr) return false;

      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const recordMonth = parts[1];
          const recordYear = parts[2];
          return recordMonth === month && recordYear === String(year);
        }
      }

      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const recordMonth = parts[1];
          const recordYear = parts[0];
          return recordMonth === month && recordYear === String(year);
        }
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return (
          date.getMonth() + 1 === parseInt(month) && date.getFullYear() === year
        );
      }

      return false;
    });

    setMonthData(monthRecords);
    setShowMonthModal(true);
  };

  const getRecordStatus = (record) => {
    if (record.status) {
      const status = record.status.toLowerCase();
      if (status === "present" || status === "ontime" || status === "on time")
        return "Present";
      if (status === "late") return "Late";
      if (status === "absent" || status === "absentee") return "Absent";
    }

    if (
      record.punch_in &&
      record.punch_in !== "--" &&
      record.punch_in !== "-" &&
      record.punch_in !== ""
    ) {
      if (record.lateBy && record.lateBy > 0) return "Late";
      if (record.status && record.status.toLowerCase() === "late")
        return "Late";
      return "Present";
    }
    return "Absent";
  };

  const getEmployeeName = (record) => {
    let name = record.name || record.employee_name || record.employeeName;
    if (!name && record.user) {
      if (record.user.employee) {
        name =
          `${record.user.employee.first_name || ""} ${record.user.employee.last_name || ""}`.trim() ||
          record.user.employee.employee_id;
      }
      if (!name && record.user.username) {
        name = record.user.username;
      }
    }
    return (
      name || `Employee #${record.employee_id || record.user_id || record.id}`
    );
  };

  const filteredMonthData =
    employeeFilter === "all"
      ? monthData
      : monthData.filter((r) => {
          const empId =
            r.employee_id || r.user_id || r.userid || r.id || r.user?.id;
          return String(empId) === String(employeeFilter);
        });

  const getEmployeeNamesForStats = (records, status) => {
    if (!records || records.length === 0) return [];

    let filteredRecords = records.filter((r) => {
      const recordStatus = getRecordStatus(r);
      if (status === "present") return recordStatus === "Present";
      if (status === "late") return recordStatus === "Late";
      if (status === "absent") return recordStatus === "Absent";
      return false;
    });

    const names = [...new Set(filteredRecords.map((r) => getEmployeeName(r)))];
    return names;
  };

  const totalEmployees =
    stats?.totalActiveEmployees || stats?.total_employees || 0;
  const punchedInCount = stats?.presentToday || stats?.present_today || 0;
  const lateTodayCount =
    stats?.punchedLate || stats?.lateToday || stats?.late_today || 0;
  const absentTodayCount = stats?.absentToday || stats?.absent_today || 0;
  const punchOutCount = stats?.punchedOutToday || stats?.punched_out_today || 0;

  const todayStr = formatDateToDDMMYYYY(new Date());
  const todayRecords = records.filter((r) => {
    const recordDate = r.date || r.log_date || r.attendance_date;
    return (
      recordDate === todayStr || formatDateToDDMMYYYY(recordDate) === todayStr
    );
  });

  const presentEmployeesFromStats =
    stats?.punchedInEmployees?.map((emp) => emp.name) || [];
  const lateEmployeesFromStats =
    stats?.lateEmployees?.map((emp) => emp.name) || [];
  const absentEmployeesFromStats =
    stats?.absentEmployees?.map((emp) => emp.name) || [];

  const presentEmployees =
    presentEmployeesFromStats.length > 0
      ? presentEmployeesFromStats
      : getEmployeeNamesForStats(todayRecords, "present");
  const lateEmployees =
    lateEmployeesFromStats.length > 0
      ? lateEmployeesFromStats
      : getEmployeeNamesForStats(todayRecords, "late");
  const absentEmployees =
    absentEmployeesFromStats.length > 0
      ? absentEmployeesFromStats
      : getEmployeeNamesForStats(todayRecords, "absent");

  const getDepartment = (record) => {
    if (record.department) return record.department;
    if (record.user?.department?.name) return record.user.department.name;
    return "-";
  };

  // Tooltip component with clickable "Show more"
  const TooltipCard = ({ title, employees, color, icon }) => {
    const [showAll, setShowAll] = useState(false);
    const displayCount = 5;
    const hasMore = employees && employees.length > displayCount;
    const displayEmployees = showAll
      ? employees
      : (employees || []).slice(0, displayCount);

    if (!employees || employees.length === 0) {
      return (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            No {title.toLowerCase()} employees
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 max-h-[300px] overflow-y-auto scrollbar-thin">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
          <i className={`fas ${icon} mr-1`} style={{ color: color }}></i>
          {title} ({employees.length}):
        </p>
        <ul className="space-y-0.5">
          {displayEmployees.map((name, idx) => (
            <li
              key={idx}
              className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              {name}
            </li>
          ))}
          {hasMore && (
            <li className="mt-1">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                <i
                  className={`fas ${showAll ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}
                ></i>
                {showAll
                  ? "Show less"
                  : `Show ${employees.length - displayCount} more...`}
              </button>
            </li>
          )}
        </ul>
      </div>
    );
  };

  // ─── INDIVIDUAL STAT CARDS WITH THEIR OWN TOOLTIPS ──────────────────────

  const PunchedInCard = ({ employees }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    let timeoutId = useRef(null);
    const count = employees?.length || 0;

    const handleMouseEnter = () => {
      clearTimeout(timeoutId.current);
      setShowTooltip(true);
    };

    const handleMouseLeave = () => {
      timeoutId.current = setTimeout(() => {
        setShowTooltip(false);
      }, 300);
    };

    useEffect(() => {
      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
      };
    }, []);

    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 md:p-3 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft cursor-pointer">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-1">
            <i className="fas fa-fingerprint text-blue-600 dark:text-blue-400 text-xs md:text-sm"></i>
          </div>
          <div className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
            {count}
          </div>
          <div className="text-[8px] md:text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
            Punched In
          </div>
        </div>

        {showTooltip && count > 0 && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700"></div>
            <TooltipCard
              title="Present"
              employees={employees}
              color="#22c55e"
              icon="fa-check-circle"
            />
          </div>
        )}
      </div>
    );
  };

  const LateCard = ({ employees }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    let timeoutId = useRef(null);
    const count = employees?.length || 0;

    const handleMouseEnter = () => {
      clearTimeout(timeoutId.current);
      setShowTooltip(true);
    };

    const handleMouseLeave = () => {
      timeoutId.current = setTimeout(() => {
        setShowTooltip(false);
      }, 300);
    };

    useEffect(() => {
      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
      };
    }, []);

    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 md:p-3 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft cursor-pointer">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-1">
            <i className="fas fa-clock text-amber-600 dark:text-amber-400 text-xs md:text-sm"></i>
          </div>
          <div className="text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400">
            {count}
          </div>
          <div className="text-[8px] md:text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
            Late
          </div>
        </div>

        {showTooltip && count > 0 && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700"></div>
            <TooltipCard
              title="Late"
              employees={employees}
              color="#eab308"
              icon="fa-clock"
            />
          </div>
        )}
      </div>
    );
  };

  const AbsentCard = ({ employees }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    let timeoutId = useRef(null);
    const count = employees?.length || 0;

    const handleMouseEnter = () => {
      clearTimeout(timeoutId.current);
      setShowTooltip(true);
    };

    const handleMouseLeave = () => {
      timeoutId.current = setTimeout(() => {
        setShowTooltip(false);
      }, 300);
    };

    useEffect(() => {
      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
      };
    }, []);

    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 md:p-3 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft cursor-pointer">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-1">
            <i className="fas fa-user-slash text-red-600 dark:text-red-400 text-xs md:text-sm"></i>
          </div>
          <div className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">
            {count}
          </div>
          <div className="text-[8px] md:text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
            Absent
          </div>
        </div>

        {showTooltip && count > 0 && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700"></div>
            <TooltipCard
              title="Absent"
              employees={employees}
              color="#ef4444"
              icon="fa-user-slash"
            />
          </div>
        )}
      </div>
    );
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
    const today = new Date();
    setSelectedMonth(today);
    setSelectedDate(today);
  };

  return (
    <div className="w-full overflow-x-hidden px-3 py-3 md:px-4 md:py-4">
      {/* Compact Header */}
      <div className="flex flex-wrap justify-between items-center mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent flex items-center gap-2">
          <i className="fas fa-calendar-alt text-green-500 text-sm"></i>
          Attendance
          <span className="text-[9px] md:text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
            {selectedMonth.toLocaleString("default", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </h2>
      </div>

      {/* Compact Stats Cards */}
      <div className="stats-grid grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 md:p-3 border border-gray-200 dark:border-gray-700">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-0.5 md:mb-1">
            <i className="fas fa-users text-green-600 dark:text-green-400 text-[10px] md:text-sm"></i>
          </div>
          <div className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">
            {totalEmployees}
          </div>
          <div className="text-[7px] md:text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
            Total
          </div>
        </div>

        <PunchedInCard employees={presentEmployees} />
        <LateCard employees={lateEmployees} />
        <AbsentCard employees={absentEmployees} />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 md:p-3 border border-gray-200 dark:border-gray-700">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-0.5 md:mb-1">
            <i className="fas fa-sign-out-alt text-purple-600 dark:text-purple-400 text-[10px] md:text-sm"></i>
          </div>
          <div className="text-base md:text-lg font-bold text-purple-600 dark:text-purple-400">
            {punchOutCount}
          </div>
          <div className="text-[7px] md:text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
            Punched Out
          </div>
        </div>
      </div>

      {/* Compact Calendar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 md:p-3">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="fas fa-chevron-left text-gray-600 dark:text-gray-400 text-xs"></i>
          </button>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[100px] text-center">
            {selectedMonth.toLocaleString("default", {
              month: "short",
              year: "numeric",
            })}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="fas fa-chevron-right text-gray-600 dark:text-gray-400 text-xs"></i>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMonthClick}
            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <i className="fas fa-list mr-0.5 text-[8px]"></i> List
          </button>
        </div>
      </div>

      {/* COMPACT CALENDAR */}
      {loading && records.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-green-500 mb-2"></i>
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 shadow-soft">
          <style>
            {`
              .react-calendar {
                width: 100% !important;
                border: none !important;
                background: transparent !important;
                font-family: inherit !important;
              }
              .react-calendar__navigation {
                display: none !important;
              }
              .react-calendar__month-view__weekdays {
                color: #6b7280 !important;
                font-weight: 600 !important;
                font-size: 0.6rem !important;
                text-transform: uppercase !important;
              }
              .react-calendar__month-view__weekdays__weekday {
                padding: 0.25rem 0 !important;
              }
              .react-calendar__month-view__weekdays abbr {
                text-decoration: none !important;
                cursor: default !important;
                font-size: 0.6rem !important;
              }
              .react-calendar__tile {
                padding: 0.25rem 0 !important;
                border-radius: 4px !important;
                transition: all 0.2s ease !important;
                position: relative !important;
                aspect-ratio: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                background: transparent !important;
                color: inherit !important;
                min-height: 28px !important;
                max-height: 40px !important;
                border: 1px solid #e5e7eb !important;
              }
              .react-calendar__tile:hover {
                transform: scale(1.02) !important;
                z-index: 1 !important;
                background: #f3f4f6 !important;
              }
              .dark .react-calendar__tile {
                border-color: #374151 !important;  
              }
              .dark .react-calendar__tile:hover {
                background: #374151 !important;
              }
              .react-calendar__tile--active {
                background: #2ecc71 !important;
                color: white !important;
              }
              .react-calendar__tile--active:hover {
                background: #27ae60 !important;
              }
              .react-calendar__tile--now {
                background: transparent !important;
                border: none !important;
                color: inherit !important;
              }
              .react-calendar__tile abbr {
                font-size: 0.7rem !important;
                font-weight: 500 !important;
              }
              .react-calendar__month-view__days__day--weekend {
                color: #ef4444 !important;
              }
              .dark .react-calendar__month-view__days__day--weekend {
                color: #f87171 !important;
              }
              .react-calendar__month-view__days__day--neighboringMonth {
                color: #9ca3af !important;
              }
              .today-highlight {
                background: #22c55e !important;
                color: white !important;
                border-radius: 4px !important;
                font-weight: 700 !important;
              }
              .today-highlight:hover {
                background: #16a34a !important;
                color: white !important;
              }
              .today-highlight abbr {
                color: white !important;
              }
              .dark .today-highlight {
                background: #34d399 !important;
                color: #1a1a1a !important;
              }
              .dark .today-highlight:hover {
                background: #2dd4bf !important;
              }
              .dark .today-highlight abbr {
                color: #1a1a1a !important;
              }
              .scrollbar-thin::-webkit-scrollbar {
                width: 3px;
              }
              .scrollbar-thin::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollbar-thin::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 10px;
              }
              .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                background: #4b5563;
              }
            `}
          </style>
          <Calendar
            ref={calendarRef}
            value={null}
            activeStartDate={selectedMonth}
            onActiveStartDateChange={({ activeStartDate }) => {
              setSelectedMonth(activeStartDate);
            }}
            tileContent={tileContent}
            tileClassName={tileClassName}
            onClickDay={handleDayClick}
            maxDetail="month"
            minDetail="month"
            formatDay={(locale, date) => date.getDate()}
          />
        </div>
      )}

      {/* Compact Legend and Summary */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2.5">
          <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <i className="fas fa-chart-pie text-green-500 mr-1"></i> Summary
          </h4>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="text-center p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                {
                  records.filter((r) => {
                    const status = getRecordStatus(r);
                    return status === "Present";
                  }).length
                }
              </div>
              <div className="text-[8px] text-gray-500">Present</div>
            </div>
            <div className="text-center p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                {
                  records.filter((r) => {
                    const status = getRecordStatus(r);
                    return status === "Absent";
                  }).length
                }
              </div>
              <div className="text-[8px] text-gray-500">Absent</div>
            </div>
            <div className="text-center p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {
                  records.filter((r) => {
                    const status = getRecordStatus(r);
                    return status === "Late";
                  }).length
                }
              </div>
              <div className="text-[8px] text-gray-500">Late</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2.5">
          <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            <i className="fas fa-info-circle text-blue-500 mr-1"></i> Tips
          </h4>
          <ul className="text-[8px] md:text-[9px] text-gray-600 dark:text-gray-400 space-y-0.5">
            <li>• Hover stats cards to see employee names</li>
            <li>• Click a day to view attendance details</li>
            <li>• Click "List" to see all monthly records</li>
          </ul>
        </div>
      </div>

      {/* Day Modal - Keep same but compact */}
      {showDayModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDayModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                <i className="fas fa-calendar-day text-green-500 mr-2"></i>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500 text-sm"></i>
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dayData.map((record, idx) => {
                  const status = getRecordStatus(record);
                  const statusColor =
                    status === "Present"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : status === "Late"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";

                  const employeeName = getEmployeeName(record);
                  const avatarUrl = getEmployeeAvatarUrl(record, employees);
                  const initials = getInitials(employeeName);

                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={employeeName}
                              className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallback =
                                  e.target.parentElement.querySelector(
                                    `.avatar-fallback-day-${idx}`,
                                  );
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0 avatar-fallback-day-${idx}`}
                            style={{ display: avatarUrl ? "none" : "flex" }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                              {employeeName}
                            </p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400">
                              {getDepartment(record)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${statusColor}`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mt-1.5 text-[9px]">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            In
                          </span>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">
                            {record.punch_in || record.punchIn || "--"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Out
                          </span>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">
                            {record.punch_out || record.punchOut || "--"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Hrs
                          </span>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">
                            {record.worked_hours ||
                              record.working_hours ||
                              record.workingHours ||
                              "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-center text-[9px] text-gray-500 dark:text-gray-400">
                Total: {dayData.length} employees
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDayModal(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month Modal - Keep same but compact */}
      {showMonthModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMonthModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                <i className="fas fa-calendar-alt text-green-500 mr-2"></i>
                {selectedMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                - Records
              </h3>
              <button
                onClick={() => setShowMonthModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500 text-sm"></i>
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[70vh]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  <i className="fas fa-filter text-green-500 mr-1"></i> Filter:
                </label>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                >
                  <option value="all">All Employees</option>
                  {uniqueEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {filteredMonthData.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        #
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        Employee
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        Dept
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        In
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        Out
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        Hrs
                      </th>
                      <th className="px-2 py-1.5 text-left text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthData.length > 0 ? (
                      filteredMonthData.map((record, idx) => {
                        const status = getRecordStatus(record);
                        const statusColor =
                          status === "Present"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : status === "Late"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";

                        return (
                          <tr
                            key={idx}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-2 py-1.5 text-[9px] text-gray-600 dark:text-gray-400">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-1.5 text-[9px] text-gray-600 dark:text-gray-400">
                              {record.date ||
                                record.log_date ||
                                record.attendance_date ||
                                "-"}
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const empName = getEmployeeName(record);
                                  const avatarUrl = getEmployeeAvatarUrl(
                                    record,
                                    employees,
                                  );
                                  const initials = getInitials(empName);
                                  const avatarIdx = `month-${idx}`;

                                  return (
                                    <>
                                      {avatarUrl ? (
                                        <img
                                          src={avatarUrl}
                                          alt={empName}
                                          className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                            const fallback =
                                              e.target.parentElement.querySelector(
                                                `.avatar-fallback-${avatarIdx}`,
                                              );
                                            if (fallback)
                                              fallback.style.display = "flex";
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className={`w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0 avatar-fallback-${avatarIdx}`}
                                        style={{
                                          display: avatarUrl ? "none" : "flex",
                                        }}
                                      >
                                        {initials}
                                      </div>
                                      <span className="text-[9px] font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                                        {empName}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-[9px] text-gray-600 dark:text-gray-400 truncate max-w-[60px]">
                              {getDepartment(record)}
                            </td>
                            <td className="px-2 py-1.5 text-[9px] font-medium text-gray-700 dark:text-gray-300">
                              {record.punch_in || record.punchIn || "--"}
                            </td>
                            <td className="px-2 py-1.5 text-[9px] font-medium text-gray-700 dark:text-gray-300">
                              {record.punch_out || record.punchOut || "--"}
                            </td>
                            <td className="px-2 py-1.5 text-[9px] text-gray-600 dark:text-gray-400">
                              {record.worked_hours ||
                                record.working_hours ||
                                record.workingHours ||
                                "--"}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${statusColor}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-xs"
                        >
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                <i className="fas fa-info-circle mr-0.5"></i>
                {filteredMonthData.length} records •{" "}
                {
                  new Set(
                    filteredMonthData.map(
                      (r) => r.employee_id || r.user_id || r.id,
                    ),
                  ).size
                }{" "}
                employees
              </div>
              <button
                onClick={() => setShowMonthModal(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendances;
