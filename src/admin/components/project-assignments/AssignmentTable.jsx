import React, { useState, useMemo } from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";
import ProjectTags from "./ProjectTags";
import EmptyState from "../projects/EmptyState";

/* ─── EmployeeProjectsDrawer ─── */
const EmployeeProjectsDrawer = ({ isOpen, onClose, employeeName, projectIds = [], projects = [], employees = [] }) => {
  if (!isOpen) return null;

  const getEmployeeDetails = (empId) => {
    if (!empId) return { name: "Not Assigned", avatar: null, designation: "-" };
    const emp = employees.find((e) => String(e.id) === String(empId));
    return emp ? {
      name: emp.name,
      avatar: emp.avatar,
      designation: emp.designation
    } : { name: "Not Assigned", avatar: null, designation: "-" };
  };

  const getInitials = (name) => (name && name !== "Not Assigned" ? name.charAt(0).toUpperCase() : "N");

  // Get full details for assigned projects
  const assignedProjects = projects.filter((p) => projectIds.includes(String(p.id)));

  return (
    <>
      {/* Backdrop with slide glow */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-[1200] animate-fadeIn"
      />

      {/* Slide Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 shadow-2xl z-[1300] flex flex-col animate-slideLeft overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/40">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Assigned Projects
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide mt-1">
              Resource: <span className="text-green-600 dark:text-green-400 font-bold">{employeeName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {assignedProjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 text-green-500 animate-pulse">
                <i className="fas fa-folder-open text-2xl"></i>
              </div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Assigned Projects</h4>
              <p className="text-xs text-gray-400 mt-2 max-w-[200px] leading-relaxed">
                This employee is not currently mapped to any project directories.
              </p>
            </div>
          ) : (
            assignedProjects.map((proj) => {
              const pm = getEmployeeDetails(proj.managerId);
              const tl = getEmployeeDetails(proj.teamLeadId);

              return (
                <div
                  key={proj.id}
                  className="bg-gray-55 dark:bg-gray-750/30 rounded-2xl border border-gray-100 dark:border-gray-700 p-4.5 space-y-3.5 shadow-sm transform hover:-translate-y-0.5 hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">
                      {proj.name}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${proj.status === "Active"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-gray-150 text-gray-500 dark:text-gray-400"
                        }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  {proj.description && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    {/* Project Manager info */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">PM</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-500/15 flex items-center justify-center border border-gray-100 dark:border-gray-700 flex-shrink-0">
                          {pm.avatar ? (
                            <img src={pm.avatar} alt={pm.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{getInitials(pm.name)}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-350 truncate block max-w-[90px]" title={pm.name}>
                          {pm.name}
                        </span>
                      </div>
                    </div>

                    {/* Team Lead info */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">TL</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-500/15 flex items-center justify-center border border-gray-100 dark:border-gray-700 flex-shrink-0">
                          {tl.avatar ? (
                            <img src={tl.avatar} alt={tl.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">{getInitials(tl.name)}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-350 truncate block max-w-[90px]" title={tl.name}>
                          {tl.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

/* ─── Main Table Component ─── */
const AssignmentTable = ({
  assignments, // Array of { employeeId, projectIds, lastUpdated }
  employees, // List of all employees to map names/avatars
  projects, // List of all projects for name labels
  loading, // Loading state
  onEdit, // Edit trigger callback
  onDelete, // Delete trigger callback
  onAddNew // Trigger drawer for new assignments
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("employeeName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Side Drawer state for single employee assignments
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEmployee, setDrawerEmployee] = useState(null);

  // Map assignments to include employee information for quick searches and sorts
  const fullAssignments = useMemo(() => {
    return assignments.map((assign) => {
      const emp = employees.find((e) => Number(e.id) === Number(assign.employeeId));
      let employeeName = emp?.name || "";
      if (!employeeName && emp) {
        employeeName = [emp.first_name, emp.last_name].filter(Boolean).join(" ");
      }
      if (!employeeName && emp) {
        employeeName = emp.user?.username || `Employee #${emp.id}`;
      }
      if (!employeeName) employeeName = `Employee #${assign.employeeId}`;

      return {
        ...assign,
        employeeName,
        designation: emp?.designation || emp?.user?.designation?.name || "-",
        department: emp?.department || emp?.user?.department?.name || "-",
        avatar: emp?.avatar || null,
        projectCount: assign.projectIds?.length || 0
      };
    });
  }, [assignments, employees]);

  // Lookup function for Team Leads for assigned projects
  const getProjectTeamLeads = (projectIds) => {
    if (!projectIds || projectIds.length === 0) {
      return <span className="text-gray-400 dark:text-gray-500 italic text-[11px]">No Projects Mapped</span>;
    }

    // Find unique team lead names
    const leads = [];
    projectIds.forEach((projId) => {
      const proj = projects.find((p) => String(p.id) === String(projId));
      if (proj && proj.teamLeadId) {
        const leadEmp = employees.find((e) => String(e.id) === String(proj.teamLeadId));
        if (leadEmp && leadEmp.name && !leads.includes(leadEmp.name)) {
          leads.push(leadEmp.name);
        }
      }
    });

    if (leads.length === 0) {
      return <span className="text-gray-450 italic text-[11px]">Not Assigned</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {leads.map((leadName, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-650 bg-purple-500/10 dark:text-purple-300 dark:bg-purple-500/15 px-2 py-0.5 rounded-md max-w-[150px] truncate"
            title={leadName}
          >
            <i className="fas fa-user-tie text-[8px] opacity-75"></i>
            {leadName}
          </span>
        ))}
      </div>
    );
  };

  // Handle column sorting toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Client side search filtering
  const filteredAssignments = useMemo(() => {
    return fullAssignments.filter((assign) => {
      const matchName = assign.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = assign.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = assign.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEmpId = String(assign.employeeId).includes(searchTerm);

      // Also match assigned projects names
      const matchProjects = assign.projectIds.some((projId) => {
        const proj = projects.find((p) => String(p.id) === String(projId));
        return proj?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });

      return matchName || matchRole || matchDept || matchProjects || matchEmpId;
    });
  }, [fullAssignments, searchTerm, projects]);

  // Client side sorting
  const sortedAssignments = useMemo(() => {
    const sorted = [...filteredAssignments];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
    });
    return sorted;
  }, [filteredAssignments, sortField, sortDirection]);

  // Pagination bounds calculation
  const totalItems = sortedAssignments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAssignments.slice(start, start + itemsPerPage);
  }, [sortedAssignments, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page number on search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "E";
  };

  const handleOpenDrawer = (assign) => {
    setDrawerEmployee(assign);
    setDrawerOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-soft overflow-hidden animate-fadeIn">

      {/* Utilities Control Bar */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Page entry selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
            Show
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-650 bg-transparent text-gray-750 dark:text-gray-300 text-xs font-semibold focus:outline-none focus:border-green-500 transition-colors"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">
            entries
          </span>
        </div>

        {/* Global Filter Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search employee, ID or assigned projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-250 dark:border-gray-600 bg-gray-55 dark:bg-gray-750 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 transition-all placeholder:text-gray-400"
          />
          <i className="fas fa-search absolute left-3 top-3 text-gray-400 text-xs"></i>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-700/25 border-b border-gray-100 dark:border-gray-700">
              <th
                onClick={() => handleSort("employeeName")}
                className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 select-none whitespace-nowrap transition-colors"
              >
                Employee Name{" "}
                {sortField === "employeeName" && (
                  <i className={`fas fa-sort-amount-${sortDirection === "asc" ? "up" : "down"} text-green-500 ml-1.5`}></i>
                )}
              </th>
              <th
                onClick={() => handleSort("employeeId")}
                className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/30 select-none text-center whitespace-nowrap transition-colors"
              >
                Employee ID{" "}
                {sortField === "employeeId" && (
                  <i className={`fas fa-sort-amount-${sortDirection === "asc" ? "up" : "down"} text-green-500 ml-1.5`}></i>
                )}
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none whitespace-nowrap">
                Assigned {PROJECT_MODULE_NAME}s
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none whitespace-nowrap">
                Team Lead
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {loading ? (
              // Loading Skeleton Layouts
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div>
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-1"></div>
                        <div className="h-3 bg-gray-150 dark:bg-gray-700/60 rounded w-16"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedAssignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10">
                  <EmptyState
                    message={searchTerm ? "No Match Found" : "No Assignments Found"}
                    description={
                      searchTerm
                        ? "We couldn't find any assignments matching your search queries. Try modifying your filter term."
                        : `Start by mapping projects to employee profiles in your organization.`
                    }
                    onAction={searchTerm ? null : onAddNew}
                    actionText={searchTerm ? null : "Assign Projects"}
                  />
                </td>
              </tr>
            ) : (
              paginatedAssignments.map((assign) => (
                <tr
                  key={assign.employeeId}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors group"
                >
                  {/* Employee Info Card */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        onClick={() => handleOpenDrawer(assign)}
                        className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-500/10 dark:to-teal-500/10 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-green-400 transition-all"
                      >
                        {assign.avatar ? (
                          <img src={assign.avatar} alt={assign.employeeName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {getInitials(assign.employeeName)}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <span
                          onClick={() => handleOpenDrawer(assign)}
                          className="text-sm font-bold text-gray-800 dark:text-gray-200 block hover:text-green-550 cursor-pointer transition-colors"
                        >
                          {assign.employeeName}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block leading-none mt-1 font-semibold">
                          {assign.designation} &bull; {assign.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Employee ID Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-gray-500 dark:text-gray-400">
                    #{assign.employeeId}
                  </td>

                  {/* Assigned Tags List */}
                  <td className="px-6 py-4">
                    <ProjectTags
                      projectIds={assign.projectIds}
                      projectsList={projects}
                    />
                  </td>

                  {/* Resolved Team Leads badges column */}
                  <td className="px-6 py-4">
                    {getProjectTeamLeads(assign.projectIds)}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end items-center gap-2">
                      {/* View Assignments (Drawer) */}
                      <button
                        onClick={() => handleOpenDrawer(assign)}
                        title="View Assignments Card"
                        className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-50 text-blue-550 hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow-soft"
                      >
                        <i className="fas fa-eye text-xs"></i>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit(assign)}
                        title="Edit Assignment"
                        className="w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow-soft"
                      >
                        <i className="fas fa-pencil-alt text-xs"></i>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDelete(assign)}
                        title="Delete Assignment"
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow-soft"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="px-6 py-4 bg-gray-55 dark:bg-gray-800/40 border-t border-gray-150 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold text-center sm:text-left">
            Showing <span className="font-bold text-gray-700 dark:text-gray-200">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
            <span className="font-bold text-gray-700 dark:text-gray-200">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
            <span className="font-bold text-gray-700 dark:text-gray-200">{totalItems}</span> entries
          </span>

          <div className="flex justify-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-655 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-transparent hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-550 transition-all select-none"
            >
              <i className="fas fa-angle-left"></i>
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNo = idx + 1;
              return (
                <button
                  key={pageNo}
                  onClick={() => handlePageChange(pageNo)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all select-none ${currentPage === pageNo
                    ? "bg-green-500 text-white shadow-soft"
                    : "border border-gray-200 dark:border-gray-650 text-gray-600 dark:text-gray-400 bg-transparent hover:bg-green-500/10 hover:border-green-500 hover:text-green-500"
                    }`}
                >
                  {pageNo}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-655 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-transparent hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-550 transition-all select-none"
            >
              <i className="fas fa-angle-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Slide Drawer for project assignments detailed cards */}
      <EmployeeProjectsDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerEmployee(null);
        }}
        employeeName={drawerEmployee?.employeeName || ""}
        projectIds={drawerEmployee?.projectIds || []}
        projects={projects}
        employees={employees}
      />
    </div>
  );
};

export default AssignmentTable;
