// src/admin/pages/projects/Timesheets.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";

import {
  fetchTimesheets,
  fetchTimesheetById,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
  approveTimesheet,
  rejectTimesheet,
  bulkApproveTimesheets,
  bulkRejectTimesheets,
  exportTimesheets,
  clearTimesheetError,
  clearSelectedTimesheet,
} from "../store/slices/timesheetSlice";

import PeriodSelector from "../components/projectCost/PeriodSelector";
import ExportModal from "../../components/common/ExportModal";
import TimesheetModal from "../components/projectCost/TimesheetModal";
import TimesheetDetailsPanel from "../components/projectCost/TimesheetDetailsPanel";
import ConfirmModal from "../components/common/ConfirmModal";
import SearchableSelect from "../../components/common/SearchableSelect"; 
import Pagination from "../components/common/Paginations"; 

const toISODate = (d) => d.toISOString().split("T")[0];

const getPresetRange = (preset) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "this_month": return { start: toISODate(new Date(y, m, 1)), end: toISODate(new Date(y, m + 1, 0)) };
    case "last_month": return { start: toISODate(new Date(y, m - 1, 1)), end: toISODate(new Date(y, m, 0)) };
    case "this_quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { start: toISODate(new Date(y, qStart, 1)), end: toISODate(new Date(y, qStart + 3, 0)) };
    }
    default: return { start: null, end: null };
  }
};

