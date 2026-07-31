// src/employee/components/leaves/LeaveViewModal.jsx

import { FiEye, FiX, FiUser, FiFileText, FiCalendar, FiClock, FiLoader } from "react-icons/fi";
import StatusBadge from "../common/StatusBadge";

const LeaveViewModal = ({ isOpen, leave, loading, onClose, onViewDocument }) => {
  if (!isOpen) return null;

  const getLeaveTypeColor = (typeName) => {
    const name = typeName?.toLowerCase() || "";
    if (name.includes("sick")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (name.includes("annual") || name.includes("vacation")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (name.includes("casual")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (name.includes("maternity")) return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
    if (name.includes("unpaid")) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
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
      return dateString;
    }
  };

  const getStatus = (status) => {
    if (!status) return "pending";
    if (typeof status === "object") {
      return status.name?.toLowerCase() || "pending";
    }
    return status.toLowerCase();
  };

  const getAppliedByInfo = () => {
    if (!leave?.applied_by) {
      return { name: "Self", role: "Employee" };
    }
    const appliedBy = leave.applied_by;
    let name = appliedBy.employee_name || appliedBy.name || appliedBy.username || "Unknown";
    let role = "Employee";
    if (appliedBy.type) {
      role = appliedBy.type.charAt(0).toUpperCase() + appliedBy.type.slice(1);
    }
    if (appliedBy.role) {
      role = typeof appliedBy.role === "object" ? appliedBy.role.name : appliedBy.role;
    }
    return { name, role };
  };

  // ✅ Updated: Get approver info with full name from employee relation and role
  const getApproverInfo = () => {
    if (!leave?.approver) {
      return { name: "-", role: "-" };
    }
    
    const approver = leave.approver;
    let name = "-";
    let role = "-";
    
    // Get full name from employee relation (first_name + last_name)
    if (approver.employee) {
      const emp = approver.employee;
      name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      if (!name || name === '') {
        name = emp.name || approver.username || '-';
      }
    } else {
      name = approver.name || approver.username || approver.email || '-';
    }
    
    // Get role from role relation
    if (approver.role) {
      role = typeof approver.role === "object" ? approver.role.name : approver.role;
    }
    
    // Fallback: if role is still '-' and we have role_id
    if (role === "-" && approver.role_id) {
      role = `Role ${approver.role_id}`;
    }
    
    return { name, role };
  };

  // ✅ Check if applied by is self
  const isSelfApplied = () => {
    const appliedBy = leave?.applied_by;
    if (!appliedBy) return false;
    
    const employeeUserId = leave?.employee?.user_id || leave?.user_id;
    const appliedByUserId = appliedBy.user_id;
    
    if (employeeUserId && appliedByUserId) {
      return String(employeeUserId) === String(appliedByUserId);
    }
    
    const employeeId = leave?.employee_id || leave?.employee?.id;
    if (employeeId && appliedByUserId) {
      return String(employeeId) === String(appliedByUserId);
    }
    
    const employeeName = leave?.employee_name || leave?.employee?.name || '';
    const appliedByName = appliedBy.employee_name || appliedBy.name || '';
    if (employeeName && appliedByName && employeeName === appliedByName) {
      return true;
    }
    
    return false;
  };

  const appliedBy = getAppliedByInfo();
  const approver = getApproverInfo();
  const status = getStatus(leave?.status);
  const isPending = status === "pending";
  const isSelf = isSelfApplied();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <FiEye className="text-green-500" />
            Leave Request Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FiLoader className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-[var(--muted)]">Loading leave details...</p>
            </div>
          </div>
        ) : leave ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Employee Name */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Employee:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {leave.employee_name || 
                 leave.employee?.name || 
                 (leave.employee && `${leave.employee.first_name || ''} ${leave.employee.last_name || ''}`.trim()) ||
                 leave.employee?.first_name ||
                 "-"}
              </span>
            </div>

            {/* Applied By */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Applied By:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {appliedBy.name}
                {isSelf && (
                  <span className="ml-2 text-xs text-green-500 dark:text-green-400 font-medium">
                    (Self)
                  </span>
                )}
                {!isSelf && appliedBy.role !== "Employee" && appliedBy.role !== "-" && (
                  <span className="ml-2 text-xs text-blue-500 dark:text-blue-400">
                    ({appliedBy.role})
                  </span>
                )}
              </span>
            </div>

            {/* Leave Type */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Leave Type:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border ${getLeaveTypeColor(leave.leave_type?.name)}`}
              >
                {leave.leave_type?.name || "-"}
              </span>
            </div>

            {/* Duration */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Duration:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
              </span>
            </div>

            {/* Days */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Days:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {leave.duration_days || leave.days || "-"}
              </span>
            </div>

            {/* Sessions */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Sessions:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words text-xs">
                <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {leave.session1 || "morning"} → {leave.session2 || "afternoon"}
                </span>
              </span>
            </div>

            {/* Claim Salary */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Claim Salary:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {leave.claim_salary === 1 || leave.claim_salary === "1" ? "Yes" : "No"}
              </span>
            </div>

            {/* Document */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Document:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {leave.document || leave.document_path ? (
                  <button
                    onClick={() => onViewDocument(leave.document || leave.document_path)}
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-sm"
                  >
                    <i className="fas fa-file-pdf"></i>
                    View Document
                  </button>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </span>
            </div>

            {/* Reason - spans full width */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 col-span-1 sm:col-span-2 items-start">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0 pt-0.5">
                Reason:
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 dark:text-gray-400 break-words whitespace-pre-wrap word-break-break-word overflow-hidden">
                  {leave.reason || "-"}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Status:
              </span>
              <StatusBadge status={status} />
            </div>

            {/* Processed By - with full name and role */}
            <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                Processed By:
              </span>
              <span className="text-gray-600 dark:text-gray-400 break-words">
                {isPending ? (
                  <span className="text-gray-400">-</span>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {approver.name}
                    </span>
                    {approver.role !== "-" && (
                      <span className="text-xs text-blue-500 dark:text-blue-400">
                        {approver.role}
                      </span>
                    )}
                  </div>
                )}
              </span>
            </div>

            {/* Admin Remark - if exists */}
            {leave.admin_remark && (
              <div className="flex py-2 col-span-1 sm:col-span-2 items-start">
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0 pt-0.5">
                  Admin Remark:
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 dark:text-gray-400 break-words whitespace-pre-wrap">
                    {leave.admin_remark}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--muted)]">
            <p>No leave data available</p>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveViewModal;