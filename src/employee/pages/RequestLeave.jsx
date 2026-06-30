import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addLeaveRequest,
  fetchEmployeeLeaves,
  fetchLeaveBalance,
} from "../store/slices/leavesSlice";
import {
  FiChevronRight,
  FiCalendar,
  FiMessageSquare,
  FiPaperclip,
  FiSend,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { MdCalculate } from "react-icons/md";
import apiClient from "../../utils/apiClient";
import DateInput from "../../admin/components/common/DateInput";

const RequestLeave = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const leavesState = useSelector((state) => state.EmpLeaves);

  // Add safety defaults
  const leaveBalances = leavesState?.leaveBalances || {};
  const submitting = leavesState?.submitting || false;
  const error = leavesState?.error || null;

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [totalDays, setTotalDays] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const [leaveDuration, setLeaveDuration] = useState("full");

  // Get Annual Leave balance specifically (using leave_type_id: 1)
  const annualLeaveBalance = leaveBalances["Annual Leave"] ||
    leaveBalances.total || { allocated: 0, taken: 0, pending: 0, remaining: 0 };

  // Fetch leaves and balance on mount
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchEmployeeLeaves());
      await dispatch(fetchLeaveBalance());
    };
    fetchData();
  }, [dispatch]);

  // Debug function
  const debugBackendBalance = async () => {
    try {
      const response = await apiClient.get("/employee/leave-balance");
      console.log("Backend leave balance check:", response.data);
    } catch (error) {
      console.error("Backend balance check error:", error);
    }
  };

  useEffect(() => {
    debugBackendBalance();
  }, []);

  // Calculate days when dates change
  useEffect(() => {
    calculateDays();
  }, [formData.start_date, formData.end_date, leaveDuration]);

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const from = new Date(formData.start_date);
      const to = new Date(formData.end_date);
      if (to >= from) {
        let days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
        // If half day and single day, days = 0.5
        if (leaveDuration === "half") {
          if (days === 1) {
            days = 0.5;
          } else {
            // For multiple days half-day (e.g., half-day on last day)
            days = days - 0.5;
          }
        }
        setTotalDays(days);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  };

  const handleStartDateChange = (dateValue) => {
    setFormData({ ...formData, start_date: dateValue });
    if (
      formData.end_date &&
      dateValue &&
      new Date(formData.end_date) < new Date(dateValue)
    ) {
      setFormData((prev) => ({ ...prev, end_date: "" }));
    }
  };

  const handleEndDateChange = (dateValue) => {
    setFormData({ ...formData, end_date: dateValue });
  };

  const validateForm = () => {
    if (!formData.start_date) {
      setLocalError("Please select start date");
      return false;
    }
    if (!formData.end_date) {
      setLocalError("Please select end date");
      return false;
    }
    if (totalDays <= 0) {
      setLocalError(
        "Please select valid dates (end date must be after start date)",
      );
      return false;
    }
    if (formData.reason.length < 10) {
      setLocalError("Please provide a reason (minimum 10 characters)");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!validateForm()) {
      return;
    }

    if (
      totalDays > annualLeaveBalance.remaining &&
      annualLeaveBalance.remaining >= 0
    ) {
      setLocalError(
        `Requested days (${totalDays}) exceed available Annual Leave balance (${annualLeaveBalance.remaining} days)`,
      );
      return;
    }

    const formDataToSend = new FormData();
    // CHANGE THIS LINE: Use "1" for Annual Leave instead of "2"
    formDataToSend.append("leave_type_id", "1");  // Changed from "2" to "1"
    formDataToSend.append("start_date", formData.start_date);
    formDataToSend.append("end_date", formData.end_date);
    formDataToSend.append("reason", formData.reason);
    formDataToSend.append("claim_salary", "0");

    // Add half-day information
    formDataToSend.append("duration_type", leaveDuration); // "full" or "half"
    formDataToSend.append("duration_days", totalDays.toString());

    const currentYear = new Date().getFullYear();
    formDataToSend.append("year", currentYear.toString());

    if (selectedFile) {
      formDataToSend.append("document", selectedFile);
    }

    console.log("Submitting leave request with payload:");
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    const result = await dispatch(addLeaveRequest(formDataToSend));

    if (addLeaveRequest.fulfilled.match(result)) {
      await dispatch(fetchEmployeeLeaves());
      await dispatch(fetchLeaveBalance());
      navigate("/employee/leaves");
    }
  };

  const remaining = annualLeaveBalance?.remaining ?? 0;
  const usedLeaves = annualLeaveBalance?.taken ?? 0;
  const pendingLeaves = annualLeaveBalance?.pending ?? 0;
  const allocatedLeaves = annualLeaveBalance?.allocated ?? 0;
  const exceedsBalance = totalDays > remaining && remaining >= 0;

  useEffect(() => {
    console.log("Annual Leave Balance:", annualLeaveBalance);
    console.log("Leave Balances from store:", leaveBalances);
  }, [leaveBalances, annualLeaveBalance]);

  const getMinEndDate = () => {
    if (formData.start_date) {
      return formData.start_date;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    // Changed from p-4 md:p-6 to w-full px-4 md:px-6 to match EditLeaveAllocation
    <div className="w-full px-4 md:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link
          to="/employee/dashboard"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Dashboard
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <Link
          to="/employee/leaves"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          My Leaves
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">
          Request Annual Leave
        </span>
      </div>

      {/* Page Header - Updated to match EditLeaveAllocation style */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
          <i className="fas fa-calendar-alt mr-2"></i> Annual Leave Application
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Submit a request for annual leave
        </p>
      </div>

      {/* Error Display */}
      {(localError || error) && (
        <div className="error-message mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3 text-red-600">
          <FiAlertCircle className="text-xl" />
          <span className="text-sm">{localError || error}</span>
        </div>
      )}

      <div className="split-container grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-7">
        {/* Form */}
        <div className="form-container bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="form-section-title text-lg font-bold text-green-600 mb-6 pb-3 border-b-2 border-green-100 dark:border-green-900/30 flex items-center gap-2.5">
              <FiCalendar /> Leave Details
            </div>

            {/* Leave Type Display (Fixed) */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
                  <FiCalendar className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Annual Leave
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Only annual leave requests are accepted
                  </p>
                </div>
              </div>
            </div>

            {/* Leave Duration Type */}
            <div className="form-field flex flex-col gap-2 pb-5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <i className="fas fa-clock text-green-500" /> Leave Duration
              </label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="leaveDuration"
                    value="full"
                    checked={leaveDuration === "full"}
                    onChange={() => setLeaveDuration("full")}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Full Day
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="leaveDuration"
                    value="half"
                    checked={leaveDuration === "half"}
                    onChange={() => setLeaveDuration("half")}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Half Day
                  </span>
                </label>
              </div>
            </div>

            <div className="form-grid grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="form-field flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FiCalendar className="text-green-500" /> Start Date{" "}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <DateInput
                  value={formData.start_date}
                  onChange={handleStartDateChange}
                  type="general"
                  minDate={new Date()}
                  className="w-full"
                  placeholder="Select start date"
                />
              </div>

              <div className="form-field flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FiCalendar className="text-green-500" /> End Date{" "}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <DateInput
                  value={formData.end_date}
                  onChange={handleEndDateChange}
                  type="general"
                  minDate={getMinEndDate()}
                  className="w-full"
                  placeholder="Select end date"
                />
              </div>

              <div className="form-field flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <MdCalculate className="text-green-500" /> Total Days
                </label>
                <div
                  className={`total-days-box p-3 rounded-lg text-center ${exceedsBalance ? "bg-red-500/10" : "bg-green-500/10"}`}
                >
                  <span
                    className={`text-2xl md:text-3xl font-extrabold ${exceedsBalance ? "text-red-600" : "text-green-600"} block`}
                  >
                    {totalDays}{" "}
                    {totalDays === 0.5 && (
                      <span className="text-sm">(Half Day)</span>
                    )}
                  </span>
                  <small className="text-[11px] text-gray-500">Days</small>
                </div>
              </div>

              <div className="form-field flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FiPaperclip className="text-green-500" /> Supporting Document
                  (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className="py-2.5 px-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-500 file:text-white file:cursor-pointer hover:file:bg-green-600"
                />
              </div>

              <div className="form-field md:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FiMessageSquare className="text-green-500" /> Reason for
                  Leave <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows="4"
                  placeholder="Please describe your reason for requesting annual leave (min 10 characters)..."
                  className="py-3 px-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                  required
                />
                <small
                  className={`text-[11px] ${formData.reason.length >= 10 ? "text-green-500" : "text-red-500"}`}
                >
                  {formData.reason.length}/10 characters minimum
                </small>
              </div>
            </div>

            {exceedsBalance && (
              <div className="warning-message mb-6 p-3 bg-amber-500/10 border border-amber-500 rounded-lg text-amber-600 text-sm">
                ⚠️ Warning: Requested days ({totalDays}) exceed available Annual
                Leave balance ({remaining} days)
              </div>
            )}

            <div className="form-actions flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/employee/leaves"
                className="px-4 py-2 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
              >
                <FiX /> Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || exceedsBalance}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend /> Submit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Balance Card */}
        <div className="balance-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm sticky top-24">
          <div className="balance-header text-center pb-5 border-b border-gray-200 dark:border-gray-700 mb-5">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Annual Leave Balance
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current allocation for {new Date().getFullYear()}
            </p>
          </div>

          <div className="balance-remaining text-center mb-6">
            <div
              className={`remaining-number text-4xl md:text-5xl font-extrabold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}
            >
              {remaining}
            </div>
            <div className="remaining-label text-xs text-gray-500 dark:text-gray-400 mt-2">
              Days Remaining
            </div>
          </div>

          <div className="balance-stats flex gap-4 mb-6">
            <div className="balance-stat flex-1 text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="stat-value text-xl font-bold text-gray-800 dark:text-gray-200">
                {allocatedLeaves}
              </div>
              <div className="stat-label text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Allocated
              </div>
            </div>
            <div className="balance-stat flex-1 text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="stat-value text-xl font-bold text-gray-800 dark:text-gray-200">
                {usedLeaves}
              </div>
              <div className="stat-label text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Used
              </div>
            </div>
            <div className="balance-stat flex-1 text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="stat-value text-xl font-bold text-gray-800 dark:text-gray-200">
                {pendingLeaves}
              </div>
              <div className="stat-label text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Pending
              </div>
            </div>
          </div>

          <div className="info-note mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <FiAlertCircle className="inline mr-1" />
              Annual leave requests require approval from HR/Admin
            </p>
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <FiCalendar className="inline mr-1" />
              Plan your annual leave in advance for better scheduling
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLeave;