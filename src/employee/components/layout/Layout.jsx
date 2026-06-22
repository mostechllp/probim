import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import Sidebar from "../../../components/common/Sidebar";
import Header from "../common/Header";
import TaskWidget from "../widgets/TaskWidget";
import NotesWidget from "../widgets/NotesWidget";

const Layout = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app flex min-h-screen bg-gray-50 dark:bg-gray-900">

      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      <div className="main flex-1">
        <Header onMenuClick={toggleSidebar} />
        <div className="content-section py-7 px-4 md:px-7">
          <Outlet />
        </div>
      </div>
      <TaskWidget />
      <NotesWidget />
    </div>
  );
};

export default Layout;