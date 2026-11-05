// src/admin/components/projectCost/TimesheetDetailsPanel.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const TimesheetDetailsPanel = ({
  isOpen,
  data,
  loading,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  records = [],
  onSelectRecord,
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalize status for checks and styling
  const status = (data?.status || "Pending").toLowerCase();
  const isPending = status === "pending";

  const empName = data?.employee_name || data?.employee?.name || "Unknown Employee";
  const avatarUrl = data?.employee?.avatar || data?.employee_avatar || null;
  const approverName = data?.approver?.name || data?.approver_name || null;
  const projectName = data?.project_name || data?.project?.name || "Unassigned Project";
  const empId = data?.employee?.user_id || data?.employee?.id || data?.user_id || "-";

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[890] transition-opacity"
        onClick={onClose}
      ></div>

      <div className="fixed top-0 bottom-0 right-0 w-full sm:w-[620px] md:w-[720px] lg:w-[800px] max-w-full h-screen bg-white dark:bg-gray-800 shadow-2xl z-[900] flex flex-col animate-slide-in-right border-l border-gray-100 dark:border-gray-700/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-lg shadow-xs">
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Timesheet Details</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300">
                  #{data?.id || "-"}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                Logged time record and activity details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Close"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl text-green-500 mb-3"></i>
              <p className="text-sm font-medium">Loading details...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-400">
              <i className="fas fa-folder-open text-3xl mb-2 text-gray-300 dark:text-gray-600"></i>
              <p className="text-sm italic">No data available.</p>
            </div>
          ) : (
            <>
              {/* Multi-log Tabs Switcher (if employee has multiple records) */}
              {records && records.length > 1 && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                  <div className="px-1 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Timesheet Logs ({records.length})</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {records.map((rec, idx) => {
                      const isCurrent = String(rec.id) === String(data?.id);
                      const recStatus = (rec.status || "Pending").toLowerCase();
                      return (
                        <button
                          key={rec.id || idx}
                          type="button"
                          onClick={() => onSelectRecord && onSelectRecord(rec)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            isCurrent
                              ? "bg-green-500 text-white shadow-sm"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <span>{rec.project?.name || rec.project_name || `Log #${idx + 1}`}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isCurrent
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {rec.hours_formatted || `${rec.hours || rec.total_hours || 0}h`}
                          </span>
                          {recStatus === "pending" && (
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Employee Hero Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/60 dark:from-gray-700/40 dark:to-gray-800 p-4.5 rounded-2xl border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={empName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-green-600 dark:text-green-400 font-extrabold text-base">
                        {empName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={empName}>
                      {empName}
                    </p>
                    {approverName ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        <i className="fas fa-user-check text-[10px] mr-1 text-green-500"></i>
                        Approved by: <span className="font-semibold text-gray-700 dark:text-gray-300">{approverName}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 truncate mt-0.5">ID: #{empId}</p>
                    )}
                  </div>
                </div>

                {/* Status Pill in hero banner */}
                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800/80"
                        : status === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/80"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"
                    }`}
                  >
                    <i
                      className={`fas ${
                        status === "approved"
                          ? "fa-check-circle"
                          : status === "rejected"
                          ? "fa-times-circle"
                          : "fa-clock"
                      } text-[10px]`}
                    ></i>
                    {data.status || "Pending"}
                  </span>
                </div>
              </div>

              {/* 2x2 Visual Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Project Tile */}
                <div className="bg-gray-50/70 dark:bg-gray-750/30 border border-gray-200/80 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <i className="fas fa-project-diagram text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Project
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5" title={projectName}>
                      {projectName}
                    </p>
                  </div>
                </div>

                {/* Hours Logged Tile */}
                <div className="bg-gray-50/70 dark:bg-gray-750/30 border border-gray-200/80 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <i className="fas fa-clock text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Hours Logged
                    </p>
                    <p className="text-base font-extrabold text-gray-800 dark:text-gray-100 mt-0.5">
                      {data.hours || data.total_hours || 0}h
                    </p>
                  </div>
                </div>

                {/* Date Tile */}
                <div className="bg-gray-50/70 dark:bg-gray-750/30 border border-gray-200/80 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                    <i className="fas fa-calendar-day text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Date
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                      {data.date || data.log_date || "-"}
                    </p>
                  </div>
                </div>

                {/* Approval Tile */}
                <div className="bg-gray-50/70 dark:bg-gray-750/30 border border-gray-200/80 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <i className="fas fa-shield-alt text-sm"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Approval Status
                    </p>
                    <p
                      className={`text-sm font-bold capitalize mt-0.5 ${
                        status === "approved"
                          ? "text-green-600 dark:text-green-400"
                          : status === "rejected"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {data.status || "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description / Task Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4.5 shadow-xs">
                <div className="flex items-center gap-2 mb-2.5">
                  <i className="fas fa-align-left text-xs text-green-500"></i>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description / Task Notes
                  </h4>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/60 rounded-xl p-3.5">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {data.description || data.task_description || (
                      <span className="italic text-gray-400">No task description provided for this log.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Optional Rejection Reason Alert */}
              {(data.rejection_reason || data.reject_reason || data.reason) && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-2xl p-4 flex items-start gap-3">
                  <i className="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                      Rejection Reason
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      {data.rejection_reason || data.reject_reason || data.reason}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(data)}
              disabled={!data}
              className="px-4 py-2 rounded-full text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <i className="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete(data)}
              disabled={!data}
              className="px-4 py-2 rounded-full text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <i className="fas fa-trash-alt"></i>
              <span>Delete</span>
            </button>
          </div>

          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateStatus(data.id, "Rejected")}
                className="px-4 py-2 rounded-full text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-1.5"
              >
                <i className="fas fa-times"></i>
                <span>Reject</span>
              </button>
              <button
                onClick={() => onUpdateStatus(data.id, "Approved")}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm flex items-center gap-1.5"
              >
                <i className="fas fa-check"></i>
                <span>Approve</span>
              </button>
            </div>
          ) : status === "rejected" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateStatus(data.id, "Approved")}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-green-500 hover:bg-green-600 transition-all shadow-sm flex items-center gap-1.5"
                title="Change status to Approved"
              >
                <i className="fas fa-check"></i>
                <span>Approve Timesheet</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateStatus(data.id, "Rejected")}
                className="px-4 py-2 rounded-full text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-1.5"
                title="Change status to Rejected"
              >
                <i className="fas fa-times"></i>
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default TimesheetDetailsPanel;
