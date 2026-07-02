/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchEmployees } from "../store/slices/employeeSlice";
import { fetchProjects } from "../store/slices/projectSlice";
import { fetchAssignments, fetchEmployeeProjectWorkingTime } from "../store/slices/projectAssignmentSlice";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { StatsCard } from "../components/dashboard/StatsCard";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import PunchChart from "../components/dashboard/PunchChart";
import RecentFiles from "../components/dashboard/RecentFiles";
import { fetchDashboard } from "../store/slices/dashboardSlice";
import ProjectResourceChart from "../components/dashboard/ProjectResourceChart";
import ProjectStatusChart from "../components/dashboard/ProjectStatusChart";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { showToast } from "../../components/common/Toast";
import { formatDate } from "../../utils/reportUtils";

// Helper to format time
const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Helper to get month name
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex] || monthIndex;
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  const { stats, charts, recentData, loading } = useSelector(
    (state) => state.dashboard,
  );
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects || { projects: [], loading: false });
  const { assignments, employeeWorkingTime, loading: assignmentsLoading } = useSelector((state) => state.projectAssignments || { assignments: [], loading: false, employeeWorkingTime: {} });

  // State for project hours chart
  const [projectHoursData, setProjectHoursData] = useState([]);
  const [loadingProjectHours, setLoadingProjectHours] = useState(false);
  
  // State for modal
  const [showProjectHoursModal, setShowProjectHoursModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectEmployees, setSelectedProjectEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  // Get user type for navigation
  const userType = user?.type || 'admin';
  const basePath = userType === 'admin' ? '/admin' : '/employee';

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchProjects());
    dispatch(fetchAssignments());
  }, [dispatch]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [dispatch]);

  // Fetch project working hours for all employees
  const fetchAllProjectHours = async () => {
    setLoadingProjectHours(true);
    try {
      // Get all unique user IDs from assignments
      const userIds = assignments
        .map(a => a.userId)
        .filter(id => id !== null && id !== undefined);
      
      console.log("Fetching working hours for user IDs:", userIds);
      
      // Fetch working time for each user
      const results = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const result = await dispatch(
              fetchEmployeeProjectWorkingTime(userId)
            ).unwrap();
            return { userId, data: result.data || [] };
          } catch (error) {
            console.error(`Failed to fetch for user ${userId}:`, error);
            return { userId, data: [] };
          }
        })
      );

      // Process the data to get total hours per project
      const projectHoursMap = {};
      const projectEmployeeMap = {};

      results.forEach(({ userId, data }) => {
        if (!data || data.length === 0) return;
        
        // Find employee info for this user
        const employee = employees.find(e => 
          e.user_id === userId || e.user?.id === userId
        );
        const employeeName = employee 
          ? (employee.name || `${employee.first_name} ${employee.last_name}`.trim() || `Employee #${userId}`)
          : `Employee #${userId}`;

        data.forEach(project => {
          const projectId = project.project_id;
          const projectName = project.project_name || `Project #${projectId}`;
          const totalMinutes = project.total_working_time_minutes || 0;
          
          // Aggregate total hours per project
          if (!projectHoursMap[projectId]) {
            projectHoursMap[projectId] = {
              id: projectId,
              name: projectName,
              totalMinutes: 0,
              employees: []
            };
          }
          projectHoursMap[projectId].totalMinutes += totalMinutes;
          
          // Store employee data for this project
          projectHoursMap[projectId].employees.push({
            userId,
            name: employeeName,
            totalMinutes: totalMinutes,
            dailyLogs: project.daily_logs || []
          });
        });
      });

      // Convert to array and sort by total minutes (descending)
      const sortedData = Object.values(projectHoursMap)
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .map(item => ({
          ...item,
          totalHours: formatTime(item.totalMinutes),
          totalMinutes: item.totalMinutes
        }));

      console.log("Project hours data:", sortedData);
      setProjectHoursData(sortedData);
    } catch (error) {
      console.error("Error fetching project hours:", error);
      showToast("Failed to load project hours data", "error");
    } finally {
      setLoadingProjectHours(false);
    }
  };

  // Fetch project hours when assignments and employees are loaded
  useEffect(() => {
    if (assignments.length > 0 && employees.length > 0) {
      fetchAllProjectHours();
    }
  }, [assignments, employees]);

  // Colors for chart bars
  const COLORS = [
    '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', 
    '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F472B6',
    '#FB923C', '#34D399', '#22D3EE', '#60A5FA', '#A78BFA'
  ];

  // Handle click on chart bar
  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const projectData = data.activePayload[0].payload;
      setSelectedProject(projectData);
      
      // Get available months from employee logs
      const monthsSet = new Set();
      projectData.employees.forEach(emp => {
        emp.dailyLogs.forEach(log => {
          if (log.date) {
            const date = new Date(log.date);
            if (!isNaN(date.getTime())) {
              monthsSet.add(`${date.getFullYear()}-${date.getMonth()}`);
            }
          }
        });
      });
      
      const months = Array.from(monthsSet).sort().map(key => {
        const [year, month] = key.split('-').map(Number);
        return { year, month, label: `${getMonthName(month)} ${year}` };
      });
      
      setAvailableMonths(months);
      
      // Set default month to latest
      if (months.length > 0) {
        const latest = months[months.length - 1];
        setSelectedMonth(latest.month);
        setSelectedYear(latest.year);
      }
      
      setShowProjectHoursModal(true);
      setLoadingModalData(false);
    }
  };

  // Filter employees by selected month
  const getFilteredEmployees = () => {
    if (!selectedProject) return [];
    
    return selectedProject.employees
      .map(emp => {
        const monthLogs = emp.dailyLogs.filter(log => {
          if (!log.date) return false;
          const date = new Date(log.date);
          return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });
        
        const totalMinutes = monthLogs.reduce((sum, log) => sum + (log.working_time_minutes || 0), 0);
        
        return {
          ...emp,
          monthMinutes: totalMinutes,
          monthFormatted: formatTime(totalMinutes),
          monthLogs: monthLogs,
          dayCount: monthLogs.length
        };
      })
      .filter(emp => emp.monthMinutes > 0 || emp.dayCount > 0)
      .sort((a, b) => b.monthMinutes - a.monthMinutes);
  };

  const filteredEmployees = getFilteredEmployees();

  const formattedStats = stats && {
    totalEmployees: recentData?.employees?.length || 0,
    punchedInToday: stats.today.punched_in,
    lateArrivals: stats.today.late,
    absentToday: stats.today.absent,
  };

  // Calculate project engagement metrics
  const calculateEngagementMetrics = () => {
    if (!projects.length || !assignments.length) return [];

    return projects.map(project => {
      const assignedEmployees = assignments.filter(assignment =>
        assignment.projectIds && assignment.projectIds.includes(String(project.id))
      );
      
      const employeeCount = assignedEmployees.length;
      const percentageOfTotal = employees?.length ? (employeeCount / employees.length) * 100 : 0;
      
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        employeeCount,
        percentageOfTotal: Math.round(percentageOfTotal),
        priority: project.priority || 'Medium',
        managerId: project.managerId,
        teamLeadId: project.teamLeadId
      };
    });
  };

  const engagementMetrics = calculateEngagementMetrics();
  const activeProjects = engagementMetrics.filter(p => p.status === 'Active');
  const totalTaggedEmployees = assignments.reduce((sum, a) => sum + (a.projectIds?.length || 0), 0);

  // Navigation handlers for stats cards
  const handleNavigate = (route) => {
    navigate(`${basePath}${route}`);
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-200">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Hours: <span className="font-bold text-indigo-600 dark:text-indigo-400">{data.totalHours}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.employees?.length || 0} employees
          </p>
          <p className="text-xs text-gray-400 mt-1">Click to view details</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {formattedStats && <WelcomeBanner stats={formattedStats} user={user} />}

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
        <StatsCard
          title="Total Employees"
          value={formattedStats?.totalEmployees}
          icon="fas fa-users"
          color="green"
          route="/employees"
          onClick={() => handleNavigate('/employees')}
        />
        <StatsCard
          title="Punched In Today"
          value={formattedStats?.punchedInToday}
          icon="fas fa-fingerprint"
          color="blue"
          route="/attendances"
          onClick={() => handleNavigate('/attendances')}
        />
        <StatsCard
          title="Late Arrivals"
          value={formattedStats?.lateArrivals}
          icon="fas fa-clock"
          color="amber"
          route="/attendances"
          onClick={() => handleNavigate('/attendances')}
        />
        <StatsCard
          title="Absent Today"
          value={formattedStats?.absentToday}
          icon="fas fa-user-slash"
          color="red"
          route="/attendances"
          onClick={() => handleNavigate('/attendances')}
        />
      </div>

      {/* Project Stats Summary Cards */}
      <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
        <StatsCard
          title="Total Projects"
          value={projects.length}
          icon="fas fa-project-diagram"
          color="purple"
          route="/projects"
          onClick={() => handleNavigate('/projects')}
        />
        <StatsCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'Active').length}
          icon="fas fa-play-circle"
          color="green"
          route="/projects"
          onClick={() => handleNavigate('/projects')}
        />
        <StatsCard
          title="Employees Tagged"
          value={assignments.length}
          icon="fas fa-tags"
          color="blue"
          route="/project-assignments"
          onClick={() => handleNavigate('/project-assignments')}
        />
        <StatsCard
          title="Total Assignments"
          value={totalTaggedEmployees}
          icon="fas fa-link"
          color="orange"
          route="/project-assignments"
          onClick={() => handleNavigate('/project-assignments')}
        />
      </div>

      {/* Project Charts Section */}
      <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6">
        <div className="w-full min-w-0 overflow-hidden">
          <ProjectResourceChart 
            projects={engagementMetrics}
            title="Project Resource Allocation"
            subtitle="Number of employees assigned per project"
          />
        </div>
        <div className="w-full min-w-0 overflow-hidden">
          <ProjectStatusChart 
            projects={projects}
            title="Project Status Distribution"
            subtitle="Active vs Inactive projects"
          />
        </div>
      </div>

      {/* Project Hours Chart */}
      <div className="w-full mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                <i className="fas fa-clock text-indigo-500 mr-2"></i>
                Total Hours Spent Per Project
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total working hours logged across all projects
              </p>
            </div>
            <button
              onClick={fetchAllProjectHours}
              disabled={loadingProjectHours}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            >
              <i className={`fas ${loadingProjectHours ? 'fa-spinner fa-spin' : 'fa-sync'} mr-1`}></i>
              {loadingProjectHours ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loadingProjectHours ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-indigo-500 mb-3"></i>
                <p className="text-gray-500 dark:text-gray-400">Loading project hours...</p>
              </div>
            </div>
          ) : projectHoursData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <i className="fas fa-clock text-4xl mb-3 text-gray-300"></i>
                <p>No project hours data available</p>
                <p className="text-sm">Hours will appear once employees start logging time</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectHoursData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  onClick={handleBarClick}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const hours = Math.floor(value / 60);
                      const mins = value % 60;
                      if (hours === 0) return `${mins}m`;
                      if (mins === 0) return `${hours}h`;
                      return `${hours}h`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="totalMinutes" 
                    name="Total Hours"
                    fill="#4F46E5"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                  >
                    {projectHoursData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Charts - Original */}
      <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6">
        <div className="w-full min-w-0 overflow-hidden">
          <AttendanceChart />
        </div>
        <div className="w-full min-w-0 overflow-hidden">
          <PunchChart />
        </div>
      </div>

      <RecentFiles />

      {/* Project Hours Details Modal */}
      {showProjectHoursModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProjectHoursModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  <i className="fas fa-project-diagram text-indigo-500 mr-2"></i>
                  {selectedProject.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Hours: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedProject.totalHours}</span>
                  {' • '}
                  {selectedProject.employees?.length || 0} employees
                </p>
              </div>
              <button
                onClick={() => setShowProjectHoursModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {/* Month Filter */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <i className="fas fa-calendar-alt text-indigo-500 mr-1"></i> Filter by Month:
                </label>
                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                  {availableMonths.length > 0 ? (
                    availableMonths.map(({ year, month, label }) => (
                      <option key={`${year}-${month}`} value={`${year}-${month}`}>
                        {label}
                      </option>
                    ))
                  ) : (
                    <option value={`${selectedYear}-${selectedMonth}`}>
                      {getMonthName(selectedMonth)} {selectedYear}
                    </option>
                  )}
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredEmployees.length} employees with hours
                </span>
              </div>

              {/* Employee Table */}
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <i className="fas fa-users text-4xl mb-3 text-gray-300"></i>
                  <p>No employees logged hours for this month</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Employee</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Days</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Total Hours</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp, idx) => (
                        <tr key={emp.userId || idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 text-center">{idx + 1}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {emp.name}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                            {emp.dayCount} days
                          </td>
                          <td className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {emp.monthFormatted}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => {
                                // Show daily logs for this employee
                                const logs = emp.monthLogs.map(log => ({
                                  date: log.date,
                                  hours: log.working_time_formatted || `${log.working_time_minutes || 0}m`
                                }));
                                showToast(
                                  `${emp.name}\n${logs.map(l => `${formatDate(l.date)}: ${l.hours}`).join('\n')}`,
                                  'info'
                                );
                              }}
                              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                              View Logs
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <i className="fas fa-info-circle mr-1"></i>
                Click "View Logs" to see daily breakdown
              </div>
              <button
                onClick={() => setShowProjectHoursModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;