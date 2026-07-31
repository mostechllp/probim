// src/admin/components/leaves/LeaveModal.jsx

const LeaveModal = ({ isOpen, leave, onClose, onViewDocument }) => {
  if (!isOpen || !leave) return null;

  const getStatusClass = (status) => {
    const lowerStatus = (status || '').toLowerCase();
    switch (lowerStatus) {
      case "pending":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "approved":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Helper to get the raw document value (not formatted)
  const getRawDoc = () => {
    return leave.document_path || leave.document || leave.doc || null;
  };

  // Helper to get applied by info
  const getAppliedByInfo = () => {
    if (!leave.applied_by) {
      return { name: '-', role: '-', userId: null };
    }
    
    const appliedBy = leave.applied_by;
    return {
      name: appliedBy.employee_name || appliedBy.name || '-',
      role: appliedBy.role?.name || appliedBy.role || '-',
      userId: appliedBy.user_id || null,
    };
  };

  // Helper to check if applied by is self
  const isSelfApplied = () => {
    const appliedBy = leave.applied_by;
    if (!appliedBy) return false;
    
    const employeeUserId = leave.employee?.user_id || leave.user_id;
    const appliedByUserId = appliedBy.user_id;
    
    if (employeeUserId && appliedByUserId) {
      return String(employeeUserId) === String(appliedByUserId);
    }
    
    // Check by employee_id
    const employeeId = leave.employee_id || leave.employee?.id;
    if (employeeId && appliedByUserId) {
      return String(employeeId) === String(appliedByUserId);
    }
    
    // Check by name
    const employeeName = leave.employee_name || leave.employee?.name || '';
    const appliedByName = appliedBy.employee_name || appliedBy.name || '';
    if (employeeName && appliedByName && employeeName === appliedByName) {
      return true;
    }
    
    return false;
  };

  // Helper to get field value from different possible field names
  const getField = (fieldName) => {
    const mappings = {
      employee: leave.employee_name || leave.employee?.name || leave.employee || '-',
      type: leave.leave_type?.name || leave.type || '-',
      fromDate: formatDate(leave.start_date || leave.from_date || leave.fromDate),
      toDate: formatDate(leave.end_date || leave.to_date || leave.toDate),
      days: leave.duration_days || leave.number_of_days || leave.days || '-',
      claimSalary: leave.claim_salary === 1 || leave.claim_salary === "1" || leave.claimSalary === 'Yes' ? 'Yes' : 'No',
      doc: leave.document_path || leave.document || leave.doc || '-',
      reason: leave.reason || '-',
      status: leave.status || 'pending',
      processedBy: leave.processed_by || leave.processedBy || leave.approver?.username || '-',
      rejectionReason: leave.rejection_reason || leave.rejectionReason,
    };
    return mappings[fieldName] || '-';
  };

  // Helper to check if document exists
  const hasDocument = () => {
    const doc = getRawDoc();
    if (!doc) return false;
    if (doc === 'null' || doc === 'undefined') return false;
    if (typeof doc === 'string' && doc.trim() === '') return false;
    return true;
  };

  const appliedBy = getAppliedByInfo();
  const isSelf = isSelfApplied();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <i className="fas fa-eye text-green-500"></i>
          Leave Request Details
        </h3>

        <div className="space-y-3">
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Employee:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('employee')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Applied By:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {appliedBy.name}
              {isSelf && (
                <span className="ml-2 text-xs text-green-500 dark:text-green-400 font-medium">
                  (Self)
                </span>
              )}
              {!isSelf && appliedBy.role !== '-' && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                  ({appliedBy.role})
                </span>
              )}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Leave Type:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('type')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              From Date:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('fromDate')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              To Date:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('toDate')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Days:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('days')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Claim Salary:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('claimSalary')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Document:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {hasDocument() ? (
                <button
                  onClick={() => onViewDocument(getRawDoc())}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <i className="fas fa-file-pdf"></i>
                  View Document
                </button>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">-</span>
              )}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Reason:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('reason')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Status:
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusClass(getField('status'))}`}
            >
              {getField('status')}
            </span>
          </div>
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
              Processed By:
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getField('processedBy')}
            </span>
          </div>
          {getField('rejectionReason') && getField('rejectionReason') !== '-' && (
            <div className="flex py-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28">
                Rejection Reason:
              </span>
              <span className="text-red-600 dark:text-red-400 break-words">
                {getField('rejectionReason')}
              </span>
            </div>
          )}
        </div>

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

export default LeaveModal;