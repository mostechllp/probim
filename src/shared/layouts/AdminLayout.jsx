import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../../admin/components/common/Header";
import Sidebar from "../../components/common/Sidebar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="app flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div
        className={`flex-1 min-w-0 w-full overflow-x-hidden ${!isMobile ? "md:ml-[72px]" : ""}`}
      >
        {/* Fixed header container */}
        <div className="fixed top-0 right-0 z-40" style={{ left: !isMobile ? '72px' : '0' }}>
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        {/* Spacer to push content below fixed header */}
        <div className="h-[72px] md:h-[76px]"></div>
        <main className="content px-4 py-4 md:px-6 md:py-6 max-w-[1600px] mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;