import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  punchIn,
  punchOut,
  fetchDashboardData,
} from "../store/slices/attendanceSlice";
import PunchOutModal from "../components/modals/PunchOutModal";
import MapView from "../components/common/MapView";
import LocationModal from "../components/modals/LocationModal";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, dashboardData } = useSelector(
    (state) => state.EmpAttendance,
  );

  // Use dashboard data as source of truth (not Redux isPunchedIn)
  const todayAttendance = dashboardData?.today_attendance || {};
  const isActuallyPunchedIn =
    todayAttendance.punched_in === true && todayAttendance.punched_out !== true;
  const punchInTimeFromApi = todayAttendance.punch_in_time;
  const canPunch = dashboardData?.can_punch ?? true;

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chartRef = useRef(null);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [punchType, setPunchType] = useState("punch-in");
  const [punchOutData, setPunchOutData] = useState(null);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);

  // Show toast notification
  const showToastMessage = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Punch In/Out
  const handlePunch = async () => {
    if (!isActuallyPunchedIn) {
      if (!canPunch) {
        showToastMessage("❌ You cannot punch in at this time", "error");
        return;
      }
      // Show location verification modal for punch in
      setPunchType("punch-in");
      setShowLocationModal(true);
    } else {
      // For punch out, first show the punch out modal (tasks_completed, plan_tomorrow)
      setPunchType("punch-out");
      setShowPunchOutModal(true);
    }
  };

  // Handle location confirmation (for both punch in and punch out)
  const handleLocationConfirm = async (locationData) => {
    setShowLocationModal(false);
    setIsSubmitting(true);
    
    if (punchType === "punch-in") {
      // Punch in with location
      const result = await dispatch(punchIn({ location: locationData }));
      setIsSubmitting(false);
      
      if (punchIn.fulfilled.match(result)) {
        showToastMessage("✅ Punched in successfully with location verification!", "success");
        await dispatch(fetchDashboardData());
      } else {
        showToastMessage(result.payload || "❌ Punch in failed", "error");
      }
    } else {
      // For punch out, we have the form data from punchOutData
      if (punchOutData) {
        const result = await dispatch(punchOut({ 
          ...punchOutData, 
          location: locationData 
        }));
        setIsSubmitting(false);
        
        if (punchOut.fulfilled.match(result)) {
          showToastMessage("✅ Punched out successfully!", "success");
          setShowPunchOutModal(false);
          setPunchOutData(null);
          await dispatch(fetchDashboardData());
        } else {
          showToastMessage(result.payload || "❌ Punch out failed", "error");
        }
      }
    }
    
    setIsSubmitting(false);
  };

  // Handle punch out form submission (from PunchOutModal)
  const handlePunchOutSubmit = async (data) => {
    // Store the form data and show location modal
    setPunchOutData(data);
    setShowPunchOutModal(false);
    setShowLocationModal(true);
  };

  // Format punch time with proper timezone handling
  const formatPunchTime = (time) => {
    if (!time) return "—";
    try {
      let date;

      if (typeof time === "string" && time.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const now = new Date();
        const [hours, minutes, seconds] = time.split(":");
        date = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds),
        );
      } else if (typeof time === "string" && time.includes("T")) {
        date = new Date(time);
      } else if (time instanceof Date) {
        date = time;
      } else {
        date = new Date(time);
      }

      if (isNaN(date.getTime())) {
        return time;
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return time;
    }
  };

  // Prepare chart data from attendance history
  const getChartData = () => {
    if (
      !dashboardData?.attendance_history ||
      dashboardData.attendance_history.length === 0
    ) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Hours Worked",
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: "#2ecc71",
            borderRadius: 8,
            barPercentage: 0.6,
          },
        ],
      };
    }

    const last7Days = [];
    const hoursWorked = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      last7Days.push(dayName);

      const attendance = dashboardData.attendance_history.find(
        (a) => a.log_date === dateStr,
      );
      if (attendance && attendance.punch_in && attendance.punch_out) {
        const punchInTimeDate = new Date(attendance.punch_in);
        const punchOutTimeDate = new Date(attendance.punch_out);
        const hours = (punchOutTimeDate - punchInTimeDate) / (1000 * 60 * 60);
        hoursWorked.push(Math.round(hours * 10) / 10);
      } else {
        hoursWorked.push(0);
      }
    }

    return {
      labels: last7Days,
      datasets: [
        {
          label: "Hours Worked",
          data: hoursWorked,
          backgroundColor: "#2ecc71",
          borderRadius: 8,
          barPercentage: 0.6,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#2ecc71",
        callbacks: {
          label: (context) => {
            const hours = context.raw;
            return hours > 0 ? `${hours} hours` : "No data";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 9,
        title: { display: true, text: "Hours", font: { size: 11 } },
        ticks: { stepSize: 2 },
      },
      x: { ticks: { font: { size: 11 } } },
    },
  };

  // Get employee name
  const getEmployeeName = () => {
    if (dashboardData?.employee) {
      return `${dashboardData.employee.first_name} ${dashboardData.employee.last_name}`;
    }
    return user?.name || "User";
  };

  // Get employee role/ID
  const getEmployeeRole = () => {
    if (dashboardData?.employee) {
      return `Employee ID: ${dashboardData.employee.employee_id}`;
    }
    return user?.role?.name || user?.role || "Employee";
  };

  // Determine if button should be disabled
  const isButtonDisabled = () => {
    if (loading || isSubmitting) return true;
    if (!isActuallyPunchedIn && !canPunch) return true;
    return false;
  };

  // Get button text
  const getButtonText = () => {
    if (loading || isSubmitting) return "Processing...";
    return isActuallyPunchedIn ? "Punch Out" : "Punch In";
  };

  // Get status display
  const getStatusDisplay = () => {
    if (isActuallyPunchedIn) {
      return { text: "Punched In ✓", color: "text-green-500" };
    }
    if (todayAttendance.punched_out === true) {
      return { text: "Punched Out ✓", color: "text-blue-500" };
    }
    return { text: "Not Punched In", color: "text-red-500" };
  };

  const statusDisplay = getStatusDisplay();
  const displayPunchTime = punchInTimeFromApi || todayAttendance.punch_in_time;

  // Render location information from backend
  const renderLocationInfo = () => {
    const punchInLocation = todayAttendance.punch_in_location;
    const punchOutLocation = todayAttendance.punch_out_location;
    
    if (!punchInLocation && !punchOutLocation) return null;

    const handleShowMap = (location) => {
      setSelectedMapLocation(location);
      setShowLocationHistory(true);
    };

    return (
      <div className="location-info bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-7">
        <h3 className="text-base font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <i className="fas fa-map-marker-alt text-green-500"></i> 
          Today's Punch Locations
        </h3>
        
        {punchInLocation && (
          <div className="mb-3 pb-3 border-b border-[var(--border)]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-500">
                  <i className="fas fa-sign-in-alt mr-1"></i> Punch In Location:
                </p>
                <p className="text-sm text-[var(--text)] mt-1">
                  {punchInLocation.address || `${punchInLocation.latitude}, ${punchInLocation.longitude}`}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  📍 Coordinates: {punchInLocation.latitude?.toFixed(6)}, {punchInLocation.longitude?.toFixed(6)}
                </p>
              </div>
              <button
                onClick={() => handleShowMap(punchInLocation)}
                className="text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-lg hover:bg-green-500/20 transition-colors"
              >
                <i className="fas fa-map mr-1"></i> View Map
              </button>
            </div>
          </div>
        )}
        
        {punchOutLocation && (
          <div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-500">
                  <i className="fas fa-sign-out-alt mr-1"></i> Punch Out Location:
                </p>
                <p className="text-sm text-[var(--text)] mt-1">
                  {punchOutLocation.address || `${punchOutLocation.latitude}, ${punchOutLocation.longitude}`}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  📍 Coordinates: {punchOutLocation.latitude?.toFixed(6)}, {punchOutLocation.longitude?.toFixed(6)}
                </p>
              </div>
              <button
                onClick={() => handleShowMap(punchOutLocation)}
                className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <i className="fas fa-map mr-1"></i> View Map
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render map modal
  const renderMapModal = () => {
    if (!showLocationHistory || !selectedMapLocation) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--surface)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold">
              <i className="fas fa-map-marker-alt text-green-500 mr-2"></i>
              Location Map
            </h3>
            <button
              onClick={() => {
                setShowLocationHistory(false);
                setSelectedMapLocation(null);
              }}
              className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-[var(--text)] mb-3">
              {selectedMapLocation.address || `${selectedMapLocation.latitude}, ${selectedMapLocation.longitude}`}
            </p>
            <MapView
              latitude={selectedMapLocation.latitude}
              longitude={selectedMapLocation.longitude}
              address={selectedMapLocation.address}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowLocationHistory(false);
                  setSelectedMapLocation(null);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner bg-gradient-to-br from-green-600 to-green-500 rounded-xl p-5 md:p-7 mb-7 flex flex-col md:flex-row justify-between items-center gap-5">
        <div className="welcome-left flex items-center gap-5 flex-wrap">
          <div className="welcome-avatar w-16 h-16 rounded-xl overflow-hidden border-3 border-white shadow-lg bg-white flex items-center justify-center">
            <i className="fas fa-user text-green-600 text-3xl"></i>
          </div>
          <div className="welcome-text">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Welcome, {getEmployeeName()}! 👋
            </h2>
            <p className="text-white/90 text-xs md:text-sm">
              {getEmployeeRole()}
            </p>
          </div>
        </div>
        <div className="datetime-info text-center md:text-right text-white">
          <div className="time text-2xl md:text-3xl font-bold">
            {currentTime}
          </div>
          <div className="date text-xs opacity-90">{currentDate}</div>
        </div>
      </div>

      {/* Location Info from Backend */}
      {renderLocationInfo()}

      {/* Punch Card */}
      <div className="punch-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:p-6 mb-7 flex flex-col md:flex-row justify-between items-center gap-5">
        <div className="punch-stats flex gap-8 md:gap-10 flex-wrap justify-center">
          <div className="punch-item text-center">
            <div className="punch-label text-xs text-[var(--muted)] mb-2">
              Today's Date
            </div>
            <div className="punch-value text-sm font-semibold text-[var(--text)]">
              {currentDate}
            </div>
          </div>
          <div className="punch-item text-center">
            <div className="punch-label text-xs text-[var(--muted)] mb-2">
              Punch In Time
            </div>
            <div
              className={`punch-value text-2xl font-bold ${isActuallyPunchedIn ? "text-green-500" : "text-[var(--text)]"}`}
            >
              {formatPunchTime(displayPunchTime)}
            </div>
          </div>
          <div className="punch-item text-center">
            <div className="punch-label text-xs text-[var(--muted)] mb-2">
              Status
            </div>
            <div
              className={`punch-value text-lg font-bold ${statusDisplay.color}`}
            >
              {statusDisplay.text}
              {isActuallyPunchedIn && (
                <span className="ml-2 text-xs animate-pulse">●</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handlePunch}
          disabled={isButtonDisabled()}
          className="punch-btn bg-green-500 border-none text-white py-3 px-8 rounded-full font-semibold text-sm cursor-pointer transition-all flex items-center gap-2 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-fingerprint"></i>
          {getButtonText()}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-2 md:grid-cols-3 gap-5 mb-7">
        <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-center hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="stat-icon w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-2xl mx-auto mb-3">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-number text-3xl font-extrabold text-green-600">
            {dashboardData?.attendance_history?.filter(
              (a) => a.punch_in && a.punch_out,
            ).length || 0}
          </div>
          <div className="stat-label text-xs text-[var(--muted)]">
            Days Present
          </div>
        </div>
        <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-center hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="stat-icon w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl mx-auto mb-3">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-number text-3xl font-extrabold text-blue-500">
            {dashboardData?.leave_stats?.total_taken || 0}
          </div>
          <div className="stat-label text-xs text-[var(--muted)]">
            Leaves Taken
          </div>
        </div>
        <div className="stat-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-center hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="stat-icon w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl mx-auto mb-3">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-number text-3xl font-extrabold text-amber-500">
            {dashboardData?.leave_stats?.balance || 0}
          </div>
          <div className="stat-label text-xs text-[var(--muted)]">
            Leave Balance
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="chart-card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-7">
        <h3 className="text-base font-semibold text-[var(--text)] mb-5 flex items-center gap-2">
          <i className="fas fa-chart-line"></i> My Attendance (Last 7 Days)
        </h3>
        <div className="chart-container h-64 relative">
          <Bar ref={chartRef} data={getChartData()} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity Section */}
      {dashboardData?.attendance_history &&
        dashboardData.attendance_history.length > 0 && (
          <div className="recent-activity bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-base font-semibold text-[var(--text)] mb-5 flex items-center gap-2">
              <i className="fas fa-history"></i> Recent Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-[var(--muted)] font-semibold">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-[var(--muted)] font-semibold">
                      Punch In
                    </th>
                    <th className="text-left py-3 px-4 text-[var(--muted)] font-semibold">
                      Punch In Location
                    </th>
                    <th className="text-left py-3 px-4 text-[var(--muted)] font-semibold">
                      Punch Out
                    </th>
                    <th className="text-left py-3 px-4 text-[var(--muted)] font-semibold">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.attendance_history
                    .slice(0, 5)
                    .map((attendance, index) => {
                      const hours =
                        attendance.punch_in && attendance.punch_out
                          ? (
                              (new Date(attendance.punch_out) -
                                new Date(attendance.punch_in)) /
                              (1000 * 60 * 60)
                            ).toFixed(1)
                          : "-";
                      return (
                        <tr
                          key={index}
                          className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors"
                        >
                          <td className="py-3 px-4 text-[var(--text)]">
                            {attendance.log_date}
                          </td>
                          <td className="py-3 px-4 text-[var(--text)]">
                            {attendance.punch_in
                              ? formatPunchTime(attendance.punch_in)
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {attendance.punch_in_location && (
                              <div className="text-xs">
                                <i className="fas fa-map-marker-alt text-green-500 text-xs mr-1"></i>
                                <span className="text-[var(--muted)]" title={attendance.punch_in_location.address}>
                                  {attendance.punch_in_location.address?.substring(0, 40)}
                                  {attendance.punch_in_location.address?.length > 40 ? "..." : ""}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[var(--text)]">
                            {attendance.punch_out
                              ? formatPunchTime(attendance.punch_out)
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-[var(--text)] font-semibold">
                            {hours !== "-" ? `${hours} hrs` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Modals */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setPunchOutData(null);
        }}
        onConfirm={handleLocationConfirm}
        type={punchType}
      />

      <PunchOutModal
        isOpen={showPunchOutModal}
        onClose={() => {
          setShowPunchOutModal(false);
          setPunchOutData(null);
        }}
        onSubmit={handlePunchOutSubmit}
        loading={isSubmitting}
      />

      {/* Map Modal */}
      {renderMapModal()}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 bg-[var(--surface)] text-[var(--text)] py-3 px-5 rounded-full text-sm font-medium shadow-lg border-l-4 z-50 flex items-center gap-2 animate-slide-up ${
            toast.type === "success" ? "border-green-500" : "border-red-500"
          }`}
        >
          <i
            className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} ${toast.type === "success" ? "text-green-500" : "text-red-500"}`}
          ></i>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Dashboard;