import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { fetchEmployees } from "../store/slices/employeeSlice";
import { fetchOrganizations } from "../store/slices/organizationSlice";
import { fetchAttendanceRecords } from "../store/slices/attendanceSlice";
import { fetchLeaves } from "../store/slices/LeaveSlice";

const Reports = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { organizations = [] } = useSelector(
    (state) => state.organizations || {},
  );
  const { employees = [] } = useSelector((state) => state.employees || {});
  const { records: attendanceRecords = [] } = useSelector(
    (state) => state.attendance || {},
  );
  const { leaves: leaveRecords = [] } = useSelector(
    (state) => state.leaves || {},
  );
  
  // Get user role from auth
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.type || 'admin';
  
  // Determine the base path based on user role
  const basePath = userRole === 'admin' ? '/admin' : '/employee';

  useEffect(() => {
    dispatch(fetchOrganizations());
    dispatch(fetchEmployees());
    dispatch(fetchAttendanceRecords());
    dispatch(fetchLeaves());
  }, [dispatch]);

  // Calculate statistics for cards
  const totalEmployees = employees.length;
  const pendingLeaves = leaveRecords.filter(
    (leave) => leave.status === "Pending",
  ).length;

  // Calculate expiry statistics
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  let employeeNearExpiry = 0;
  let employeeUpcomingRenewals = 0;
  let orgNearExpiry = 0;
  let orgUpcomingRenewals = 0;

  // Check employee document expiries (assuming employees have document expiry dates)
  employees.forEach((emp) => {
    if (emp.document_expiry_date) {
      const expiryDate = new Date(emp.document_expiry_date);
      if (expiryDate < today) {
        // Expired - don't count in near expiry
      } else if (expiryDate <= thirtyDaysFromNow) {
        employeeNearExpiry++;
      } else if (expiryDate <= new Date(today.setMonth(today.getMonth() + 3))) {
        employeeUpcomingRenewals++;
      }
    }
  });

  // Check organization document expiries
  organizations.forEach((org) => {
    if (org.document_expiry_date) {
      const expiryDate = new Date(org.document_expiry_date);
      if (expiryDate < today) {
        // Expired
      } else if (expiryDate <= thirtyDaysFromNow) {
        orgNearExpiry++;
      } else if (expiryDate <= new Date(today.setMonth(today.getMonth() + 3))) {
        orgUpcomingRenewals++;
      }
    }
  });

  const reportCards = [
    {
      id: "employee-details",
      title: "Employee Details",
      description: "Full employee data view",
      icon: "fas fa-users",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      link: `${basePath}/reports/employee-details`,
      count: totalEmployees,
    },
    {
      id: "attendance",
      title: "Attendance Report",
      description: "Detailed punch logs",
      icon: "fas fa-fingerprint",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      link: `${basePath}/reports/attendance-reports`,
      count: attendanceRecords.length,
    },
    {
      id: "leave-requests",
      title: "Leave Requests",
      description: "History of leave requests",
      icon: "fas fa-calendar-check",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      link: `${basePath}/reports/leave-requests-reports`,
      count: leaveRecords.length,
    },
    {
      id: "pending-leaves",
      title: "Pending Leaves",
      description: "Awaiting approval",
      icon: "fas fa-clock",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      link: `${basePath}/reports/pending-leaves-reports`,
      count: pendingLeaves,
      highlight: pendingLeaves > 0,
    },
    {
      id: "emp-near-expiry",
      title: "Emp. Nearest Expiry",
      description: "Critical expiry alerts",
      icon: "fas fa-exclamation-triangle",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      link: `${basePath}/reports/employee-near-expiry`,
      count: employeeNearExpiry,
      highlight: employeeNearExpiry > 0,
    },
    {
      id: "emp-upcoming-renewals",
      title: "Emp. Upcoming Renewals",
      description: "Renewal pipeline",
      icon: "fas fa-calendar-alt",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      link: `${basePath}/reports/employee-upcoming-renewals`,
      count: employeeUpcomingRenewals,
    },
    {
      id: "org-near-expiry",
      title: "Org. Nearest Expiry",
      description: "Company document alerts",
      icon: "fas fa-building",
      iconBg: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400",
      link: `${basePath}/reports/organization-near-expiry`,
      count: orgNearExpiry,
      highlight: orgNearExpiry > 0,
    },
    {
      id: "org-upcoming-renewals",
      title: "Org. Upcoming Renewals",
      description: "Planned compliance",
      icon: "fas fa-chart-line",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      link: `${basePath}/reports/organization-upcoming-renewals`,
      count: orgUpcomingRenewals,
    },
  ];

  return (
    <div className="w-full overflow-x-hidden">
      <main className="content px-4 py-4 md:px-6 md:py-6 w-full overflow-x-hidden">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Reports
          </h2>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {reportCards.map((card) => (
            <Link key={card.id} to={card.link} className="group block">
              <div
                className={`
                  bg-white dark:bg-gray-800 rounded-xl border 
                  ${
                    card.highlight
                      ? "border-red-300 dark:border-red-700 shadow-lg ring-2 ring-red-300 dark:ring-red-700/50"
                      : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                  } 
                  transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden
                `}
              >
                {/* Card Header with Icon */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}
                    >
                      <i
                        className={`${card.icon} ${card.iconColor} text-xl`}
                      ></i>
                    </div>
                    {card.count !== undefined && (
                      <div
                        className={`
                          text-2xl font-bold 
                          ${card.highlight ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200"}
                        `}
                      >
                        {card.count}
                      </div>
                    )}
                  </div>

                  {/* Card Title */}
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">
                    {card.title}
                  </h3>

                  {/* Card Description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Reports;