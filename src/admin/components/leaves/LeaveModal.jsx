// src/admin/components/leaves/LeaveModal.jsx

import { useSelector } from "react-redux";
import { FiEye } from "react-icons/fi";

const LeaveModal = ({ 
  isOpen, 
  leave, 
  onClose, 
  onViewDocument 
}) => {
  const { user } = useSelector((state) => state.auth);
  
  // Check user role
  const userType = user?.type || '';
  const isAdminOrHR = userType === 'admin' || userType === 'hr';
  const isManager = userType === 'manager';
  const isTeamLead = userType === 'team_lead';

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

  // Helper to get the raw document value
  const getRawDoc = () => {
    return leave.document_path || leave.document || leave.doc || null;
  };

  // Helper to get document name from path
  const getDocumentName = () => {
    const docPath = getRawDoc();
    if (!docPath) return null;
    const parts = docPath.split('/');
    return parts[parts.length - 1] || 'document';
  };

  // Helper to get applied by info with proper role
  const getAppliedByInfo = () => {
    if (!leave.applied_by) {
      return { name: '-', role: '-', userId: null };
    }
    
    const appliedBy = leave.applied_by;
    let name = appliedBy.employee_name || appliedBy.name || '-';
    let role = '-';
    
    if (appliedBy.role) {
      role = typeof appliedBy.role === 'object' ? appliedBy.role.name : appliedBy.role;
    }
    
    if (role === '-' && appliedBy.role_id) {
      role = `Role ${appliedBy.role_id}`;
    }
    
    return {
      name: name,
      role: role,
      userId: appliedBy.user_id || null,
    };
  };

  // Helper to get approver info with full name and role
  const getApproverInfo = () => {
    if (!leave.approver) {
      return { name: '-', role: '-', userId: null };
    }
    
    const approver = leave.approver;
    let name = '-';
    let role = '-';
    
    if (approver.employee) {
      const emp = approver.employee;
      name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || '-';
    } else {
      name = approver.name || approver.username || approver.email || '-';
    }
    
    if (approver.role) {
      role = typeof approver.role === 'object' ? approver.role.name : approver.role;
    }
    
    if (role === '-' && approver.role_id) {
      role = `Role ${approver.role_id}`;
    }
    
    return {
      name: name,
      role: role,
      userId: approver.id || null,
    };
  };

  // Get approval from specific level
  const getApprovalByLevel = (level) => {
    if (!leave.approvals || !Array.isArray(leave.approvals)) {
      return null;
    }
    return leave.approvals.find(a => a.approver_level === level);
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
    
    const employeeId = leave.employee_id || leave.employee?.id;
    if (employeeId && appliedByUserId) {
      return String(employeeId) === String(appliedByUserId);
    }
    
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
      employee: leave.employee_name || 
                leave.employee?.name || 
                (leave.employee && `${leave.employee.first_name || ''} ${leave.employee.last_name || ''}`.trim()) ||
                leave.employee || 
                '-',
      type: leave.leave_type?.name || leave.type || '-',
      fromDate: formatDate(leave.start_date || leave.from_date || leave.fromDate),
      toDate: formatDate(leave.end_date || leave.to_date || leave.toDate),
      days: leave.duration_days || leave.number_of_days || leave.days || '-',
      claimSalary: leave.claim_salary === 1 || leave.claim_salary === "1" || leave.claimSalary === 'Yes' ? 'Yes' : 'No',
      doc: leave.document_path || leave.document || leave.doc || '-',
      reason: leave.reason || '-',
      status: leave.status || 'pending',
      rejectionReason: leave.rejection_reason || leave.rejectionReason || leave.admin_remark,
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
  const approver = getApproverInfo();
  const isSelf = isSelfApplied();
  const rawDoc = getRawDoc();
  const status = getField('status');
  const docName = getDocumentName();

  // Get approval data
  const teamLeadApproval = getApprovalByLevel('team_lead');
  const managerApproval = getApprovalByLevel('manager');
  const hrApproval = getApprovalByLevel('hr');

  // Determine which approval sections to show
  const showTeamLeadApproval = true;
  const showManagerApproval = isAdminOrHR || isManager;
  const showHrApproval = isAdminOrHR;

  // Get approver name for each level
  const getApproverName = (approval) => {
    if (!approval?.approver?.employee) return null;
    const emp = approval.approver.employee;
    return `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name;
  };

  // Get approval status icon
  const getStatusIcon = (approval) => {
    if (!approval) return 'fa-hourglass-half';
    if (approval.status === 'approved') return 'fa-check-circle';
    if (approval.status === 'rejected') return 'fa-times-circle';
    return 'fa-hourglass-half';
  };

  // Build approval chain array
  const getApprovalChain = () => {
    const chain = [];
    
    if (showTeamLeadApproval) {
      chain.push({
        level: 'Team Lead',
        icon: 'fa-user-tie',
        approval: teamLeadApproval,
        name: getApproverName(teamLeadApproval),
        status: teamLeadApproval?.status || 'pending'
      });
    }
    
    if (showManagerApproval) {
      chain.push({
        level: 'Manager',
        icon: 'fa-user-cog',
        approval: managerApproval,
        name: getApproverName(managerApproval),
        status: managerApproval?.status || 'pending'
      });
    }
    
    if (showHrApproval) {
      chain.push({
        level: 'HR',
        icon: 'fa-user-shield',
        approval: hrApproval,
        name: getApproverName(hrApproval),
        status: hrApproval?.status || 'pending'
      });
    }
    
    return chain;
  };

  const approvalChain = getApprovalChain();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <i className="fas fa-eye text-green-500"></i>
          Leave Request Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Employee:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('employee')}
            </span>
          </div>
          
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
              {!isSelf && appliedBy.role !== '-' && (
                <span className="ml-2 text-xs text-blue-500 dark:text-blue-400">
                  ({appliedBy.role})
                </span>
              )}
            </span>
          </div>

          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Leave Type:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('type')}
            </span>
          </div>

          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              From Date:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('fromDate')}
            </span>
          </div>

          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              To Date:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('toDate')}
            </span>
          </div>

          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Days:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('days')}
            </span>
          </div>

          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Claim Salary:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {getField('claimSalary')}
            </span>
          </div>

          {/* Document Section - View Only */}
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Document:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words flex items-center gap-2 flex-wrap">
              {hasDocument() ? (
                <>
                  <button
                    onClick={() => onViewDocument(rawDoc)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                  >
                    <FiEye size={14} />
                    View Document
                  </button>
                  {docName && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({docName})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">No document attached</span>
              )}
            </span>
          </div>

          {/* Reason - spans full width with proper text wrapping */}
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 col-span-1 sm:col-span-2 items-start">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0 pt-0.5">
              Reason:
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 dark:text-gray-400 break-words whitespace-pre-wrap word-break-break-word overflow-hidden">
                {getField('reason')}
              </p>
            </div>
          </div>

          {/* Status with proper alignment */}
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Status:
            </span>
            <span
              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusClass(status)}`}
            >
              {status}
            </span>
          </div>

          {/* Processed By with full name and role */}
          <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 items-center min-h-[44px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
              Processed By:
            </span>
            <span className="text-gray-600 dark:text-gray-400 break-words">
              {status !== 'pending' ? (
                <div className="flex flex-col">
                  <span className="font-medium">{approver.name}</span>
                  {approver.role !== '-' && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {approver.role}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">-</span>
              )}
            </span>
          </div>

          {/* Rejection Reason - spans full width if present */}
          {getField('rejectionReason') && getField('rejectionReason') !== '-' && (
            <div className="flex py-2 col-span-1 sm:col-span-2 items-start">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-28 flex-shrink-0 pt-0.5">
                Rejection Reason:
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-red-600 dark:text-red-400 break-words whitespace-pre-wrap word-break-break-word overflow-hidden">
                  {getField('rejectionReason')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Approval Chain */}
        {approvalChain.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <i className="fas fa-sitemap text-green-500"></i>
              Approval Chain
            </h4>
            
            <div className="flex items-center justify-center gap-0 py-4 overflow-x-auto px-2">
              {approvalChain.map((item, index) => (
                <div key={item.level} className="flex items-center">
                  {/* Approval Card */}
                  <div className={`relative flex flex-col items-center min-w-[140px] p-4 rounded-xl border-2 transition-all duration-200 ${
                    item.status === 'approved' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md shadow-green-100 dark:shadow-green-900/20' 
                      : item.status === 'rejected'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md shadow-red-100 dark:shadow-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    {/* Status Indicator Dot */}
                    <div className="absolute -top-2 -right-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                        item.status === 'approved' 
                          ? 'bg-green-500 text-white' 
                          : item.status === 'rejected'
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        <i className={`fas ${getStatusIcon(item.approval)} text-xs`}></i>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                      item.status === 'approved' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' 
                        : item.status === 'rejected'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                    }`}>
                      <i className={`fas ${item.icon} text-xl`}></i>
                    </div>

                    {/* Level Name */}
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {item.level}
                    </div>

                    {/* Approver Name */}
                    {item.name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.name}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="mt-2">
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <i className="fas fa-check mr-1"></i> Approved
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <i className="fas fa-times mr-1"></i> Rejected
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <i className="fas fa-clock mr-1"></i> Pending
                        </span>
                      )}
                    </div>

                    {/* Remark */}
                    {item.approval?.remark && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic max-w-[120px] truncate">
                        "{item.approval.remark}"
                      </div>
                    )}
                  </div>

                  {/* Arrow between cards */}
                  {index < approvalChain.length - 1 && (
                    <div className="flex items-center px-3 text-gray-400 dark:text-gray-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
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

export default LeaveModal;