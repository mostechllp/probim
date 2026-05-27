import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiCheckCircle, FiClock, FiSave } from 'react-icons/fi';
import { showToast } from '../common/Toast';
import apiClient from '../../../utils/apiClient';
import { TimeInput } from '../common/TimeInput';

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
            
            // Handle the response structure from project-assignments endpoint
            // Expected structure: { status: "success", data: { projects: [...] } }
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

export default PunchOutModal;