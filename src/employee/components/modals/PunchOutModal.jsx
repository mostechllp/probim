import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiCheckCircle, FiClock, FiSave, FiCalendar, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { showToast } from '../common/Toast';
import apiClient from '../../../utils/apiClient';
import { TimeInput } from '../common/TimeInput';
import { fetchTaskReports, setTaskReportsPagination, setTaskReportsSearch, clearTaskReportsError } from '../../store/slices/taskReportsSlice';

// Punch Out Modal Component
const PunchOutModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [projects, setProjects] = useState([]);
  const [projectTimes, setProjectTimes] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [totalHours, setTotalHours] = useState(0);

  const { user } = useSelector((state) => state.auth);
  const dashboardData = useSelector((state) => state.EmpAttendance?.dashboardData);

  // Calculate total hours whenever project times change
  useEffect(() => {
    let total = 0;
    Object.values(projectTimes).forEach(time => {
      if (time) {
        const [hours, minutes] = time.split(':');
        const hoursDecimal = parseInt(hours) + (parseInt(minutes) / 60);
        total += hoursDecimal;
      }
    });
    setTotalHours(Math.round(total * 10) / 10);
  }, [projectTimes]);

  // Fetch projects when modal opens - using the same endpoint as dashboard
  useEffect(() => {
    if (isOpen) {
      const employeeId = dashboardData?.employee?.id
        || user?.employee?.id
        || user?.id
        || dashboardData?.employee?.employee_id;
      
      if (employeeId) {
        setLoadingProjects(true);
        
        // Use the same endpoint that dashboard uses: /admin/project-assignments/{id}
        apiClient.get(`/admin/project-assignments/${employeeId}`)
          .then((res) => {
            console.log("Projects API response from project-assignments:", res.data);
            
            let projectsData = [];
            
            if (res.data?.data?.projects && Array.isArray(res.data.data.projects)) {
              projectsData = res.data.data.projects;
            } else if (res.data?.projects && Array.isArray(res.data.projects)) {
              projectsData = res.data.projects;
            } else if (res.data?.data && Array.isArray(res.data.data)) {
              projectsData = res.data.data;
            } else if (Array.isArray(res.data)) {
              projectsData = res.data;
            }
            
            console.log("Extracted projects:", projectsData);
            setProjects(projectsData);
          })
          .catch((err) => {
            console.error('Failed to fetch projects:', err);
            showToast('Failed to load projects', 'error');
            setProjects([]);
          })
          .finally(() => setLoadingProjects(false));
      } else {
        console.error("No employee ID found:", { dashboardData, user });
        setLoadingProjects(false);
      }
    }
  }, [isOpen, dashboardData, user]);

  const handleTimeChange = (projectId, time) => {
    setProjectTimes(prev => ({ ...prev, [projectId]: time }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that at least one project has time entered
    const hasTime = Object.values(projectTimes).some(time => time && time !== '00:00');
    if (!hasTime) {
      showToast('Please enter time worked for at least one project', 'warning');
      return;
    }
    
    onSubmit({ project_times: projectTimes, total_hours: totalHours });
  };

  const handleSetAllSame = () => {
    if (projects.length === 0) return;
    // Calculate equal distribution of 8 hours across projects
    const hoursPerProject = 8 / projects.length;
    const newTimes = {};
    projects.forEach(project => {
      const hours = Math.floor(hoursPerProject);
      const minutes = Math.round((hoursPerProject % 1) * 60);
      newTimes[project.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });
    setProjectTimes(newTimes);
  };

  const handleClearAll = () => {
    setProjectTimes({});
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '0 hrs';
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const minNum = parseInt(minutes);
    
    if (hourNum === 0 && minNum === 0) return '0 hrs';
    if (hourNum === 0) return `${minNum} min`;
    if (minNum === 0) return `${hourNum} hr${hourNum > 1 ? 's' : ''}`;
    return `${hourNum} hr ${minNum} min`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] rounded-xl w-full max-w-2xl mx-4 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-[var(--border)]">
          <div>
            <h3 className="text-xl font-bold text-[var(--text)]">Punch Out</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Record time spent on each project</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[var(--text)] mb-2">
              <FiClock className="inline mr-2 text-green-500" />
              Time Worked on Projects
            </label>
            <p className="text-xs text-[var(--muted)] mb-3">
              Enter the time you spent working on each project today
            </p>
            
            {projects.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleSetAllSame}
                  className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                >
                  Distribute 8 hours equally
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            {loadingProjects ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
                <div className="text-sm text-[var(--muted)]">Loading your projects...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 bg-[var(--surface2)] rounded-xl">
                <FiClock className="text-4xl text-[var(--muted)] mx-auto mb-2" />
                <div className="text-sm text-[var(--muted)]">No projects assigned to you</div>
                <div className="text-xs text-[var(--muted)] mt-1">You can still punch out without recording time</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between bg-[var(--surface2)] p-4 rounded-xl border border-[var(--border)] hover:border-green-500/30 transition-all"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-[var(--text)]">{project.name}</span>
                      {project.description && (
                        <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <TimeInput
                          value={projectTimes[project.id] || ''}
                          onChange={(e) => handleTimeChange(project.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <span className="text-xs text-[var(--muted)] w-20">
                        {formatTimeDisplay(projectTimes[project.id])}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Hours Summary */}
          {projects.length > 0 && (
            <div className="mb-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text)]">Total Time Recorded:</span>
                <span className="text-xl font-bold text-green-500">{totalHours} hours</span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                <i className="fas fa-info-circle mr-1"></i>
                Make sure your total time accurately reflects your work today
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-8 bg-[var(--surface2)] border border-[var(--border)] rounded-full text-[var(--text)] font-semibold text-sm hover:bg-[var(--surface3)] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 border-none text-white py-3 px-8 rounded-full font-semibold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiSave />
                  Confirm Punch Out
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Reports List Component
const TaskReportsList = () => {
  const dispatch = useDispatch();
  const taskReportsState = useSelector((state) => state.EmpTaskReports) || {};
  const {
    taskReports = [],
    loading = false,
    pagination = { currentPage: 1, perPage: 10 },
    search = '',
    error = null
  } = taskReportsState;

  // Fetch task reports on component mount
  useEffect(() => {
    dispatch(fetchTaskReports());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearTaskReportsError());
    }
  }, [error, dispatch]);

  // Filter and paginate reports
  const filteredReports = Array.isArray(taskReports) ? taskReports.filter(report => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (report.tasks_completed || "").toLowerCase().includes(searchLower) ||
      (report.plan_tomorrow || "").toLowerCase().includes(searchLower) ||
      (report.remarks || "").toLowerCase().includes(searchLower)
    );
  }) : [];

  const perPage = pagination?.perPage || 10;
  const currentPage = pagination?.currentPage || 1;
  const totalPages = Math.ceil(filteredReports.length / perPage);
  const start = (currentPage - 1) * perPage;
  const currentReports = filteredReports.slice(start, start + perPage);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "-";
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      dispatch(setTaskReportsPagination({ currentPage: page, perPage: perPage }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchChange = (e) => {
    dispatch(setTaskReportsSearch(e.target.value));
  };

  const handleEntriesChange = (e) => {
    dispatch(setTaskReportsPagination({ currentPage: 1, perPage: parseInt(e.target.value) }));
  };

  if (loading && taskReports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading task reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-reports-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-7">
        <h2 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-[var(--text)] to-green-600 bg-clip-text text-transparent">
          My Task Reports
        </h2>
      </div>

      {/* Action Bar */}
      <div className="files-actions flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div className="entries-select flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3.5 py-1.5 text-xs text-[var(--text-secondary)]">
          <span>Show entries</span>
          <select
            value={perPage}
            onChange={handleEntriesChange}
            className="border-none outline-none bg-transparent font-semibold text-[var(--text)] cursor-pointer"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="search-wrapper flex items-center gap-3 flex-wrap">
          <div className="search-box flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-3.5 py-2">
            <FiSearch className="text-[var(--muted)] text-xs" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search reports..."
              className="border-none outline-none bg-transparent text-xs text-[var(--text)] w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Task Reports Table */}
      <div className="task-reports-table-wrapper bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-x-auto shadow-sm">
        <table className="task-reports-table w-full border-collapse text-xs min-w-[800px]">
          <thead>
            <tr className="bg-[var(--surface2)] border-b border-[var(--border)]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)]">#</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)]">Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)]">Tasks Completed</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)]">Plan for Tomorrow</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)]">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-[var(--muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <FiClock className="text-4xl text-[var(--muted)]" />
                    <p>No task reports found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentReports.map((report, idx) => (
                <tr key={report.id} className="hover:bg-[var(--surface2)] transition-colors border-b border-[var(--border)]">
                  <td className="py-3.5 px-4 text-[var(--text-secondary)]">{start + idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-[var(--muted)] text-xs" />
                      <span className="text-[var(--text)] text-xs whitespace-nowrap">
                        {formatDate(report.date)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-[250px] truncate" title={report.tasks_completed}>
                    {report.tasks_completed || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-[250px] truncate" title={report.plan_tomorrow}>
                    {report.plan_tomorrow || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-[150px] truncate" title={report.remarks}>
                    {report.remarks || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredReports.length > 0 && (
        <div className="pagination-container flex flex-col sm:flex-row justify-between items-center gap-3 mt-5">
          <div className="text-xs text-[var(--muted)]">
            Showing {start + 1} to {Math.min(start + perPage, filteredReports.length)} of {filteredReports.length} entries
          </div>
          <div className="page-buttons flex gap-1.5 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text)]"
            >
              <FiChevronLeft className="mx-auto" />
            </button>
            {[...Array(Math.min(totalPages, 10))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg border text-xs transition-all ${currentPage === pageNum
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface2)]"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text)]"
            >
              <FiChevronRight className="mx-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { PunchOutModal, TaskReportsList };
export default PunchOutModal;