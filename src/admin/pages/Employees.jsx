import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SearchBar from "../components/common/SearchBar";
import EntriesSelector from "../components/common/EntriesSelector";
import { showToast } from "../../components/common/Toast";
import {
  fetchEmployees,
  deleteEmployee,
  updateEmployeeStatus,
} from "../store/slices/employeeSlice";
import Pagination from "../components/common/Paginations";
import ConfirmModal from "../components/common/ConfirmModal";

const Employees = () => {
  const dispatch = useDispatch();
  const { employees = [], loading } = useSelector(
    (state) => state.employees || { employees: [] },
  );

  // Local state for filtering and pagination
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Remove sidebar related state
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  // const [isMobile, setIsMobile] = useState(false);

  // Confirm modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Remove mobile check useEffect - now handled by AdminLayout
  // useEffect(() => {
  //   const checkMobile = () => {
  //     setIsMobile(window.innerWidth < 768);
  //   };
  //   checkMobile();
  //   window.addEventListener("resize", checkMobile);
  //   return () => window.removeEventListener("resize", checkMobile);
  // }, []);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Filter employees based on status and search term
  const getFilteredEmployees = () => {
    let filtered = Array.isArray(employees) ? employees : [];

    if (statusFilter !== "all") {
      filtered = filtered.filter((emp) => emp.status === statusFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          (emp.name || "").toLowerCase().includes(searchLower) ||
          (emp.designation || "").toLowerCase().includes(searchLower) ||
          (emp.department || "").toLowerCase().includes(searchLower),
      );
    }
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();
  const totalFiltered = filteredEmployees.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageEmployees = filteredEmployees.slice(start, start + perPage);

  // Reset to first page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [statusFilter, searchTerm, perPage]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    setDeleteLoading(true);
    const result = await dispatch(deleteEmployee(selectedEmployee.id));

    if (deleteEmployee.fulfilled.match(result)) {
      showToast(`${selectedEmployee.name} deleted successfully`, "success");
      setConfirmOpen(false);
      setSelectedEmployee(null);
      dispatch(fetchEmployees());
    } else {
      showToast("Failed to delete employee", "error");
    }

    setDeleteLoading(false);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const result = await dispatch(
      updateEmployeeStatus({ id, status: newStatus }),
    );
    if (updateEmployeeStatus.fulfilled.match(result)) {
      showToast(`Employee status updated to ${newStatus}`, "success");
      dispatch(fetchEmployees());
    }
  };

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const inactiveCount = employees.filter((e) => e.status === "Inactive").length;
  const onboardingCount = employees.filter((e) => e.status === "Onboarding").length;

  return (
    // Remove the outer div with Sidebar and flex layout
    // Just return the main content directly
    <div className="w-full overflow-x-hidden">
      {/* Stats Cards - Responsive Grid */}
      <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Active Employees Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-user-check text-green-600 dark:text-green-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
            {activeCount}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            Active Employees
          </div>
        </div>

        {/* Inactive Employees Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-user-slash text-red-600 dark:text-red-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
            {inactiveCount}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            Inactive Employees
          </div>
        </div>

        {/* Total Employees Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-blue-600 dark:text-blue-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {employees.length}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            Total Employees
          </div>
        </div>

        {/* Onboarding Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
          <div className="flex justify-between items-start mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <i className="fas fa-user-clock text-amber-600 dark:text-amber-400 text-sm md:text-lg"></i>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {onboardingCount}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            Onboarding
          </div>
        </div>
      </div>

      {/* Header with Filters - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
          Employee Directory
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleStatusFilter("all")}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
              statusFilter === "all"
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilter("Active")}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
              statusFilter === "Active"
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleStatusFilter("Inactive")}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
              statusFilter === "Inactive"
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Inactive
          </button>
          <button
            onClick={() => handleStatusFilter("Onboarding")}
            className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
              statusFilter === "Onboarding"
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Onboarding
          </button>
        </div>
      </div>

      {/* Actions Bar - Fully Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
        <EntriesSelector
          value={perPage}
          onChange={(val) => {
            setPerPage(val);
            setCurrentPage(1);
          }}
        />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by name, designation or department..."
          />
          <Link
            to="/admin/employees/onboarding"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <i className="fas fa-user-plus"></i> Onboarding
          </Link>
          <Link
            to="/admin/employees/add-employee"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <i className="fas fa-plus-circle"></i> Add Employee
          </Link>
        </div>
      </div>

      {/* Employees Table - Horizontal Scroll on Mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
        <div className="min-w-[800px] md:min-w-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  S.L.NO.
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  NAME
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  DESIGNATION
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  DEPARTMENT
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  COMPANY
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  STATUS
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && pageEmployees.length > 0 ? ( 
                pageEmployees.map((emp, idx) => {
                  // Helper function to get photo URL
                  const getEmployeePhoto = () => {
                    // Check multiple possible photo fields
                    const photoValue =
                      emp.avatar ||
                      emp.avatar_path ||
                      emp.passport_size_photo ||
                      emp.profile_photo ||
                      emp.photo ||
                      emp.user?.avatar;

                    if (!photoValue) return null;

                    // Handle object type avatar
                    if (typeof photoValue === "object" && photoValue.path) {
                      const baseUrl =
                        import.meta.env.VITE_API_URL?.replace("/api", "") || "";
                      return `${baseUrl}/storage/${photoValue.path}`;
                    }

                    // Handle string paths
                    if (typeof photoValue === "string") {
                      if (photoValue.startsWith("/tmp/")) {
                        const baseUrl =
                          import.meta.env.VITE_API_URL?.replace("/api", "") ||
                          "";
                        return `${baseUrl}/storage/temp/${photoValue.replace("/tmp/", "")}`;
                      }
                      if (photoValue.startsWith("data:")) return photoValue;
                      if (photoValue.startsWith("http")) return photoValue;

                      const baseUrl =
                        import.meta.env.VITE_API_URL?.replace("/api", "") || "";
                      if (photoValue.startsWith("/storage/"))
                        return `${baseUrl}${photoValue}`;
                      return `${baseUrl}/storage/${photoValue}`;
                    }

                    return null;
                  };

                  const photoUrl = getEmployeePhoto();

                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                        {start + idx + 1}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          {/* Profile Photo */}
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={emp.name}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.querySelector(
                                  ".fallback-avatar",
                                ).style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="fallback-avatar w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm md:text-base font-semibold"
                            style={{ display: photoUrl ? "none" : "flex" }}
                          >
                            {emp.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {emp.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {emp.designation}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {emp.department}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {emp.raw?.user?.company?.company_name ||
                          emp.company ||
                          "-"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <label className="inline-flex items-center gap-1 md:gap-2 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={emp.status === "Active"}
                              onChange={() =>
                                handleStatusToggle(emp.id, emp.status)
                              }
                            />
                            <div className="w-9 h-5 md:w-11 md:h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                          </div>
                          <span
                            className={`text-[10px] md:text-xs font-semibold ${
                              emp.status === "Active"
                                ? "text-green-600 dark:text-green-400"
                                : emp.status === "Onboarding"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </label>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex gap-1 md:gap-2">
                          <Link
                            to={`/admin/employees/${emp.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-500 transition-colors"
                            title="View Details"
                          >
                            <i className="fas fa-eye text-xs md:text-sm"></i>
                          </Link>
                          <Link
                            to={`/admin/employees/edit/${emp.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                            title="Edit"
                          >
                            <i className="fas fa-edit text-xs md:text-sm"></i>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(emp)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <i className="fas fa-trash text-xs md:text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {loading ? "Loading employees..." : "No employees found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Only show if there are items */}
      {totalFiltered > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalFiltered}
          itemsPerPage={perPage}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete "${selectedEmployee?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Employees;
