import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SearchBar from "@admin/components/common/SearchBar";
import EntriesSelector from "@admin/components/common/EntriesSelector";
import Pagination from "@admin/components/common/Paginations";
import { fetchEmployees } from "@admin/store/slices/employeeSlice";
import {
  fetchLeaveTypes,
  fetchLeaveAllocations,
} from "@admin/store/slices/LeaveSlice";

// Color mapping for leave types
const getLeaveTypeColor = (typeName) => {
  const name = typeName?.toLowerCase() || "";
  
  if (name.includes("sick")) return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
  if (name.includes("annual") || name.includes("vacation")) return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
  if (name.includes("casual")) return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
  if (name.includes("maternity") || name.includes("paternity")) return "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300";
  if (name.includes("unpaid")) return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300";
  
  // Default pastel color for other types
  return "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300";
};

const LeaveAllocations = () => {
  const dispatch = useDispatch();
  const { employees = [] } = useSelector((state) => state.employees || {});
  const { leaveTypes = [] } = useSelector((state) => state.leaves || {});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({});
  const { user } = useSelector((state) => state.auth || {});
  const routePrefix = user?.type === "employee" ? "/employee" : "/admin";
  const leavesUrl = user?.type === "employee" ? "/employee/leave-management" : "/admin/leaves";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await dispatch(fetchEmployees());
      await dispatch(fetchLeaveTypes());
      try {
        const result = await dispatch(fetchLeaveAllocations()).unwrap();
        console.log("Fetched all leave allocations:", result);
        
        const balances = {};
        let allocationsList = [];
        
        if (Array.isArray(result)) {
          allocationsList = result;
        } else if (result && Array.isArray(result.data)) {
          allocationsList = result.data;
        } else if (result && typeof result === "object") {
          allocationsList = Object.entries(result).map(([employeeId, data]) => ({
            employee_id: parseInt(employeeId),
            allocations: data.allocations || data
          }));
        }

        allocationsList.forEach(item => {
          const employeeId = item.employee_id || item.employee?.id;
          if (employeeId) {
            let allocs = [];
            if (item.allocations) {
              allocs = Array.isArray(item.allocations) 
                ? item.allocations 
                : Object.values(item.allocations);
            } else if (item.balances) {
              allocs = Array.isArray(item.balances)
                ? item.balances
                : Object.values(item.balances);
            } else if (Array.isArray(item)) {
              allocs = item;
            } else {
              if (!balances[employeeId]) {
                balances[employeeId] = [];
              }
              balances[employeeId].push(item);
              return;
            }
            balances[employeeId] = allocs;
          }
        });

        if (Array.isArray(allocationsList) && allocationsList.length > 0 && !allocationsList[0].allocations) {
          allocationsList.forEach(alloc => {
            const employeeId = alloc.employee_id || alloc.employee?.id;
            if (employeeId) {
              if (!balances[employeeId]) {
                balances[employeeId] = [];
              }
              const exists = balances[employeeId].some(existing => existing.id === alloc.id || existing.leave_type_id === alloc.leave_type_id);
              if (!exists) {
                balances[employeeId].push(alloc);
              }
            }
          });
        }

        setLeaveBalances(balances);
      } catch (error) {
        console.error("Failed to fetch leave allocations:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [dispatch]);

  const getFilteredEmployees = () => {
    let filtered = [...employees];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          (emp.name || "").toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();
  const totalFiltered = filteredEmployees.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageEmployees = filteredEmployees.slice(start, start + perPage);

  const getLeaveTypeId = (leaveTypeName) => {
    const leaveType = leaveTypes.find(type => type.name === leaveTypeName);
    return leaveType?.id;
  };

  const getAllocationValue = (employeeId, leaveTypeName, field) => {
    const leaveTypeId = getLeaveTypeId(leaveTypeName);
    const balances = leaveBalances[employeeId];
    
    if (!balances || !Array.isArray(balances) || !leaveTypeId) return 0;
    
    const allocation = balances.find(a => a.leave_type_id === leaveTypeId);
    
    if (!allocation) return 0;
    
    const allocatedDays = parseFloat(allocation.allocated_days) || 0;
    const usedDays = parseFloat(allocation.used) || 0;
    
    if (field === "alloc") return allocatedDays;
    if (field === "used") return usedDays;
    if (field === "bal") return allocatedDays - usedDays;
    return 0;
  };

  const formatNumber = (value) => {
    return value || 0;
  };

  // Helper function to get photo URL
  const getEmployeePhoto = (employee) => {
    const photoValue =
      employee.avatar ||
      employee.avatar_path ||
      employee.passport_size_photo ||
      employee.profile_photo ||
      employee.photo ||
      employee.user?.avatar;

    if (!photoValue) return null;

    if (typeof photoValue === "object" && photoValue.path) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
      return `${baseUrl}/storage/${photoValue.path}`;
    }

    if (typeof photoValue === "string") {
      if (photoValue.startsWith("/tmp/")) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
        return `${baseUrl}/storage/temp/${photoValue.replace("/tmp/", "")}`;
      }
      if (photoValue.startsWith("data:")) return photoValue;
      if (photoValue.startsWith("http")) return photoValue;

      const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
      if (photoValue.startsWith("/storage/")) return `${baseUrl}${photoValue}`;
      return `${baseUrl}/storage/${photoValue}`;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="w-full px-4 md:px-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link
          to={leavesUrl}
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Leaves
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">
          Leave Allocations
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Leave Allocations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Employee Leave Balances ({new Date().getFullYear()})
          </p>
        </div>
        <Link
          to={leavesUrl}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Requests
        </Link>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
        <EntriesSelector value={perPage} onChange={setPerPage} />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by employee name..."
          />
        </div>
      </div>

      {/* Leave Allocations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Sl.No.
                </th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Employee
                </th>
                {/* Dynamic Leave Type Columns with Pastel Colors */}
                {leaveTypes.map((type) => {
                  const colorClass = getLeaveTypeColor(type.name);
                  return (
                    <th 
                      key={type.id} 
                      className={`px-3 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold whitespace-nowrap ${colorClass}`}
                    >
                      {type.name}
                    </th>
                  );
                })}
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Action
                </th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th colSpan="2" className="px-3 md:px-4 py-1"></th>
                {leaveTypes.map((type) => (
                  <th key={`sub-${type.id}`} className="px-3 md:px-4 py-1 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center gap-2">
                      <span>Alloc</span>
                      <span>|</span>
                      <span>Used</span>
                      <span>|</span>
                      <span>Bal</span>
                    </div>
                  </th>
                ))}
                <th className="px-3 md:px-4 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {pageEmployees.length > 0 ? (
                pageEmployees.map((employee, idx) => {
                  const photoUrl = getEmployeePhoto(employee);

                  return (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                        {start + idx + 1}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={employee.name}
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
                            {employee.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {employee.name}
                          </span>
                        </div>
                      </td>

                      {/* Dynamic Leave Type Values */}
                      {leaveTypes.map((type) => {
                        const alloc = getAllocationValue(
                          employee.id,
                          type.name,
                          "alloc",
                        );
                        const used = getAllocationValue(
                          employee.id,
                          type.name,
                          "used",
                        );
                        const bal = alloc - used;

                        return (
                          <td key={`${employee.id}-${type.id}`} className="px-3 md:px-4 py-2 md:py-3">
                            <div className="flex justify-center items-center gap-2">
                              <span className="text-xs md:text-sm font-semibold text-green-600 dark:text-green-400 min-w-[30px] text-center">
                                {formatNumber(alloc)}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 min-w-[30px] text-center">
                                {formatNumber(used)}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span
                                className={`text-xs md:text-sm font-semibold min-w-[30px] text-center ${bal < 0 ? "text-red-600" : "text-blue-600"}`}
                              >
                                {formatNumber(bal)}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <Link
                          to={`${routePrefix}/leaves/allocations/${employee.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors inline-block"
                          title="Edit Allocations"
                        >
                          <i className="fas fa-edit text-xs md:text-sm"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={3 + leaveTypes.length}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalFiltered > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalFiltered}
          itemsPerPage={perPage}
        />
      )}
    </div>
  );
};

export default LeaveAllocations;