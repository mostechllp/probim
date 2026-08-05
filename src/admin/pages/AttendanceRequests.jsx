// src/admin/pages/AdminAttendanceRequests.jsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiEye,
  FiCheck,
  FiX,
  FiSearch,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiSun,
  FiMoon,
  FiLogIn,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { MdFingerprint } from "react-icons/md";
import { showToast } from "../../components/common/Toast";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  fetchAttendanceRequests,
  updateAttendanceStatus,
  updateAttendanceRequest,
  deleteAttendanceRequest,
  clearAdminAttendanceError,
  setAdminAttendanceFilter,
} from "../store/slices/attendanceRequestSlice";
import { getPhotoUrl, getFallbackAvatar } from "../../utils/imageHelper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const AdminAttendanceRequests = () => {
  const dispatch = useDispatch();
  
  const {
    requests = [],
    loading = false,
    actionLoading = false,
    error = null,
    totalCount = 0,
    currentPage = 1,
    lastPage = 1,
    perPage = 10,
    filter = { status: "all", type: "all", search: "" },
  } = useSelector((state) => state.adminAttendance || {});

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [editFormData, setEditFormData] = useState({
    request_date: "",
    request_time: "",
    reason: "",
  });
  const [localSearch, setLocalSearch] = useState(filter.search || "");
  const [localStatus, setLocalStatus] = useState(filter.status || "all");
  const [localType, setLocalType] = useState(filter.type || "all");

  // Load data on mount
  useEffect(() => {
    loadRequests();
  }, []);

  // Handle errors
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearAdminAttendanceError());
    }
  }, [error, dispatch]);

  const loadRequests = async () => {
    try {
      await dispatch(fetchAttendanceRequests({
        status: localStatus !== "all" ? localStatus : undefined,
        type: localType !== "all" ? localType : undefined,
        search: localSearch || undefined,
        page: currentPage,
        per_page: perPage,
      })).unwrap();
    } catch (error) {
      console.error("Failed to load attendance requests:", error);
    }
  };

  // Get employee name from the employee object
  const getEmployeeName = (request) => {
    if (!request) return "Unknown Employee";
    
    if (request.employee) {
      const emp = request.employee;
      if (emp.name) return emp.name;
      if (emp.first_name || emp.last_name) {
        return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      }
      if (emp.full_name) return emp.full_name;
    }
    
    if (request.employee_name) return request.employee_name;
    if (request.user?.name) return request.user.name;
    if (request.user?.username) return request.user.username;
    
    return "Unknown Employee";
  };

  // Get employee code
  const getEmployeeCode = (request) => {
    if (!request) return "-";
    
    if (request.employee) {
      if (request.employee.employee_code) return request.employee.employee_code;
      if (request.employee.employee_id) return request.employee.employee_id;
    }
    
    if (request.employee_code) return request.employee_code;
    if (request.employee_id) return request.employee_id;
    
    return "-";
  };

  // Get employee avatar URL
  const getEmployeeAvatar = (request) => {
    if (!request) return null;
    
    if (request.employee && request.employee.avatar) {
      return getPhotoUrl(request.employee.avatar);
    }
    return null;
  };

  const getRequestTypeLabel = (type) => {
    const types = {
      early_check_in: "Early Check-in",
      late_check_in: "Late Check-in",
      missed_punch_in: "Missed Punch In",
      missed_punch_out: "Missed Punch Out",
    };
    return types[type] || type?.replace(/_/g, ' ') || type;
  };

  const getRequestTypeIcon = (type) => {
    const icons = {
      early_check_in: <FiSun className="text-orange-500" />,
      late_check_in: <FiMoon className="text-purple-500" />,
      missed_punch_in: <MdFingerprint className="text-blue-500" />,
      missed_punch_out: <FiLogIn className="text-green-500" />,
    };
    return icons[type] || <FiClock className="text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
  };

  const getRequestTypeBadge = (type) => {
    const colors = {
      early_check_in: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      late_check_in: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      missed_punch_in: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      missed_punch_out: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const handleSearch = () => {
    dispatch(setAdminAttendanceFilter({ search: localSearch }));
    loadRequests();
  };

  const handleStatusFilter = (status) => {
    setLocalStatus(status);
    dispatch(setAdminAttendanceFilter({ status }));
    loadRequests();
  };

  const handleTypeFilter = (type) => {
    setLocalType(type);
    dispatch(setAdminAttendanceFilter({ type }));
    loadRequests();
  };

  const handlePageChange = (page) => {
    loadRequests();
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await dispatch(updateAttendanceStatus({ id, status })).unwrap();
      showToast(`Request ${status} successfully`, "success");
      setShowStatusModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      showToast(error || "Failed to update status", "error");
    }
  };

  const handleEdit = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      request_date: request.request_date || request.date || "",
      request_time: request.request_time || request.time || "",
      reason: request.reason || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await dispatch(updateAttendanceRequest({
        id: selectedRequest.id,
        data: editFormData,
      })).unwrap();
      showToast("Request updated successfully", "success");
      setShowEditModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      showToast(error || "Failed to update request", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteAttendanceRequest(id)).unwrap();
      showToast("Request deleted successfully", "success");
      setShowDeleteModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      showToast(error || "Failed to delete request", "error");
    }
  };

  // Calculate stats
  const stats = {
    total: totalCount,
    pending: requests.filter(r => r.status?.toLowerCase() === "pending").length,
    approved: requests.filter(r => r.status?.toLowerCase() === "approved").length,
    rejected: requests.filter(r => r.status?.toLowerCase() === "rejected").length,
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
            Attendance Requests
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Review and manage employee attendance correction requests
          </p>
        </div>
        <button
          onClick={() => loadRequests()}
          disabled={loading}
          className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
        >
          <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FiClock />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <FiClock />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-2">{stats.pending}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Approved</span>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <FiCheck />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-500 mt-2">{stats.approved}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <FiX />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500 mt-2">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
              Status
            </label>
            <select
              value={localStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
              Request Type
            </label>
            <select
              value={localType}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="all">All Types</option>
              <option value="early_check_in">Early Check-in</option>
              <option value="late_check_in">Late Check-in</option>
              <option value="missed_punch_in">Missed Punch In</option>
              <option value="missed_punch_out">Missed Punch Out</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by employee or reason..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                <FiSearch className="text-sm" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiClock className="text-4xl text-gray-400" />
                      <p>No attendance requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request, idx) => {
                  const employeeName = getEmployeeName(request);
                  const employeeCode = getEmployeeCode(request);
                  const avatarUrl = getEmployeeAvatar(request);
                  
                  return (
                    <tr key={request.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{(currentPage - 1) * perPage + idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={employeeName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackAvatar(employeeName);
                                }}
                              />
                            ) : (
                              <span className="text-xs font-bold text-white">
                                {getInitials(employeeName)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {employeeName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRequestTypeBadge(request.type)}`}>
                          {getRequestTypeIcon(request.type)}
                          {getRequestTypeLabel(request.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(request.request_date || request.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(request.request_time || request.time)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                          {request.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 transition-colors"
                            title="View Details"
                          >
                            <FiEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleEdit(request)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          {request.status?.toLowerCase() === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setStatusAction("approved");
                                  setShowStatusModal(true);
                                }}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <FiCheck className="text-sm" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setStatusAction("rejected");
                                  setShowStatusModal(true);
                                }}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <FiX className="text-sm" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: Math.min(lastPage, 10) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Request Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  {getEmployeeAvatar(selectedRequest) ? (
                    <img
                      src={getEmployeeAvatar(selectedRequest)}
                      alt={getEmployeeName(selectedRequest)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getFallbackAvatar(getEmployeeName(selectedRequest));
                      }}
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {getInitials(getEmployeeName(selectedRequest))}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {getEmployeeName(selectedRequest)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getEmployeeCode(selectedRequest)}
                  </p>
                </div>
              </div>
              <div className="flex py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-28">Type:</span>
                <span className="text-gray-800 dark:text-gray-200">{getRequestTypeLabel(selectedRequest.type)}</span>
              </div>
              <div className="flex py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-28">Date:</span>
                <span className="text-gray-800 dark:text-gray-200">{formatDate(selectedRequest.request_date || selectedRequest.date)}</span>
              </div>
              <div className="flex py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-28">Time:</span>
                <span className="text-gray-800 dark:text-gray-200">{formatTime(selectedRequest.request_time || selectedRequest.time)}</span>
              </div>
              <div className="flex py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-28">Reason:</span>
                <span className="text-gray-800 dark:text-gray-200">{selectedRequest.reason || "-"}</span>
              </div>
              <div className="flex py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-28">Status:</span>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status || 'pending'}
                </span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-600 dark:text-gray-400 w-28">Submitted:</span>
                <span className="text-gray-800 dark:text-gray-200">{formatDateTime(selectedRequest.created_at)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {selectedRequest.status?.toLowerCase() === "pending" && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, "approved");
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setStatusAction("rejected");
                      setShowStatusModal(true);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal - Using ConfirmModal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedRequest(null);
        }}
        onConfirm={() => handleStatusUpdate(selectedRequest?.id, statusAction)}
        title={statusAction === "approved" ? "Approve Request" : "Reject Request"}
        message={`Are you sure you want to ${statusAction} this request from ${getEmployeeName(selectedRequest)}?`}
        confirmText={statusAction === "approved" ? "Approve" : "Reject"}
        cancelText="Cancel"
        loading={actionLoading}
        type={statusAction === "approved" ? "approve" : "delete"}
      />

      {/* Edit Modal */}
      {showEditModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Edit Request</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={editFormData.request_date ? new Date(editFormData.request_date) : null}
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                      setEditFormData({ ...editFormData, request_date: localDate });
                    } else {
                      setEditFormData({ ...editFormData, request_date: "" });
                    }
                  }}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date("2026-01-01")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  wrapperClassName="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={editFormData.request_time}
                  onChange={(e) => setEditFormData({ ...editFormData, request_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editFormData.reason}
                  onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter reason..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal - Using ConfirmModal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRequest(null);
        }}
        onConfirm={() => handleDelete(selectedRequest?.id)}
        title="Delete Request"
        message={`Are you sure you want to delete this request from ${getEmployeeName(selectedRequest)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={actionLoading}
        type="delete"
      />
    </div>
  );
};

export default AdminAttendanceRequests;