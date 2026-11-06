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

  // Selected Employee Group for Sidebar Drawer
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Employee Filter state
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState("grid");

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

  // Group timesheet records by employee for the Employee List view
  const employeeGroups = useMemo(() => {
    const map = new Map();
    safeRecords.forEach((record) => {
      const empId =
        record.employee?.user_id ||
        record.employee?.id ||
        record.employee_id ||
        record.user_id ||
        "unknown";

      if (!map.has(empId)) {
        map.set(empId, {
          id: empId,
          employee: record.employee || {
            name: record.employee_name || "Unknown",
            avatar: record.employee_avatar || null,
            user_id: empId,
          },
          approver: record.approver,
          totalHours: 0,
          pendingRecords: [],
          approvedRecords: [],
          rejectedRecords: [],
          records: [],
        });
      }

      const group = map.get(empId);
      const hrs = parseFloat(record.hours || record.total_hours || 0) || 0;
      group.totalHours += hrs;

      const status = (record.status || "Pending").toLowerCase();
      if (status === "pending") {
        group.pendingRecords.push(record);
      } else if (status === "approved") {
        group.approvedRecords.push(record);
      } else if (status === "rejected") {
        group.rejectedRecords.push(record);
      }

      group.records.push(record);
    });

    return Array.from(map.values()).map((g) => {
      let statusType = "approved";
      let statusLabel = "Approved";

      if (g.pendingRecords.length > 0) {
        statusType = "pending";
        statusLabel = "Pending";
      } else if (g.records.some((r) => (r.status || "").toLowerCase() === "rejected")) {
        statusType = "rejected";
        statusLabel = "Rejected";
      }

      return {
        ...g,
        statusType,
        statusLabel,
        totalHoursFormatted: `${Math.round(g.totalHours * 10) / 10}h`,
      };
    });
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
    setSelectedGroup(null);
  };

  const handleEmployeeCardClick = (group) => {
    setSelectedGroup(group);
    if (group.records && group.records.length > 0) {
      handleOpenPanel(group.records[0]);
    }
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

      {/* Stats Cards - Redesigned matching reference style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Logged Hours */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-soft">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 shadow-xs flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <i className="fas fa-clock text-xl"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
              {stats?.total_logged_hours_formatted || `${stats?.total_logged_hours || 0}h`}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">
              Total Logged Hours
            </p>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-soft">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/50 shadow-xs flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <i className="fas fa-hourglass-half text-xl"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
              {stats?.pending_approvals_count || 0}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">
              Pending Approvals
            </p>
          </div>
        </div>

        {/* Card 3: Approved Hours */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-soft">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-900/50 shadow-xs flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl lg:text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
              {stats?.approved_hours_formatted || `${stats?.approved_hours || 0}h`}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">
              Approved Hours
            </p>
          </div>
        </div>
      </div>

      {/* Unified Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-4 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <PeriodSelector 
            period={period} 
            setPeriod={setPeriod} 
            customStart={customStart} 
            setCustomStart={setCustomStart} 
            customEnd={customEnd} 
            setCustomEnd={setCustomEnd} 
            className="mb-0 p-0 border-0 shadow-none bg-transparent dark:bg-transparent"
          />
        </div>
        
        {/* Right Controls: Employee Filter + View Mode Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-full sm:w-64">
            <SearchableSelect
              placeholder="Filter by Employee..."
              options={employeeOptions}
              value={selectedEmployee}
              onChange={(val) => {
                setSelectedEmployee(val);
                setSelectedIds([]); 
              }}
              clearable={true}
            />
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-xs"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="Grid View"
            >
              <i className="fas fa-th-large text-sm"></i>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-xs"
                  : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              title="List View"
            >
              <i className="fas fa-list text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Employee List or Grid View */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 shadow-soft">
          <i className="fas fa-spinner fa-spin mr-2 text-green-500 text-lg"></i> Loading employees...
        </div>
      ) : employeeGroups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 shadow-soft">
          No employees with timesheet records found for this period.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fadeIn">
          {employeeGroups.map((group) => {
            const avatarUrl = group.employee?.avatar || group.employee?.employee_avatar || null;
            const empName = group.employee?.name || group.employee?.employee_name || "Unknown";
            const approverName = group.approver?.name || group.records[0]?.approver?.name || null;

            const isApproved = group.statusType === "approved";
            const isPending = group.statusType === "pending";

            return (
              <div
                key={group.id}
                onClick={() => handleEmployeeCardClick(group)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-soft hover:shadow-soft-lg hover:border-green-500 dark:hover:border-green-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Row: Employee Name & Total Hours badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate"
                      title={empName}
                    >
                      {empName}
                    </p>
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/70 px-2 py-0.5 rounded-md shrink-0">
                      {group.totalHoursFormatted}
                    </span>
                  </div>

                  {/* Middle Row: Avatar + Approver + Status Pill */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={empName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold text-xs">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        {approverName ? (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            Approved by: {approverName}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 truncate">ID: #{group.id}</p>
                        )}
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="shrink-0">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                          <i className="fas fa-clock text-[9px]"></i> Pending
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/60 px-2 py-0.5 rounded-full">
                          <i className="fas fa-check text-[9px]"></i> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/60 px-2 py-0.5 rounded-full">
                          <i className="fas fa-times text-[9px]"></i> Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Row: Log count & View action */}
                <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {group.records.length} log{group.records.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Timesheets</span>
                    <i className="fas fa-chevron-right text-[10px]"></i>
                  </span>
                </div>

                {/* Colored Accent Line at the Bottom (matching reference image) */}
                <div
                  className={`h-1 w-full rounded-full mt-2.5 transition-all ${
                    isPending
                      ? "bg-amber-400"
                      : isApproved
                      ? "bg-green-500"
                      : "bg-red-400"
                  }`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-soft animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-5">Total Hours</th>
                  <th className="py-3.5 px-5">Logs</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                {employeeGroups.map((group) => {
                  const avatarUrl = group.employee?.avatar || group.employee?.employee_avatar || null;
                  const empName = group.employee?.name || group.employee?.employee_name || "Unknown";
                  const approverName = group.approver?.name || group.records[0]?.approver?.name || null;
                  const isApproved = group.statusType === "approved";
                  const isPending = group.statusType === "pending";

                  return (
                    <tr
                      key={group.id}
                      onClick={() => handleEmployeeCardClick(group)}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 cursor-pointer transition-colors group"
                    >
                      {/* Employee */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={empName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold text-xs">
                                {empName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors truncate">
                              {empName}
                            </p>
                            {approverName ? (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                Approved by: {approverName}
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-400 truncate">ID: #{group.id}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Logged Hours */}
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/70 px-2.5 py-1 rounded-md">
                          {group.totalHoursFormatted}
                        </span>
                      </td>

                      {/* Logs count */}
                      <td className="py-4 px-5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {group.records.length} log{group.records.length === 1 ? "" : "s"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full">
                            <i className="fas fa-clock text-[9px]"></i> Pending
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/60 px-2.5 py-0.5 rounded-full">
                            <i className="fas fa-check text-[9px]"></i> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/60 px-2.5 py-0.5 rounded-full">
                            <i className="fas fa-times text-[9px]"></i> Rejected
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 group-hover:translate-x-0.5 transition-transform">
                          <span>View Timesheets</span>
                          <i className="fas fa-chevron-right text-[10px]"></i>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        records={selectedGroup?.records || []}
        onSelectRecord={(rec) => handleOpenPanel(rec)}
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