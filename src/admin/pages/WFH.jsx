import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SearchBar from "../components/common/SearchBar";
import EntriesSelector from "../components/common/EntriesSelector";
import Pagination from "../components/common/Paginations";
import ConfirmModal from "../components/common/ConfirmModal";
import { showToast } from "../../components/common/Toast";
import {
  fetchAdminWFHRequests,
  updateWFHRequestStatus,
  setAdminWfhFilter,
  setAdminWfhPagination,
  clearAdminWfhError,
} from "../store/slices/wfhSlice";
import { FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";
import StatusBadge from "../components/common/StatusBadge";

const AdminWFH = () => {
  const dispatch = useDispatch();
  const { requests, filter, pagination, loading, error } = useSelector(
    (state) => state.wfh,
  );
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminWFHRequests());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearAdminWfhError());
    }
  }, [error, dispatch]);

  // Filter requests
  const getFilteredRequests = () => {
    let filtered = [...requests];

    if (filter.status !== "all") {
      filtered = filtered.filter(
        (r) => r.status?.toLowerCase() === filter.status.toLowerCase(),
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.reason || "").toLowerCase().includes(searchLower) ||
          (r.employee?.name || r.employee_name || "")
            .toLowerCase()
            .includes(searchLower) ||
          (r.notes || "").toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  };

  const filteredRequests = getFilteredRequests();
  const totalPages = Math.ceil(filteredRequests.length / pagination.perPage);
  const start = (pagination.currentPage - 1) * pagination.perPage;
  const currentRequests = filteredRequests.slice(
    start,
    start + pagination.perPage,
  );

  const handleStatusFilter = (status) => {
    dispatch(
      setAdminWfhFilter({
        status: status === "all" ? "all" : status.toLowerCase(),
        search: filter.search,
      }),
    );
  };

  const handleSearch = (value) => {
    dispatch(setAdminWfhFilter({ status: filter.status, search: value }));
  };

  const handlePageChange = (page) => {
    dispatch(
      setAdminWfhPagination({ currentPage: page, perPage: pagination.perPage }),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEntriesChange = (value) => {
    dispatch(setAdminWfhPagination({ currentPage: 1, perPage: value }));
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleApproveClick = (id) => {
    setSelectedRequestId(id);
    setActionType("approve");
    setConfirmOpen(true);
  };

  const handleRejectClick = (id) => {
    setSelectedRequestId(id);
    setActionType("reject");
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequestId) return;

    setActionLoading(true);
    const newStatus = actionType === "approve" ? "approved" : "rejected";

    const result = await dispatch(
      updateWFHRequestStatus({ id: selectedRequestId, status: newStatus }),
    );

    if (updateWFHRequestStatus.fulfilled.match(result)) {
      showToast(
        `WFH request ${actionType === "approve" ? "approved" : "rejected"} successfully`,
        "success",
      );
      setConfirmOpen(false);
      setSelectedRequestId(null);
      setActionType(null);
      dispatch(fetchAdminWFHRequests());
    } else {
      showToast(result.payload || `Failed to ${actionType} request`, "error");
    }

    setActionLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEmployeeName = (request) => {
    if (request.employee?.first_name) {
      return `${request.employee.first_name} ${request.employee.last_name || ""}`.trim();
    }
    if (request.employee?.name) return request.employee.name;
    if (request.employee_name) return request.employee_name;
    return `Employee #${request.employee_id}`;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status?.toLowerCase() === "pending")
      .length,
    approved: requests.filter((r) => r.status?.toLowerCase() === "approved")
      .length,
    rejected: requests.filter((r) => r.status?.toLowerCase() === "rejected")
      .length,
  };

  if (loading && requests.length === 0) {
    return (
      <div className="w-full overflow-x-hidden">
        <main className="content px-4 py-4 md:px-6 md:py-6 w-full overflow-x-hidden">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <main className="content px-4 py-4 md:px-6 md:py-6 w-full overflow-x-hidden">
        {/* Stats Cards */}
        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-home text-green-600 text-sm md:text-lg"></i>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {stats.total}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">
              Total Requests
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-amber-600 text-sm md:text-lg"></i>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-amber-600">
              {stats.pending}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">
              Pending
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600 text-sm md:text-lg"></i>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">
              Approved
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-1 md:mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600 text-sm md:text-lg"></i>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 font-medium">
              Rejected
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Work From Home Requests
          </h2>
        </div>

        {/* Status Tabs */}
        <div className="overflow-x-auto pb-2 mb-4 md:mb-5 -mx-4 px-4">
          <div className="flex gap-2 min-w-max border-b border-gray-200 pb-3">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap capitalize ${
                  filter.status === status
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All Requests" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
          <EntriesSelector
            value={pagination.perPage}
            onChange={handleEntriesChange}
          />
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <SearchBar
              value={filter.search}
              onChange={handleSearch}
              placeholder="Search by employee, reason..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-soft">
          <div className="min-w-[800px] md:min-w-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Sl.No.
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Date
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Employee
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Reason
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Notes
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.length > 0 ? (
                  currentRequests.map((request, idx) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 text-center">
                        {start + idx + 1}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(request.date)}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800">
                        {getEmployeeName(request)}
                      </td>
                      <td
                        className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 max-w-[200px] truncate"
                        title={request.reason}
                      >
                        {request.reason}
                      </td>
                      <td
                        className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-400 max-w-[150px] truncate"
                        title={request.notes}
                      >
                        {request.notes || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-500 transition-colors"
                            title="View Details"
                          >
                            <FiEye className="text-xs md:text-sm" />
                          </button>
                          {request.status?.toLowerCase() === "pending" && (
                            <>
                              <button
                                onClick={() => handleApproveClick(request.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-green-500 transition-colors"
                                title="Approve"
                              >
                                <FiCheckCircle className="text-xs md:text-sm" />
                              </button>
                              <button
                                onClick={() => handleRejectClick(request.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-red-500 transition-colors"
                                title="Reject"
                              >
                                <FiXCircle className="text-xs md:text-sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No WFH requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={filteredRequests.length}
            itemsPerPage={pagination.perPage}
          />
        )}
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                WFH Request Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="text-xl" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700 w-28">Date:</span>
                <span className="text-gray-600">
                  {formatDate(selectedRequest.date)}
                </span>
              </div>
              <div className="flex py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700 w-28">
                  Employee:
                </span>
                <span className="text-gray-600">
                  {getEmployeeName(selectedRequest)}
                </span>
              </div>
              <div className="flex py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700 w-28">
                  Reason:
                </span>
                <span className="text-gray-600">{selectedRequest.reason}</span>
              </div>
              <div className="flex py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700 w-28">Notes:</span>
                <span className="text-gray-600">
                  {selectedRequest.notes || "-"}
                </span>
              </div>
              <div className="flex py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700 w-28">
                  Status:
                </span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-28">
                  Submitted:
                </span>
                <span className="text-gray-600">
                  {formatDate(selectedRequest.created_at)}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                Close
              </button>
              {selectedRequest.status?.toLowerCase() === "pending" && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApproveClick(selectedRequest.id);
                    }}
                    className="px-4 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleRejectClick(selectedRequest.id);
                    }}
                    className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedRequestId(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        title={
          actionType === "approve"
            ? "Approve WFH Request"
            : "Reject WFH Request"
        }
        message={
          actionType === "approve"
            ? "Are you sure you want to approve this WFH request?"
            : "Are you sure you want to reject this WFH request?"
        }
        confirmText={actionType === "approve" ? "Approve" : "Reject"}
        loading={actionLoading}
        type={actionType === "approve" ? "approve" : "delete"} 
      />
    </div>
  );
};

export default AdminWFH;
