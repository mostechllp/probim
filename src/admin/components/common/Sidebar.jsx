import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { PROJECT_MODULE_NAME } from "../../utils/constants";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsOpen]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile, setIsOpen]);

  const navItems = [
    { path: "/admin/dashboard", icon: "fas fa-chart-line", label: "Dashboard" },
    {
      path: "/admin/employees/onboarding",
      icon: "fas fa-user-plus",
      label: "Onboarding",
    },
    { path: "/admin/employees", icon: "fas fa-users", label: "Employees" },
    { path: "/admin/projects", icon: "fas fa-briefcase", label: PROJECT_MODULE_NAME },
    { path: "/admin/project-assignments", icon: "fas fa-user-gear", label: "Project Assignments" },
    { path: "/admin/attendances", icon: "fas fa-fingerprint", label: "Attendance" },
    { path: "/admin/leaves", icon: "fas fa-calendar-check", label: "Leaves" },
    { path: "/admin/task-reports", icon: "fas fa-tasks", label: "Task Reports" },
    { path: "/admin/wfh", icon: "fas fa-home", label: "WFH Requests" },
    { path: "/admin/reports", icon: "fas fa-chart-line", label: "Reports" },
    { path: "/admin/payroll", icon: "fas fa-file-invoice-dollar", label: "Payroll" },
    { path: "/admin/role-management", icon: "fas fa-user-shield", label: "Roles" },
    { path: "/admin/organizations", icon: "fas fa-building", label: "Organizations" },
    { path: "/admin/agreements", icon: "fas fa-file-signature", label: "Agreements" },
    { path: "/admin/settings", icon: "fas fa-gear", label: "Settings" },
  ];
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-900 z-50 transition-all duration-300
          flex flex-col
          ${isMobile
            ? `${isOpen ? "translate-x-0" : "-translate-x-full"} w-64`
            : "w-[72px] hover:w-64 group"
          }
        `}
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
      >
        {/* Logo Section - Fixed at top */}
        <div className="flex-shrink-0 py-5 px-4 border-b border-white/10 flex justify-center items-center">
          <img
            src="https://violet-leopard-500489.hostingersite.com/hr/public/assets/images/hr-logo2.jpg"
            alt="HMR Logo"
            className={`object-contain rounded-lg bg-white p-1 transition-all duration-300 ${!isMobile && !isOpen ? "w-10 h-10" : "w-12 h-12"
              }`}
          />
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin/employees" || item.path === "/admin/dashboard"}
              onClick={() => isMobile && setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 mx-2 rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap overflow-hidden ${isActive
                  ? "bg-green-500/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <i className={item.icon + " w-6 text-lg flex-shrink-0"}></i>

              <span
                className={`transition-opacity duration-200 ${!isMobile && !isOpen
                    ? "opacity-0 group-hover:opacity-100"
                    : "opacity-100"
                  }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
