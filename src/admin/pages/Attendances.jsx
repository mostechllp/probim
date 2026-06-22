/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import SearchBar from "../components/common/SearchBar";
import EntriesSelector from "../components/common/EntriesSelector";
import UploadAttendanceModal from "../components/attendance/UploadAttendanceModal";
import { showToast } from "../../components/common/Toast";
import Pagination from "../components/common/Paginations";
import {
  fetchAttendanceRecords,
  uploadAttendanceFile,
  fetchUploadStatus,
  fetchPunchInToday,
  fetchPunchInYesterday,
  fetchPunchOutToday,
  fetchLateComers,
  fetchAbsentees,
  clearUploadStatus,
} from "../store/slices/attendanceSlice";

const Attendances = () => {
  const dispatch = useDispatch();
  const {
    records,
    uploadStatus,
    uploadStatusId,
    uploadLoading,
    punchInToday,
    lateComers,
    absentees,
    loading,
    stats,
    totalCount,
    lastPage,
    currentPage: reduxCurrentPage,
    perPage: reduxPerPage,
  } = useSelector((state) => state.attendance);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshLoading, setRefreshLoading] = useState(false);

  const pollingRef = useRef(null);
  // Always holds latest filter values — no stale closure issues
  const filtersRef = useRef({ 
    currentPage: reduxCurrentPage || 1, 
    perPage: reduxPerPage || 15, 
    companyFilter, 
    searchTerm, 
    nameFilter 
  });
  
  useEffect(() => {
    filtersRef.current = { 
      currentPage: reduxCurrentPage || 1, 
      perPage: reduxPerPage || 15, 
      companyFilter, 
      searchTerm, 
      nameFilter 
    };
  }, [reduxCurrentPage, reduxPerPage, companyFilter, searchTerm, nameFilter]);

  // ─── Core fetch function — always reads live filters from ref ─────────────
  const fetchAll = useCallback(() => {
    const f = filtersRef.current;
    return Promise.all([
      dispatch(fetchAttendanceRecords({
        page: f.currentPage,
        per_page: f.perPage,
        company: f.companyFilter !== "all" ? f.companyFilter : undefined,
        search: f.searchTerm || undefined,
        name: f.nameFilter || undefined,
      })),
      dispatch(fetchPunchInToday()),
      dispatch(fetchPunchInYesterday()),
      dispatch(fetchPunchOutToday()),
      dispatch(fetchLateComers()),
      dispatch(fetchAbsentees()),
    ]);
  }, [dispatch]);

  // ─── Load data on filter / page change ───────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, [reduxCurrentPage, reduxPerPage, companyFilter, searchTerm, nameFilter]);

  // ─── Stop polling helper ──────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ─── Start polling when upload is processing ──────────────────────────────
  useEffect(() => {
    if (uploadStatusId && uploadStatus === "processing") {
      stopPolling();
      pollingRef.current = setInterval(() => {
        dispatch(fetchUploadStatus(uploadStatusId));
      }, 5000);
    }
    return stopPolling;
  }, [uploadStatusId, uploadStatus]);

  // ─── React to upload status changes — use ref to avoid stale closure ─────
  const handledUploadRef = useRef(null);

  // ─── React to upload status changes ─────────────────────────────────────────
  useEffect(() => {
    if (!uploadStatusId) return;
    if (handledUploadRef.current === uploadStatusId) return;

    if (uploadStatus === "completed") {
      handledUploadRef.current = uploadStatusId;
      stopPolling();
      showToast("Attendance file processed successfully!", "success");
      // Re-fetch data
      fetchAll();
      dispatch(clearUploadStatus());
    } else if (uploadStatus === "failed") {
      handledUploadRef.current = uploadStatusId;
      stopPolling();
      showToast("Failed to process attendance file. Please try again.", "error");
      dispatch(clearUploadStatus());
    }
  }, [uploadStatus, uploadStatusId]);

  // ─── Manual refresh ───────────────────────────────────────────────────────
  const refreshAllData = async () => {
    setRefreshLoading(true);
    try {
      await fetchAll();
      showToast("Data refreshed successfully!", "success");
    } catch {
      showToast("Some data failed to load", "error");
    } finally {
      setRefreshLoading(false);
    }
  };

  // ─── Upload submit ────────────────────────────────────────────────────────
  const handleUploadComplete = async ({ file }) => {
    try {
      const result = await dispatch(uploadAttendanceFile({ file })).unwrap();
      setShowUploadModal(false);

      if (result.status === "completed") {
        showToast("Attendance file uploaded successfully!", "success");
        // Reset to page 1
        handlePageChange(1);
      } else {
        showToast("File uploaded! Processing in background…", "info");
      }
    } catch (error) {
      showToast(typeof error === "string" ? error : error?.message || "Upload failed", "error");
    }
  };

  // ─── Filter / pagination handlers ────────────────────────────────────────
  const handlePageChange = (page) => {
    // We need to re-fetch with the new page
    dispatch(fetchAttendanceRecords({
      page: page,
      per_page: reduxPerPage || 15,
      company: companyFilter !== "all" ? companyFilter : undefined,
      search: searchTerm || undefined,
      name: nameFilter || undefined,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePerPageChange = (value) => {
    // Reset to page 1 when changing items per page
    dispatch(fetchAttendanceRecords({
      page: 1,
      per_page: value,
      company: companyFilter !== "all" ? companyFilter : undefined,
      search: searchTerm || undefined,
      name: nameFilter || undefined,
    }));
  };

  const handleCompanyFilterChange = (e) => {
    const value = e.target.value;
    setCompanyFilter(value);
    // Fetch with new filter, reset to page 1
    dispatch(fetchAttendanceRecords({
      page: 1,
      per_page: reduxPerPage || 15,
      company: value !== "all" ? value : undefined,
      search: searchTerm || undefined,
      name: nameFilter || undefined,
    }));
  };

  const handleNameFilterChange = (e) => {
    const value = e.target.value;
    setNameFilter(value);
    // Fetch with new filter, reset to page 1
    dispatch(fetchAttendanceRecords({
      page: 1,
      per_page: reduxPerPage || 15,
      company: companyFilter !== "all" ? companyFilter : undefined,
      search: searchTerm || undefined,
      name: value || undefined,
    }));
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    // Fetch with new search, reset to page 1
    dispatch(fetchAttendanceRecords({
      page: 1,
      per_page: reduxPerPage || 15,
      company: companyFilter !== "all" ? companyFilter : undefined,
      search: value || undefined,
      name: nameFilter || undefined,
    }));
  };

  // ─── Derived display values ───────────────────────────────────────────────
  const totalFiltered = totalCount || records.length;
  const totalPages = lastPage || Math.ceil(totalFiltered / (reduxPerPage || 15));
  const start = ((reduxCurrentPage || 1) - 1) * (reduxPerPage || 15);
  const isUploading = uploadLoading || uploadStatus === "processing";

  const totalEmployees = stats?.totalActiveEmployees || 0;
  const punchedInCount = stats?.presentToday || 0;
  const lateTodayCount = stats?.punchedLate || 0;
  const absentTodayCount = stats?.absentToday || 0;
  const punchOutCount = stats?.punchedOutToday || 0;

  const getSafeArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const renderEmployeeList = (employees, title) => {
    const arr = getSafeArray(employees);
    if (!arr.length) return null;
    return (
      <div className="absolute hidden group-hover:block z-20 mt-2 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl min-w-[200px] top-full left-0">
        <p className="font-semibold mb-2 text-gray-300 border-b border-gray-700 pb-1">{title}:</p>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {arr.slice(0, 10).map((emp, idx) => (
            <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded-full">
              {typeof emp === "string" ? emp : emp.name || emp.employeeName || emp.employee_name || "Unknown"}
            </span>
          ))}
          {arr.length > 10 && (
            <span className="text-xs text-gray-400 mt-1 block">+{arr.length - 10} more</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-hidden">

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="stats-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {/* ... stats cards remain the same ... */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-1 md:mb-2">
            <i className="fas fa-users text-green-600 dark:text-green-400 text-sm md:text-lg"></i>
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{totalEmployees}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Total Employees</div>
        </div>

        <div className="group relative bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-1 md:mb-2">
            <i className="fas fa-fingerprint text-blue-600 dark:text-blue-400 text-sm md:text-lg"></i>
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{punchedInCount}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Punched In Today</div>
          {renderEmployeeList(punchInToday, "Punched In")}
        </div>

        <div className="group relative bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-1 md:mb-2">
            <i className="fas fa-clock text-amber-600 dark:text-amber-400 text-sm md:text-lg"></i>
          </div>
          <div className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{lateTodayCount}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Late Today</div>
          {renderEmployeeList(lateComers, "Late Comers")}
        </div>

        <div className="group relative bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-1 md:mb-2">
            <i className="fas fa-user-slash text-red-600 dark:text-red-400 text-sm md:text-lg"></i>
          </div>
          <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{absentTodayCount}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Absent Today</div>
          {renderEmployeeList(absentees, "Absentees")}
        </div>

        <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-1 md:mb-2">
            <i className="fas fa-sign-out-alt text-purple-600 dark:text-purple-400 text-sm md:text-lg"></i>
          </div>
          <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">{punchOutCount}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Punch Out Today</div>
        </div>
      </div>

      {/* ── Upload processing banner ─────────────────────────────────────────── */}
      {uploadStatus === "processing" && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
          <i className="fas fa-spinner fa-spin text-blue-500"></i>
          <div className="flex-1">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Processing attendance file…
            </span>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
              The table will refresh automatically when complete.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent flex flex-wrap items-center gap-2">
          Attendance Records
          <span className="text-[10px] md:text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
            <i className="fas fa-calendar-check mr-1"></i> Daily Log
          </span>
        </h2>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
        <select
          value={companyFilter}
          onChange={handleCompanyFilterChange}
          className="px-3 md:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs md:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
        >
          <option value="all">All Companies</option>
          <option value="THESAY">THESAY</option>
          <option value="SAYGEN">SAYGEN</option>
          <option value="warehouse">Warehouse</option>
          <option value="farmassay">Farmassay</option>
        </select>

        <input
          type="text"
          value={nameFilter}
          onChange={handleNameFilterChange}
          placeholder="Employee Name..."
          className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs md:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500 w-full sm:w-48"
        />

        <button
          onClick={refreshAllData}
          disabled={refreshLoading}
          className="px-3 md:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs md:text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <i className={`fas fa-sync-alt text-xs md:text-sm ${refreshLoading ? "fa-spin" : ""}`}></i>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Actions bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
        <EntriesSelector 
          value={reduxPerPage || 15} 
          onChange={handlePerPageChange} 
        />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <SearchBar 
            value={searchTerm} 
            onChange={handleSearchChange} 
            placeholder="Search records..." 
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading && records.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-green-500 mb-3"></i>
          <p className="text-gray-500 dark:text-gray-400">Loading attendance records…</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
            <div className="min-w-[900px] md:min-w-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    {["Sl.No.", "Department", "Employee Name", "Date", "Punch In", "Punch Out", "Status"].map((h) => (
                      <th key={h} className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr
                      key={`${record.employee_id}-${record.date}-${idx}`}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                        {start + idx + 1}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs whitespace-nowrap">
                          <i className="fas fa-building text-gray-500 text-[8px] md:text-xs"></i>
                          {record.department || "-"}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {record.employeeName || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {record.date || "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {record.punchIn}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        {record.hasPunchOut ? (
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{record.punchOut}</span>
                        ) : (
                          <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                            Not Punched Out
                          </span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] md:text-xs font-medium ${
                          record.status === "Present"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Only show if there are items */}
          {totalFiltered > 0 && (
            <Pagination
              currentPage={reduxCurrentPage || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalFiltered}
              itemsPerPage={reduxPerPage || 15}
            />
          )}
        </>
      )}

      <UploadAttendanceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadComplete}
      />
    </div>
  );
};

export default Attendances;