/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "../store/slices/employeeSlice";
import { fetchProjects } from "../store/slices/projectSlice";
import { fetchAssignments } from "../store/slices/projectAssignmentSlice";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import StatsCard from "../components/dashboard/StatsCard";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import PunchChart from "../components/dashboard/PunchChart";
import RecentFiles from "../components/dashboard/RecentFiles";
import { fetchDashboard } from "../store/slices/dashboardSlice";
import ProjectResourceChart from "../components/dashboard/ProjectResourceChart";
import ProjectStatusChart from "../components/dashboard/ProjectStatusChart";
import EmployeeEngagementChart from "../components/dashboard/EmployeeEngagementChart";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  const { stats, charts, recentData, loading } = useSelector(
    (state) => state.dashboard,
  );
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects || { projects: [], loading: false });
  const { assignments, loading: assignmentsLoading } = useSelector((state) => state.projectAssignments || { assignments: [], loading: false });

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
        />
        <StatsCard
          title="Punched In Today"
          value={formattedStats?.punchedInToday}
          icon="fas fa-fingerprint"
          color="blue"
        />
        <StatsCard
          title="Late Arrivals"
          value={formattedStats?.lateArrivals}
          icon="fas fa-clock"
          color="amber"
        />
        <StatsCard
          title="Absent Today"
          value={formattedStats?.absentToday}
          icon="fas fa-user-slash"
          color="red"
        />
      </div>

      {/* Project Stats Summary Cards */}
      <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
        <StatsCard
          title="Total Projects"
          value={projects.length}
          icon="fas fa-project-diagram"
          color="purple"
        />
        <StatsCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'Active').length}
          icon="fas fa-play-circle"
          color="green"
        />
        <StatsCard
          title="Employees Tagged"
          value={assignments.length}
          icon="fas fa-tags"
          color="blue"
        />
        <StatsCard
          title="Total Assignments"
          value={totalTaggedEmployees}
          icon="fas fa-link"
          color="orange"
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

      {/* Employee Engagement Section */}
      <div className="charts-grid grid grid-cols-1 gap-4 md:gap-5 mb-6">
        <div className="w-full min-w-0 overflow-hidden">
          <EmployeeEngagementChart 
            projects={engagementMetrics}
            totalEmployees={formattedStats?.totalEmployees || 0}
            title="Employee Engagement by Project"
            subtitle="Percentage of employees assigned to each project"
          />
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
    </>
  );
};

export default Dashboard;