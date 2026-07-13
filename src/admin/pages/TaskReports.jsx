/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "../components/common/Paginations";
import SearchBar from "../components/common/SearchBar";
import EntriesSelector from "../components/common/EntriesSelector";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  fetchTaskReports,
  deleteTaskReport,
  updateTaskReportRemarks
} from "../store/slices/taskReportSlice";
import { fetchEmployees } from "../store/slices/employeeSlice";
import TaskReportModal from "../components/taskReports/TaskReportModal";

const TaskReports = () => {
  const dispatch = useDispatch();
  const {
    taskReports = [],
    loading,
    totalCount,
    currentPage: currentPageState,
    perPage: perPageState
  } = useSelector((state) => state.taskReports || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [remarksText, setRemarksText] = useState("");
  const [selectedReportForRemarks, setSelectedReportForRemarks] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Fetch employees on mount
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Fetch reports when page, perPage, or search changes
  useEffect(() => {
    dispatch(fetchTaskReports({
      page: currentPage,
      perPage: perPage,
      search: searchTerm
    }));
  }, [dispatch, currentPage, perPage, searchTerm]);

  const handleView = (report) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedReport(null);
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setEditModalOpen(true);
  };

  const handleAddRemarks = (report) => {
    setSelectedReportForRemarks(report);
    setRemarksText(report.remarks || "");
    setRemarksModalOpen(true);
  };

  const handleSaveRemarks = async () => {
    await dispatch(updateTaskReportRemarks({
      id: selectedReportForRemarks.id,
      remarks: remarksText
    }));
    setRemarksModalOpen(false);
    setSelectedReportForRemarks(null);
    setRemarksText("");
    // Refresh the list
    dispatch(fetchTaskReports({
      page: currentPage,
      perPage: perPage,
      search: searchTerm
    }));
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    await dispatch(deleteTaskReport(reportToDelete.id));
    setDeleteConfirmOpen(false);
    setReportToDelete(null);
    // Refresh the list
    dispatch(fetchTaskReports({
      page: currentPage,
      perPage: perPage,
      search: searchTerm
    }));
  };

  const handleRemarksModalClose = () => {
    setRemarksModalOpen(false);
    setSelectedReportForRemarks(null);
    setRemarksText("");
  };

  // Calculate stats from fetched data
  const totalReports = totalCount || taskReports.length;
  const uniqueEmployees = [...new Set(taskReports.map((r) => r.employee))].length;
  const today = new Date().toISOString().split("T")[0];
  const todayReports = taskReports.filter((r) => r.date === today).length;

  // Get paginated data (if API doesn't handle pagination)
  const start = (currentPage - 1) * perPage;
  const paginatedReports = taskReports.slice(start, start + perPage);
  const totalPages = Math.ceil(totalReports / perPage);

  // SVG Chart Calculations
  const remarksCount = taskReports.filter(r => r.remarks && r.remarks.trim()).length;
  const safeTotal = totalReports || 1;
  const pctEmployees = (uniqueEmployees / safeTotal) * 100;
  const pctToday = (todayReports / safeTotal) * 100;
  const pctRemarks = (remarksCount / safeTotal) * 100;

  const getStatColor = (val, defaultClass) => {
    if (val === 0) return "text-slate-400 dark:text-slate-500";
    if (val === 5) return "text-blue-600 dark:text-blue-400";
    if (val === 14) return "text-green-600 dark:text-green-400";
    if (val === 18) return "text-blue-600 dark:text-blue-400";
    if (val === 19) return "text-amber-600 dark:text-amber-400";
    return defaultClass;
  };

  const getStatSvgColor = (val, defaultClass) => {
    if (val === 0) return "text-slate-400 dark:text-slate-500";
    if (val === 5) return "text-blue-500";
    if (val === 14) return "text-green-500";
    if (val === 18) return "text-blue-500";
    if (val === 19) return "text-amber-500";
    return defaultClass;
  };

  const getStatBgColor = (val, defaultClass) => {
    if (val === 0) return "bg-slate-400 dark:bg-slate-500";
    if (val === 5) return "bg-blue-500";
    if (val === 14) return "bg-green-500";
    if (val === 18) return "bg-blue-500";
    if (val === 19) return "bg-amber-500";
    return defaultClass;
  };

  return (
    <div className="w-full overflow-x-hidden">

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Task Report
          </h2>
        </div>
      </div>

      {/* Dashboard Layout: 2x2 Grid (Left) + 1 Large Card (Right) */}
      <div className="flex flex-col xl:flex-row gap-5 mb-6">
        {/* Left: 4 Small Cards */}
        <div className="xl:w-7/12 grid grid-cols-2 sm:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-1">Total Reports</div>
              <div className={`text-2xl md:text-3xl font-extrabold ${getStatColor(totalReports, "text-emerald-600 dark:text-emerald-400")}`}>{totalReports}</div>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(totalReports, "text-emerald-500")} strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-1">Employees Reported</div>
              <div className={`text-2xl md:text-3xl font-extrabold ${getStatColor(uniqueEmployees, "text-green-600 dark:text-green-400")}`}>{uniqueEmployees}</div>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(uniqueEmployees, "text-green-500")} strokeDasharray="100, 100" strokeLinecap="round" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-1">Today's Reports</div>
              <div className={`text-2xl md:text-3xl font-extrabold ${getStatColor(todayReports, "text-emerald-500 dark:text-emerald-450")}`}>{todayReports}</div>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(todayReports, "text-emerald-400")} strokeDasharray="60, 100" strokeLinecap="round" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-1">With Remarks</div>
              <div className={`text-2xl md:text-3xl font-extrabold ${getStatColor(remarksCount, "text-teal-600 dark:text-teal-400")}`}>{remarksCount}</div>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(remarksCount, "text-teal-500")} strokeDasharray="45, 100" strokeLinecap="round" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Large Overview Card */}
        <div className="xl:w-5/12 bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 shadow-soft flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-chart-pie text-[#10B981] text-sm"></i>
            <h3 className="font-semibold text-gray-800 dark:text-white text-[15px]">Tasks Overview</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around h-full py-2">
            {/* Dynamic SVG Donut Chart */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-4 sm:mb-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100 dark:text-gray-700" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(uniqueEmployees, "text-green-500")} strokeDasharray={`${pctEmployees}, 100`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(todayReports, "text-emerald-400")} strokeDasharray={`${pctToday}, 100`} strokeDashoffset={-pctEmployees} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={getStatSvgColor(remarksCount, "text-teal-500")} strokeDasharray={`${pctRemarks}, 100`} strokeDashoffset={-(pctEmployees + pctToday)} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center z-10">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total</span>
                <span className={`text-2xl font-extrabold ${getStatColor(totalReports, "text-[#10B981]")}`}>{totalReports}</span>
              </div>
            </div>
            {/* Fake Legend mapping to existing colors from the small cards */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm"><span className={`w-2.5 h-2.5 rounded-full ${getStatBgColor(uniqueEmployees, "bg-green-500")}`}></span><span className="text-gray-600 dark:text-gray-300 w-24">Employees</span><span className="font-semibold text-gray-800 dark:text-white">{uniqueEmployees}</span></div>
              <div className="flex items-center gap-3 text-sm"><span className={`w-2.5 h-2.5 rounded-full ${getStatBgColor(todayReports, "bg-emerald-400")}`}></span><span className="text-gray-600 dark:text-gray-300 w-24">Today</span><span className="font-semibold text-gray-800 dark:text-white">{todayReports}</span></div>
              <div className="flex items-center gap-3 text-sm"><span className={`w-2.5 h-2.5 rounded-full ${getStatBgColor(remarksCount, "bg-teal-500")}`}></span><span className="text-gray-600 dark:text-gray-300 w-24">Remarks</span><span className="font-semibold text-gray-800 dark:text-white">{remarksCount}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft mb-6">
        {/* Section Header */}
        <div className="px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-[16px] font-semibold text-gray-800 dark:text-white">Tasks List</h3>
        </div>

        {/* Action Bar (Rows per page & Search) */}
        <div className="px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <EntriesSelector
            value={perPage}
            onChange={(val) => {
              setPerPage(val);
              setCurrentPage(1);
            }}
          />

          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search task reports..."
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold w-12 text-center uppercase">Sl.No.</th>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold text-left uppercase">Date</th>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold text-left uppercase">Employee Name</th>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold text-left uppercase">Tasks Completed</th>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold text-left uppercase">Plan for Tomorrow</th>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold text-left uppercase">Remarks</th>
                  <th className="px-4 py-3 text-[10px] md:text-xs font-semibold text-right uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500 text-xs md:text-sm">
                      No task reports found.
                    </td>
                  </tr>
                ) : (
                  paginatedReports.map((report, idx) => (
                    <tr
                      key={report.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {start + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                        {report.date}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-800 dark:text-gray-200 font-semibold">
                        {report.employee}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={report.tasksCompleted}>
                        {report.tasksCompleted}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={report.planForTomorrow}>
                        {report.planForTomorrow}
                      </td>
                      <td className="px-4 py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={report.remarks}>
                        {report.remarks && report.remarks.trim() ? (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <i className="fas fa-comment text-gray-400 dark:text-gray-500 text-xs"></i>
                            <span>{report.remarks}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 md:gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => handleView(report)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 transition-colors"
                            title="View Details"
                          >
                            <i className="fas fa-eye text-xs md:text-sm"></i>
                          </button>
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(report)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-emerald-500 transition-colors"
                            title="Edit Report"
                          >
                            <i className="fas fa-edit text-xs md:text-sm"></i>
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteClick(report)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <i className="fas fa-trash text-xs md:text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-3 bg-white dark:bg-gray-800 rounded-b-lg">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalReports}
            itemsPerPage={perPage}
          />
        </div>
      </div>

      {/* View Task Report Modal - Redesigned to match the clean green mockup */}
      {viewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full shadow-soft-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
              <h3 className="text-[17px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs shadow-sm">
                  <i className="fas fa-eye"></i>
                </span>
                Task Report Details
              </h3>
              <button
                onClick={handleViewModalClose}
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Date & Employee details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    DATE
                  </label>
                  <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200">
                    {selectedReport.date}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    EMPLOYEE
                  </label>
                  <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200">
                    {selectedReport.employee}
                  </span>
                </div>
              </div>

              {/* Tasks Completed */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1.5">
                  TASKS COMPLETED
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.tasksCompleted}
                  </p>
                </div>
              </div>

              {/* Plan for Tomorrow */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1.5">
                  PLAN FOR TOMORROW
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.planForTomorrow}
                  </p>
                </div>
              </div>

              {/* Comments / Admin Remarks */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <i className="fas fa-comment text-gray-400"></i>
                  ADMIN REMARKS
                </label>
                <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedReport.remarks && selectedReport.remarks.trim() ? (
                      selectedReport.remarks
                    ) : (
                      <span className="text-gray-400 italic">No remarks added yet</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
              <button
                onClick={handleViewModalClose}
                className="px-5 py-2 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm shadow-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleViewModalClose();
                  handleEdit(selectedReport);
                }}
                className="px-5 py-2 rounded-full font-semibold bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <i className="fas fa-edit text-white"></i>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Remarks Modal */}
      {remarksModalOpen && selectedReportForRemarks && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-soft-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700 mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <i className="fas fa-comment text-green-500 text-xl"></i>
                {selectedReportForRemarks.remarks ? "Edit" : "Add"} Remarks
              </h3>
              <button
                onClick={handleRemarksModalClose}
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="space-y-5">
              {/* Employee & Date container box */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 border border-gray-100 dark:border-gray-700 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[13px] text-gray-400 dark:text-gray-500 font-medium block">
                      Employee:
                    </span>
                    <p className="font-bold text-[15px] text-gray-800 dark:text-gray-200 mt-1">
                      {selectedReportForRemarks.employee}
                    </p>
                  </div>
                  <div>
                    <span className="text-[13px] text-gray-400 dark:text-gray-500 font-medium block">
                      Date:
                    </span>
                    <p className="font-bold text-[15px] text-gray-800 dark:text-gray-200 mt-1">
                      {selectedReportForRemarks.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div>
                <label className="text-[14px] font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                  Admin Remarks
                </label>
                <textarea
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  placeholder="Team completed 90% of sprint tasks"
                  rows="4"
                  className="w-full px-4 py-3 text-[14px] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white resize-none outline-none transition-all"
                />
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-2.5 flex items-center gap-1.5 font-medium">
                  <i className="fas fa-info-circle text-gray-400"></i> Remarks are visible to the employee
                </p>
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 flex justify-end gap-3 bg-white dark:bg-gray-800 rounded-b-xl">
              <button
                onClick={handleRemarksModalClose}
                className="px-5 py-2 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRemarks}
                className="px-5 py-2 rounded-full font-semibold bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 transition-all shadow-md hover:shadow-lg text-sm"
              >
                <i className="fas fa-save"></i>
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Task Report"
        message={`Are you sure you want to delete the task report for "${reportToDelete?.employee}" on ${reportToDelete?.date}? This action cannot be undone.`}
        confirmText="Delete"
      />

      {/* Edit Task Report Modal */}
      <TaskReportModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingReport(null);
          dispatch(fetchTaskReports({
            page: currentPage,
            perPage: perPage,
            search: searchTerm
          }));
        }}
        editingReport={editingReport}
      />
    </div>
  );
};

export default TaskReports;