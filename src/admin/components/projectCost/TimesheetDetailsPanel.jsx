// src/admin/components/projectCost/TimesheetDetailsPanel.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const TimesheetDetailsPanel = ({ isOpen, data, loading, onClose, onEdit, onDelete, onUpdateStatus }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalize status for checks and styling
  const status = (data?.status || "Pending").toLowerCase();
  const isPending = status === "pending";

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[890] transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 bottom-0 right-0 w-full md:w-1/2 h-screen bg-white dark:bg-gray-800 shadow-2xl z-[900] flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Timesheet Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">ID: #{data?.id || "-"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl text-green-500 mb-3"></i>
              <p className="text-sm">Loading details...</p>
            </div>
          ) : !data ? (
            <p className="text-center text-gray-500 italic">No data available.</p>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Employee</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.employee_name || data.employee?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Project</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.project_name || data.project?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.date || data.log_date || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Hours Logged</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.hours || data.total_hours || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>{data.status || "Pending"}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description / Task</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                  {data.description || data.task_description || "No description provided."}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button onClick={() => onEdit(data)} disabled={!data} className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50">
              <i className="fas fa-edit mr-1"></i> Edit
            </button>
            <button onClick={() => onDelete(data)} disabled={!data} className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50">
              <i className="fas fa-trash-alt mr-1"></i> Delete
            </button>
          </div>
          
          {/* Fixed status check here */}
          {isPending && (
             <div className="flex gap-2">
               <button onClick={() => onUpdateStatus(data.id, "Rejected")} className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40">Reject</button>
               <button onClick={() => onUpdateStatus(data.id, "Approved")} className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">Approve</button>
             </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default TimesheetDetailsPanel;