const Timesheets = () => {
  const dispatch = useDispatch();
  const { records, stats, pagination, selectedTimesheet, loading, actionLoading, exportLoading, error } = useSelector((state) => state.timesheets);
  const safeRecords = Array.isArray(records) ? records : [];

  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState(toISODate(new Date()));
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals & Panels state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Bulk Selection & Delete Confirm State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Employee Filter state
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // Extract unique employees from the fetched records for the filter dropdown
  const employeeOptions = useMemo(() => {
    const map = new Map();
    safeRecords.forEach(r => {
      if (r.employee) {
        const val = r.employee.user_id;
        if (val && !map.has(val)) {
          map.set(val, r.employee.name);
        }
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value: String(value),
      label,
    }));
  }, [safeRecords]);

  const resolveRange = useCallback(() => {
    return period === "custom" ? { start: customStart, end: customEnd } : getPresetRange(period);
  }, [period, customStart, customEnd]);

  const refreshData = useCallback(() => {
    const { start, end } = resolveRange();
    dispatch(fetchTimesheets({ 
      start_date: start, 
      end_date: end, 
      filter: period,
      user_id: selectedEmployee || undefined,
      page: currentPage, // Pass page to API
    }));
  }, [dispatch, resolveRange, period, selectedEmployee, currentPage]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [period, customStart, customEnd, selectedEmployee]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearTimesheetError());
    }
  }, [error, dispatch]);

  // Handlers
  const handleOpenPanel = (record) => {
    setIsPanelOpen(true);
    dispatch(fetchTimesheetById(record.id));
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    dispatch(clearSelectedTimesheet());
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
    setIsPanelOpen(false);
  };

  const handleSaveForm = async (formData) => {
    try {
      if (formData.id) {
        await dispatch(updateTimesheet({ id: formData.id, data: formData })).unwrap();
        showToast("Timesheet updated successfully", "success");
      } else {
        await dispatch(createTimesheet(formData)).unwrap();
        showToast("Timesheet created successfully", "success");
      }
      setIsFormOpen(false);
      refreshData();
    } catch (e) {
      showToast(e || "Failed to save timesheet", "error");
    }
  };

  const handleDeleteTrigger = (record) => {
    setRecordToDelete(record);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await dispatch(deleteTimesheet(recordToDelete.id)).unwrap();
      showToast("Timesheet deleted successfully", "success");
      setIsDeleteOpen(false);
      setRecordToDelete(null);
      handleClosePanel();
      refreshData();
    } catch (e) {
      showToast(e || "Failed to delete timesheet", "error");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      if (status === "Approved") {
        await dispatch(approveTimesheet(id)).unwrap();
        showToast("Timesheet approved", "success");
      } else {
        await dispatch(rejectTimesheet({ id, reason: "Rejected by Admin" })).unwrap();
        showToast("Timesheet rejected", "success");
      }
      refreshData();
      if (isPanelOpen) dispatch(fetchTimesheetById(id));
    } catch (e) {
      showToast(e || "Failed to update status", "error");
    }
  };

  // Bulk Handlers - Fixed to use lowercase 'pending'
  const pendingRecords = safeRecords.filter(r => (r.status || "").toLowerCase() === "pending");
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pendingRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      if (action === "Approved") {
        await dispatch(bulkApproveTimesheets(selectedIds)).unwrap();
        showToast(`${selectedIds.length} timesheets approved`, "success");
      } else {
        await dispatch(bulkRejectTimesheets({ ids: selectedIds, reason: "Bulk rejected" })).unwrap();
        showToast(`${selectedIds.length} timesheets rejected`, "success");
      }
      setSelectedIds([]);
      refreshData();
    } catch (e) {
      showToast(e || "Bulk action failed", "error");
    }
  };

  const handleExport = async (format) => {
    const { start, end } = resolveRange();
    try {
      await dispatch(exportTimesheets({ 
        format, 
        filters: { 
          start_date: start, 
          end_date: end, 
          filter: period,
          user_id: selectedEmployee || undefined,
        } 
      })).unwrap();
      showToast(`Timesheets exported as ${format.toUpperCase()}`, "success");
      setIsExportOpen(false);
    } catch (e) {
      showToast(e || "Export failed", "error");
    }
  };

  const isAllSelected = pendingRecords.length > 0 && pendingRecords.every(r => selectedIds.includes(r.id));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent tracking-tight flex items-center gap-3">
            Timesheets & Hours
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage and approve employee hours logged against projects.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg transition-all"
          >
            <i className="fas fa-plus-circle"></i> Add Entry
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={exportLoading}
            className="px-4 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs md:text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            <i className="fas fa-file-export"></i> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <i className="fas fa-clock text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Logged Hours</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {stats?.total_logged_hours_formatted || `${stats?.total_logged_hours || 0}h`}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <i className="fas fa-hourglass-half text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {stats?.pending_approvals_count || 0}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Approved Hours</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {stats?.approved_hours_formatted || `${stats?.approved_hours || 0}h`}
            </p>
          </div>
        </div>
      </div>

            {/* Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="flex-1">
          <PeriodSelector 
            period={period} 
            setPeriod={setPeriod} 
            customStart={customStart} 
            setCustomStart={setCustomStart} 
            customEnd={customEnd} 
            setCustomEnd={setCustomEnd} 
          />
        </div>
        
        {/* Employee Filter Dropdown - matched to PeriodSelector height */}
        <div className="w-full lg:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm flex flex-col justify-center">
          <SearchableSelect
            label="Filter by Employee"
            placeholder="All Employees"
            options={employeeOptions}
            value={selectedEmployee}
            onChange={(val) => {
              setSelectedEmployee(val);
              setSelectedIds([]); 
            }}
            clearable={true}
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center justify-between animate-fadeIn">
          <div className="text-sm font-semibold text-green-800 dark:text-green-300">
            {selectedIds.length} timesheet(s) selected
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction("Approved")} className="px-4 py-1.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600">
              Approve Selected
            </button>
            <button onClick={() => handleBulkAction("Rejected")} className="px-4 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">
              Reject Selected
            </button>
            <button onClick={() => setSelectedIds([])} className="px-4 py-1.5 text-xs font-bold text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left w-10">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-green-500 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                      <i className="fas fa-spinner fa-spin mr-2 text-green-500"></i> Loading timesheets...
                    </td>
                  </tr>
                ) : safeRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                      No timesheet records found for this period.
                    </td>
                  </tr>
                ) : (
                  safeRecords.map((r) => {
                    const status = (r.status || "Pending").toLowerCase();
                    const isPending = status === "pending";
                    
                    const avatarUrl = r.employee?.avatar || r.employee_avatar || null;
                    const empName = r.employee?.name || r.employee_name || "Unknown";

                    return (
                      <tr 
                        key={r.id} 
                        onClick={() => handleOpenPanel(r)}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                          selectedIds.includes(r.id) ? "bg-green-50/50 dark:bg-green-900/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                           {isPending && (
                             <input 
                               type="checkbox" 
                               checked={selectedIds.includes(r.id)}
                               onChange={() => handleSelectRow(r.id)}
                               className="w-4 h-4 text-green-500 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                             />
                           )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={empName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold text-xs">
                                  {empName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{empName}</p>
                              {r.approver?.name && (
                                <p className="text-[11px] text-gray-500">Approved by: {r.approver?.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{r.project?.name || r.project_name || "Unknown"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{r.date || r.log_date || "-"}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-gray-800 dark:text-gray-200">{r.hours_formatted || `${r.hours || r.total_hours || 0}h`}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {r.status_label || r.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleUpdateStatus(r.id, "Approved")} className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 transition-colors" title="Approve">
                                <i className="fas fa-check"></i>
                              </button>
                              <button onClick={() => handleUpdateStatus(r.id, "Rejected")} className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors" title="Reject">
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No actions needed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.last_page || 1}
          onPageChange={setCurrentPage}
          totalItems={pagination.total}
          itemsPerPage={pagination.per_page || 50}
        />
      )}

      {/* Modals & Panels */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} onExport={handleExport} title="Export Timesheets" totalRecords={safeRecords.length} formats={["excel", "pdf", "csv"]} defaultFormat="excel" loading={exportLoading} />
      
      <TimesheetModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveForm} 
        initialData={editingRecord} 
        loading={actionLoading} 
      />
      
      <TimesheetDetailsPanel
        isOpen={isPanelOpen}
        data={selectedTimesheet}
        loading={actionLoading && !selectedTimesheet}
        onClose={handleClosePanel}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTrigger}
        onUpdateStatus={handleUpdateStatus}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Timesheet"
        message="Are you sure you want to permanently delete this timesheet entry? This action cannot be undone."
        confirmText="Delete"
        type="delete"
        loading={actionLoading}
      />
    </div>
  );
};

export default Timesheets;