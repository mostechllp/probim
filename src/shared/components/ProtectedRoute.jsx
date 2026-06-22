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

  // Check user type - use user?.type instead of userType
  if (requiredType && user?.type !== requiredType) {
    const redirectPath = user?.type === "admin" ? "/admin/dashboard" : "/employee/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Check permission if required
  if (requiredPermission) {
    const permissions = user?.permissions || {};
    const hasPermission = 
      permissions[requiredPermission]?.read === true || 
      permissions.all === true ||
      user?.type === 'admin';
    
    if (!hasPermission) {
      // Redirect to dashboard or unauthorized page
      const redirectPath = user?.type === "admin" ? "/admin/dashboard" : "/employee/dashboard";
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;