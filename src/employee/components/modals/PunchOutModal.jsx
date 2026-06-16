import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiCheckCircle, FiClock, FiSave, FiCalendar, FiSearch, FiChevronLeft, FiChevronRight, FiAlertCircle, FiFileText, FiTarget, FiMessageSquare } from 'react-icons/fi';
import { showToast } from '../common/Toast';
import apiClient from '../../../utils/apiClient';
import { TimeInput } from '../common/TimeInput';
import { fetchTaskReports, setTaskReportsPagination, setTaskReportsSearch, clearTaskReportsError, saveTaskReport } from '../../store/slices/taskReportsSlice';

// Punch Out Modal Component
const PunchOutModal = ({ isOpen, onClose, onSubmit, loading, punchOutDate }) => {
  const dispatch = useDispatch();
  const [projects, setProjects] = useState([]);
  const [projectTimes, setProjectTimes] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [confirmNoProjects, setConfirmNoProjects] = useState(false);
  
  // Task report states
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [planTomorrow, setPlanTomorrow] = useState('');
  const [remarks, setRemarks] = useState('');
  const [savingTaskReport, setSavingTaskReport] = useState(false);

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
    // Reset confirmation when modal closes
    return () => {
      setConfirmNoProjects(false);
      // Reset task report fields when modal closes
      setTasksCompleted('');
      setPlanTomorrow('');
      setRemarks('');
    };
  }, [isOpen, dashboardData, user]);

  const handleTimeChange = (projectId, time) => {
    setProjectTimes(prev => ({ ...prev, [projectId]: time }));
  };

  // Handle saving task report
  const handleSaveTaskReport = async () => {
    // if (!tasksCompleted.trim()) {
    //   showToast('Please enter your completed tasks', 'error');
    //   return false;
    // }
    
    // if (!planTomorrow.trim()) {
    //   showToast('Please enter your plan for tomorrow', 'error');
    //   return false;
    // }
    
    setSavingTaskReport(true);
    try {
      const result = await dispatch(saveTaskReport({
        tasks_completed: tasksCompleted,
        plan_tomorrow: planTomorrow,
        remarks: remarks
      })).unwrap();
      
      if (result) {
        showToast('Task report saved successfully!', 'success');
        return true;
      }
      return false;
    } catch (error) {
      showToast(error || 'Failed to save task report', 'error');
      return false;
    } finally {
      setSavingTaskReport(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First, save the task report
    const taskReportSaved = await handleSaveTaskReport();
    if (!taskReportSaved) {
      return;
    }
    
    // If no projects assigned
    if (projects.length === 0) {
      if (!confirmNoProjects) {
        setConfirmNoProjects(true);
        return;
      }
      // User confirmed, proceed with punch out
      onSubmit({ 
        project_times: {}, 
        total_hours: 0, 
        no_projects: true,
        punch_out_date: punchOutDate || null,
        task_report: {
          tasks_completed: tasksCompleted,
          plan_tomorrow: planTomorrow,
          remarks: remarks
        }
      });
      return;
    }
    
    // Validate that at least one project has time entered
    // const hasTime = Object.values(projectTimes).some(time => time && time !== '00:00');
    // if (!hasTime) {
    //   showToast('Please enter time worked for at least one project', 'error');
    //   return;
    // }
    
    onSubmit({ 
      project_times: projectTimes, 
      total_hours: totalHours,
      punch_out_date: punchOutDate || null,
      task_report: {
        tasks_completed: tasksCompleted,
        plan_tomorrow: planTomorrow,
        remarks: remarks
      }
    });
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
            <h3 className="text-xl font-bold text-[var(--text)]">Punch Out {punchOutDate ? `for ${punchOutDate}` : ''}</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Record your work and tasks for {punchOutDate ? 'that day' : 'today'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto">
          {/* Task Report Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[var(--text)] mb-3">
              <FiFileText className="inline mr-2 text-green-500" />
              Task Report {punchOutDate ? `for ${punchOutDate}` : 'Daily'}
            </label>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Tasks Completed {punchOutDate ? 'That Day' : 'Today'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(e.target.value)}
                  placeholder="What tasks did you complete today?"
                  rows="3"
                  className="w-full px-4 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Plan for Tomorrow <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={planTomorrow}
                  onChange={(e) => setPlanTomorrow(e.target.value)}
                  placeholder="What are your plans for tomorrow?"
                  rows="2"
                  className="w-full px-4 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional remarks or comments..."
                  rows="2"
                  className="w-full px-4 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[var(--surface)] text-[var(--muted)]">Project Time Tracking</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-[var(--text)] mb-2">
              <FiClock className="inline mr-2 text-green-500" />
              Time Worked on Projects
            </label>
            
            {projects.length > 0 && (
              <>
                <p className="text-xs text-[var(--muted)] mb-3">
                  Enter the time you spent working on each project {punchOutDate ? 'that day' : 'today'}
                </p>
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
              </>
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
                <FiAlertCircle className="text-4xl text-[var(--muted)] mx-auto mb-2" />
                <div className="text-sm text-[var(--muted)]">No projects assigned to you</div>
                <div className="text-xs text-[var(--muted)] mt-1">You can punch out without recording project time</div>
                
                {/* Confirmation checkbox for no projects */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmNoProjects"
                    checked={confirmNoProjects}
                    onChange={(e) => setConfirmNoProjects(e.target.checked)}
                    className="w-4 h-4 text-green-500 rounded border-[var(--border)] focus:ring-green-500"
                  />
                  <label htmlFor="confirmNoProjects" className="text-sm text-[var(--text)]">
                    I confirm I want to punch out (no projects assigned)
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
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

          {/* Total Hours Summary - Only show if there are projects */}
          {projects.length > 0 && (
            <div className="mb-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--text)]">Total Time Recorded:</span>
                <span className="text-xl font-bold text-green-500">{totalHours} hours</span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                <i className="fas fa-info-circle mr-1"></i>
                Make sure your total time accurately reflects your work {punchOutDate ? 'for that day' : 'today'}
              </div>
            </div>
          )}

          {/* Warning for no projects without confirmation */}
          {projects.length === 0 && !confirmNoProjects && (
            <div className="mb-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  Please confirm you want to punch out
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                You have no projects assigned. Check the confirmation box above to proceed.
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
              disabled={loading || savingTaskReport || (projects.length === 0 && !confirmNoProjects)}
              className="flex-1 bg-green-500 border-none text-white py-3 px-8 rounded-full font-semibold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || savingTaskReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {savingTaskReport ? 'Saving Report...' : 'Processing...'}
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