// src/admin/pages/Leaves.js

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "@admin/components/common/SearchBar";
import EntriesSelector from "@admin/components/common/EntriesSelector";
import LeaveModal from "@admin/components/leaves/LeaveModal";
import { showToast } from "../../components/common/Toast";
import {
  fetchLeaves,
  fetchLeaveById,
  updateLeaveStatus,
  updateLeaveRequest,
  deleteLeaveRequest,
  clearError,
  fetchLeaveTypes,
} from "@admin/store/slices/LeaveSlice";
import Pagination from "@admin/components/common/Paginations";
import ConfirmModal from "@admin/components/common/ConfirmModal";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiLoader } from "react-icons/fi";
import DateInput from "../../admin/components/common/DateInput";

const Leaves = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Determine base path from current route
  const getBasePath = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/employee')) return '/employee';
    return '';
  };
  const basePath = getBasePath();

  const { leaves = [], error = null, loading = false, leaveTypes = [] } = useSelector((state) => {
    return state.leaves || { leaves: [] };
  });
  console.log(leaves);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Edit states
  const [editingLeave, setEditingLeave] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
    claim_salary: "0",
    session1: "morning",
    session2: "morning",
  });
  const [editFile, setEditFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLeave, setFetchingLeave] = useState(false);

  // Confirm modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Delete confirm states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState(null);

  // ✅ Get API base URL from environment
  const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return apiUrl.replace(/\/api$/, "");
    }
    return window.location.origin;
  };

  // ✅ Helper to get full document URL
  const getDocumentUrl = (docPath) => {
    if (!docPath) return null;
    
    if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
      return docPath;
    }
    
    const baseUrl = getBaseUrl();
    const cleanPath = docPath.replace(/^\/+/, '');
    
    if (cleanPath.startsWith('storage/')) {
      return `${baseUrl}/${cleanPath}`;
    }
    
    if (cleanPath.startsWith('leaves/documents/')) {
      return `${baseUrl}/storage/${cleanPath}`;
    }
    
    return `${baseUrl}/storage/${cleanPath}`;
  };

  useEffect(() => {
    dispatch(fetchLeaves());
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ✅ Helper to get applied by user info
  const getAppliedByInfo = (leave) => {
    if (!leave.applied_by) {
      return {
        name: "-",
        role: "-",
        userId: null,
      };
    }

    const appliedBy = leave.applied_by;
    
    let name = appliedBy.employee_name || appliedBy.name || "-";
    
    let role = "-";
    if (appliedBy.role) {
      role = appliedBy.role.name || appliedBy.role || "-";
    }

    return {
      name: name,
      role: role,
      userId: appliedBy.user_id || null,
    };
  };

  // Helper to get employee name
  const getEmployeeName = (leave) => {
    if (leave.employee_name) return leave.employee_name;
    if (leave.employee?.name) return leave.employee.name;
    if (leave.employee?.first_name && leave.employee?.last_name) {
      return `${leave.employee.first_name} ${leave.employee.last_name}`;
    }
    if (leave.employee?.first_name) return leave.employee.first_name;
    return "-";
  };

  const getFilteredLeaves = () => {
    const leavesArray = Array.isArray(leaves) ? leaves : [];
    let filtered = leavesArray;

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (leave) =>
          (leave.status || "").toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          (leave.employee?.first_name || "")
            .toLowerCase()
            .includes(searchLower) ||
          (leave.employee?.name || "")
            .toLowerCase()
            .includes(searchLower) ||
          (leave.leave_type?.name || leave.type || "")
            .toLowerCase()
            .includes(searchLower) ||
          (leave.reason || "").toLowerCase().includes(searchLower) ||
          (getAppliedByInfo(leave).name || "")
            .toLowerCase()
            .includes(searchLower)
      );
    }
    return filtered;
  };

  const filteredLeaves = getFilteredLeaves();
  const totalFiltered = filteredLeaves.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageLeaves = filteredLeaves.slice(start, start + perPage);

  const handleApproveClick = (id) => {
    setSelectedLeaveId(id);
    setActionType("approve");
    setConfirmOpen(true);
  };

  const handleRejectClick = (id) => {
    setSelectedLeaveId(id);
    setActionType("reject");
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedLeaveId) return;

    setActionLoading(true);

    const result = await dispatch(
      updateLeaveStatus({
        id: selectedLeaveId,
        status: actionType === "approve" ? "approved" : "rejected",
        processedBy: user?.username || "HR Admin",
        rejection_reason: actionType === "reject" ? rejectionReason : null,
      }),
    );

    if (updateLeaveStatus.fulfilled.match(result)) {
      showToast(
        `Leave request ${actionType === "approve" ? "approved" : "rejected"} successfully`,
        "success",
      );
      setConfirmOpen(false);
      setSelectedLeaveId(null);
      setRejectionReason("");
      setActionType(null);
      dispatch(fetchLeaves());
    } else {
      showToast(
        result.payload || `Failed to ${actionType} leave request`,
        "error",
      );
    }

    setActionLoading(false);
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  // ✅ Handle document view
  const handleViewDocument = (docPath) => {
    if (docPath) {
      const fullUrl = getDocumentUrl(docPath);
      window.open(fullUrl, "_blank");
    }
  };

  // ✅ Helper to check if document exists
  const hasDocument = (leave) => {
    const doc = leave.document_path || leave.document || leave.doc;
    return !!(doc && doc !== 'null' && doc !== 'undefined' && doc.trim() !== '');
  };

  // ✅ Helper to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      // If it's already in YYYY-MM-DD format
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      return "";
    }
  };

  // ✅ Edit Handlers - Updated to fetch by ID
  const handleEditClick = async (leave) => {
    // Only allow editing if status is pending
    if ((leave.status || "").toLowerCase() !== "pending") {
      showToast("Only pending leave requests can be edited", "warning");
      return;
    }

    setFetchingLeave(true);
    setShowEditModal(true);

    try {
      // ✅ Fetch the complete leave data by ID
      const result = await dispatch(fetchLeaveById(leave.id)).unwrap();
      
      console.log("Fetched leave data for editing:", result);

      const leaveTypeId = result.leave_type_id || result.leave_type?.id;
      
      // Format dates for input
      const startDate = result.start_date || result.from_date;
      const endDate = result.end_date || result.to_date;
      
      const startDateFormatted = startDate ? formatDateForInput(startDate) : "";
      const endDateFormatted = endDate ? formatDateForInput(endDate) : "";

      const session1 = result.session1 || "morning";
      const session2 = result.session2 || "afternoon";

      setEditingLeave(result);
      setEditFormData({
        leave_type_id: leaveTypeId || "",
        start_date: startDateFormatted,
        end_date: endDateFormatted,
        reason: result.reason || "",
        claim_salary: result.claim_salary === 1 || result.claim_salary === "Yes" ? "1" : "0",
        session1: session1,
        session2: session2,
      });
      setEditFile(null);
    } catch (error) {
      console.error("Failed to fetch leave details:", error);
      showToast("Failed to load leave details for editing", "error");
      setShowEditModal(false);
    } finally {
      setFetchingLeave(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting edit form with data:", editFormData);

    // Validate form data
    if (!editFormData.leave_type_id) {
      showToast("Please select a leave type", "error");
      return;
    }
    if (!editFormData.start_date || editFormData.start_date === "") {
      showToast("Please select a start date", "error");
      return;
    }
    if (!editFormData.end_date || editFormData.end_date === "") {
      showToast("Please select an end date", "error");
      return;
    }
    if (editFormData.reason.length < 10) {
      showToast("Reason must be at least 10 characters", "error");
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append("leave_type_id", editFormData.leave_type_id);
      formDataToSend.append("start_date", editFormData.start_date);
      formDataToSend.append("end_date", editFormData.end_date);
      formDataToSend.append("reason", editFormData.reason);
      formDataToSend.append("claim_salary", editFormData.claim_salary);
      formDataToSend.append("session1", editFormData.session1);
      formDataToSend.append("session2", editFormData.session2);

      if (editFile) {
        formDataToSend.append("document", editFile);
      }

      // Log FormData contents for debugging
      console.log("FormData contents:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value}`);
      }

      const result = await dispatch(
        updateLeaveRequest({
          id: editingLeave.id,
          formData: formDataToSend,
        })
      );

      if (updateLeaveRequest.fulfilled.match(result)) {
        showToast("Leave request updated successfully!", "success");
        setShowEditModal(false);
        setEditingLeave(null);
        setEditFile(null);
        dispatch(fetchLeaves());
      } else {
        console.error("Update failed:", result.payload);
        showToast(result.payload || "Failed to update leave request", "error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("An error occurred while updating", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingLeave(null);
    setEditFile(null);
    setFetchingLeave(false);
  };

  // Handle date changes from DateInput
  const handleStartDateChange = (dateValue) => {
    console.log("Start date changed:", dateValue);
    setEditFormData({ ...editFormData, start_date: dateValue || "" });
  };

  const handleEndDateChange = (dateValue) => {
    console.log("End date changed:", dateValue);
    setEditFormData({ ...editFormData, end_date: dateValue || "" });
  };

  // ✅ Delete Handlers
  const handleDeleteClick = (leave) => {
    if ((leave.status || "").toLowerCase() !== "pending") {
      showToast("Only pending leave requests can be deleted", "warning");
      return;
    }
    setLeaveToDelete(leave);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leaveToDelete) return;

    setActionLoading(true);

    const result = await dispatch(deleteLeaveRequest(leaveToDelete.id));

    if (deleteLeaveRequest.fulfilled.match(result)) {
      showToast("Leave request deleted successfully!", "success");
      setDeleteConfirmOpen(false);
      setLeaveToDelete(null);
      dispatch(fetchLeaves());
    } else {
      showToast(result.payload || "Failed to delete leave request", "error");
    }

    setActionLoading(false);
  };

  // Calculate stats
  const leavesArray = Array.isArray(leaves) ? leaves : [];
  const total = leavesArray.length;
  const pending = leavesArray.filter(
    (l) => (l.status || "").toLowerCase() === "pending",
  ).length;
  const approved = leavesArray.filter(
    (l) => (l.status || "").toLowerCase() === "approved",
  ).length;
  const rejected = leavesArray.filter(
    (l) => (l.status || "").toLowerCase() === "rejected",
  ).length;

  const getStatusClass = (status) => {
    const lowerStatus = (status || "").toLowerCase();
    switch (lowerStatus) {
      case "pending":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "approved":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      return dateString;
    } catch (error) {
      return dateString || "-";
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Stats Cards */}
      <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-alt text-green-600 dark:text-green-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
            {total}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">
            Total Requests
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-amber-600 dark:text-amber-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {pending}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">
            Pending
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 dark:text-green-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
            {approved}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">
            Approved
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-times-circle text-red-600 dark:text-red-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
            {rejected}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">
            Rejected
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
          Leave Requests
        </h2>
      </div>

      {/* Status Tabs */}
      <div className="overflow-x-auto pb-2 mb-4 md:mb-5 -mx-4 px-4">
        <div className="flex gap-2 min-w-max border-b border-gray-200 dark:border-gray-700 pb-3">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap capitalize ${
                statusFilter === status
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {status === "all" ? "All Requests" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
        <EntriesSelector value={perPage} onChange={setPerPage} />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by employee..."
          />
          {user?.role?.name === "HR Manager" ||
          user?.type === "hr" ||
          user?.type === "admin" ? (
            <Link
              to={`${basePath}/request-leave-for-employee`}
              className="request-btn bg-emerald-700 text-white py-2.5 px-6 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all shadow-md"
            >
              <FiPlus /> Request Leave for Employee
            </Link>
          ) : null}
          <Link
            to={`${basePath}/leaves/allocations`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <i className="fas fa-chart-line"></i>
            <span className="hidden sm:inline">Manage Leave Allocations</span>
            <span className="sm:hidden">Allocations</span>
          </Link>
          <Link
            to={`${basePath}/leaves/leave-types`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <i className="fas fa-briefcase"></i>
            <span className="hidden sm:inline">Manage leave types</span>
            <span className="sm:hidden">Leave Types</span>
          </Link>
        </div>
      </div>

      {/* Leave Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
        <div className="min-w-[1100px] lg:min-w-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Sl.No.
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Employee
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Applied By
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Type
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  From
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  To
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Days
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Claim Salary
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Doc
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Reason
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Processed By
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pageLeaves.length > 0 ? (
                pageLeaves.map((leave, idx) => {
                  const appliedByInfo = getAppliedByInfo(leave);
                  const hasDoc = hasDocument(leave);
                  const docPath = leave.document_path || leave.document || leave.doc;
                  const isPending = (leave.status || "").toLowerCase() === "pending";
                  
                  return (
                    <tr
                      key={leave.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                        {start + idx + 1}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {getEmployeeName(leave)}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {appliedByInfo.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {leave.leave_type?.name || leave.type || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(leave.start_date || leave.from_date)}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(leave.end_date || leave.to_date)}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                        {leave.duration_days || leave.number_of_days || leave.days || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <span
                          className={`inline-block px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs font-semibold whitespace-nowrap ${
                            leave.claim_salary === 1 ||
                            leave.claim_salary === "1" ||
                            leave.claim_salary === "Yes"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {leave.claim_salary === 1 || leave.claim_salary === "1" || leave.claim_salary === "Yes"
                            ? "Yes"
                            : "No"}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        {hasDoc ? (
                          <button
                            onClick={() => handleViewDocument(docPath)}
                            className="text-blue-500 hover:text-blue-600 text-xs md:text-sm flex items-center gap-1"
                          >
                            <i className="fas fa-file-pdf text-xs md:text-sm"></i>
                            <span className="hidden sm:inline">View</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td
                        className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-[120px] md:max-w-[150px] truncate"
                        title={leave.reason}
                      >
                        {leave.reason || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <span
                          className={`inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-xs font-semibold whitespace-nowrap capitalize ${getStatusClass(leave.status)}`}
                        >
                          {leave.status || "pending"}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {leave.processed_by || leave.processedBy || leave.approver?.username || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => handleView(leave)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 transition-colors"
                            title="View Details"
                          >
                            <i className="fas fa-eye text-xs md:text-sm"></i>
                          </button>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleEditClick(leave)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                                title="Edit Leave Request"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(leave)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                                title="Delete Leave Request"
                              >
                                <FiTrash2 size={14} />
                              </button>
                              <button
                                onClick={() => handleApproveClick(leave.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-green-500 transition-colors"
                                title="Approve"
                              >
                                <i className="fas fa-check-circle text-xs md:text-sm"></i>
                              </button>
                              <button
                                onClick={() => handleRejectClick(leave.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                                title="Reject"
                              >
                                <i className="fas fa-times-circle text-xs md:text-sm"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="13"
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalFiltered > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalFiltered}
          itemsPerPage={perPage}
        />
      )}

      {/* Leave Details Modal */}
      <LeaveModal
        isOpen={showModal}
        leave={selectedLeave}
        onClose={() => setShowModal(false)}
        onViewDocument={handleViewDocument}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                <FiEdit2 className="inline mr-2 text-amber-500" />
                Edit Leave Request
              </h3>
              <button
                onClick={handleEditClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {fetchingLeave ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FiLoader className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
                  <p className="text-[var(--muted)]">Loading leave details...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editFormData.leave_type_id}
                      onChange={(e) => {
                        console.log("Leave type selected:", e.target.value);
                        setEditFormData({
                          ...editFormData,
                          leave_type_id: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <DateInput
                        value={editFormData.start_date}
                        onChange={handleStartDateChange}
                        type="general"
                        className="w-full"
                        placeholder="dd/mm/yyyy"
                        error={false}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <DateInput
                        value={editFormData.end_date}
                        onChange={handleEndDateChange}
                        type="general"
                        className="w-full"
                        placeholder="dd/mm/yyyy"
                        error={false}
                        minDate={
                          editFormData.start_date
                            ? new Date(editFormData.start_date)
                            : null
                        }
                      />
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Start Session <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editFormData.session1}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            session1: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        End Session <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editFormData.session2}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            session2: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                      </select>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editFormData.reason}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          reason: e.target.value,
                        })
                      }
                      rows="3"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter reason for leave (min 10 characters)"
                      required
                    />
                  </div>

                  {/* Claim Salary */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Claim Salary
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="1"
                          checked={editFormData.claim_salary === "1"}
                          onChange={() =>
                            setEditFormData({
                              ...editFormData,
                              claim_salary: "1",
                            })
                          }
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="0"
                          checked={editFormData.claim_salary === "0"}
                          onChange={() =>
                            setEditFormData({
                              ...editFormData,
                              claim_salary: "0",
                            })
                          }
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Upload Document{" "}
                      <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    
                    {/* Show current document if it exists */}
                    {editingLeave?.document && !editFile && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Document:</p>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-file-pdf text-red-500"></i>
                          <button
                            type="button"
                            onClick={() => handleViewDocument(editingLeave.document)}
                            className="text-blue-500 hover:text-blue-600 hover:underline text-sm font-medium"
                          >
                            {editingLeave.document.split('/').pop()}
                          </button>
                          <span className="text-xs text-gray-400">(Click to view)</span>
                        </div>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      onChange={(e) => setEditFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white file:cursor-pointer hover:file:bg-amber-600"
                    />
                    {editFile && (
                      <p className="text-xs text-amber-600 mt-1">
                        File selected: {editFile.name}
                      </p>
                    )}
                    {editingLeave?.document && !editFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a new file to replace the current document
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleEditClose}
                    className="px-4 py-2 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiEdit2 /> Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal for Approve/Reject */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedLeaveId(null);
          setRejectionReason("");
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        title={
          actionType === "approve"
            ? "Approve Leave Request"
            : "Reject Leave Request"
        }
        message={
          actionType === "approve"
            ? "Are you sure you want to approve this leave request?"
            : "Are you sure you want to reject this leave request?"
        }
        confirmText={actionType === "approve" ? "Approve" : "Reject"}
        loading={actionLoading}
        variant={
          actionType === "approve"
          ? "success"
          : "danger"
        }
      >
        {actionType === "reject" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rejection Reason (Optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              placeholder="Enter reason for rejection..."
            />
          </div>
        )}
      </ConfirmModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setLeaveToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Leave Request"
        message={`Are you sure you want to delete the leave request for "${leaveToDelete ? getEmployeeName(leaveToDelete) : ""}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={actionLoading}
        variant="danger"
      />
    </div>
  );
};

export default Leaves;