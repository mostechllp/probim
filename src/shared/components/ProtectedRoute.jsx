import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../../admin/components/common/Loader";

const ProtectedRoute = ({ requiredType, requiredPermission, children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Helper to check if user is HR or Admin (can access admin routes)
  const isHR = user?.type === "hr" || 
               user?.role?.name === "HR Manager" || 
               user?.role?.name === "HR";
  
  const isAdmin = user?.type === "admin";
  const isManager = user?.role?.name === "Manager" || user?.type === "manager";
  const isTeamLead = user?.role?.name === "Team Lead" || user?.type === "team_lead";
  const isEmployee = user?.type === "employee";

  // Determine user's primary dashboard
  const getUserDashboard = () => {
    if (isAdmin || isHR) {
      return "/admin/dashboard";
    }
    // Managers, Team Leads, and Employees go to employee dashboard
    return "/employee/dashboard";
  };

  // Check user type
  if (requiredType) {
    let hasRequiredType = false;

    // Admin routes - accessible by admin and HR
    if (requiredType === "admin") {
      hasRequiredType = isAdmin || isHR;
    }
    // Employee routes - accessible by employee, manager, team lead, and HR
    else if (requiredType === "employee") {
      hasRequiredType = isEmployee || isManager || isTeamLead || isHR || isAdmin;
    }
    // Exact type match for other types
    else {
      hasRequiredType = user?.type === requiredType;
    }

    // If user doesn't have required type, redirect to their dashboard
    if (!hasRequiredType) {
      const redirectPath = getUserDashboard();
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Check permission if required
  if (requiredPermission) {
    const permissions = user?.permissions || {};
    const hasPermission = 
      permissions[requiredPermission]?.read === true || 
      permissions.all === true ||
      isAdmin; // Admin always has all permissions
    
    if (!hasPermission) {
      const redirectPath = getUserDashboard();
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;