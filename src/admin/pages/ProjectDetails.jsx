import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PROJECT_MODULE_NAME } from "../utils/constants";
import { showToast } from "../../components/common/Toast";

// Redux Actions
import {
  fetchProjectById,
  updateProject,
  deleteProject,
  clearProjectError
} from "../store/slices/projectSlice";
import { fetchEmployees } from "../store/slices/employeeSlice";

// Components
import AddProjectModal from "../components/projects/AddProjectModal";
import ConfirmModal from "../components/common/ConfirmModal";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux Selectors
  const { currentProject, loading, actionLoading, error, validationErrors } = useSelector(
    (state) => state.projects
  );
  const { employees } = useSelector((state) => state.employees);

  // Local UI States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch initial data on mount/change
  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchEmployees());
    }
  }, [dispatch, id]);

  // Error listening
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearProjectError());
    }
  }, [error, dispatch]);

  const getEmployeeName = (empId) => {
    if (!empId) return "Not Assigned";
    const emp = employees.find((e) => String(e.id) === String(empId));
    return emp ? emp.name : "Not Assigned";
  };

  const getEmployeeDesignation = (empId) => {
    if (!empId) return "-";
    const emp = employees.find((e) => String(e.id) === String(empId));
    return emp ? emp.designation : "-";
  };

  const getEmployeeAvatar = (empId) => {
    if (!empId) return null;
    const emp = employees.find((e) => String(e.id) === String(empId));
    return emp ? emp.avatar : null;
  };

  const getInitials = (name) => {
    return name && name !== "Not Assigned" ? name.charAt(0).toUpperCase() : "N";
  };

  // Submit Operations
  const handleSaveProject = async (projectData) => {
    try {
      await dispatch(updateProject(projectData)).unwrap();
      showToast(`${PROJECT_MODULE_NAME} details updated successfully!`, "success");
      setIsEditOpen(false);
      // Reload details
      dispatch(fetchProjectById(id));
    } catch (e) {
      // Handled by error listener
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      showToast(`${PROJECT_MODULE_NAME} deleted successfully!`, "success");
      setIsDeleteOpen(false);
      navigate("/admin/projects");
    } catch (e) {
      // Handled by error listener
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto animate-pulse">
        {/* Skeleton Header */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-3 bg-gray-150 dark:bg-gray-700/60 rounded w-32"></div>
          </div>
        </div>

        {/* Skeleton Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject && !loading) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 animate-fadeIn">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
          <i className="fas fa-folder-open text-2xl"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Project Not Found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The project you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-all shadow-soft"
        >
          <i className="fas fa-arrow-left"></i> Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto animate-fadeIn">
      {/* Header section with back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700/60 pb-5">
        <div className="flex items-center gap-3.5">
          <Link
            to="/admin/projects"
            className="w-10 h-10 rounded-full border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-green-500 flex items-center justify-center shadow-soft hover:shadow-soft-lg transform hover:-translate-x-0.5 transition-all"
            title="Back to projects"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-150 tracking-tight">
                {currentProject.name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  currentProject.status === "Active"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-gray-150/60 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {currentProject.status}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold mt-1">
              Project Code: #{currentProject.id} &bull; Created: {currentProject.createdDate}
            </p>
          </div>
        </div>

        {/* Edit and Delete action controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <i className="fas fa-pencil-alt text-xs text-green-500"></i>
            Edit Project
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-4 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all"
          >
            <i className="fas fa-trash-alt text-xs"></i>
            Delete Project
          </button>
        </div>
      </div>

      {/* Main content split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Metadata Card & Assigned Employee List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Detailed Project Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6 shadow-soft space-y-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-750 pb-2">
              Project Description
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-350 leading-relaxed font-medium">
              {currentProject.description || (
                <span className="italic text-gray-400">No project scope or description has been written for this directory yet. Edit the project details to add description records.</span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-750 text-xs">
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Created Date</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 mt-1 block">
                  <i className="far fa-calendar-alt text-gray-400 mr-1.5"></i>
                  {currentProject.createdDate || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Last Updated</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 mt-1 block">
                  <i className="far fa-clock text-gray-400 mr-1.5"></i>
                  {currentProject.updatedDate || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Leadership Hierarchy Cards */}
        <div className="space-y-6">
          
          {/* Project Manager Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-soft space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
              Project Manager
            </span>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-gray-100 dark:border-gray-750 flex-shrink-0 shadow-sm">
                {getEmployeeAvatar(currentProject.managerId) ? (
                  <img src={getEmployeeAvatar(currentProject.managerId)} alt="PM Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {getInitials(getEmployeeName(currentProject.managerId))}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                  {getEmployeeName(currentProject.managerId)}
                </h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold truncate leading-none mt-1">
                  {getEmployeeDesignation(currentProject.managerId)}
                </p>
              </div>
            </div>
          </div>

          {/* Team Lead Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 shadow-soft space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
              Team Lead
            </span>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-gray-100 dark:border-gray-750 flex-shrink-0 shadow-sm">
                {getEmployeeAvatar(currentProject.teamLeadId) ? (
                  <img src={getEmployeeAvatar(currentProject.teamLeadId)} alt="TL Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {getInitials(getEmployeeName(currentProject.teamLeadId))}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                  {getEmployeeName(currentProject.teamLeadId)}
                </h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold truncate leading-none mt-1">
                  {getEmployeeDesignation(currentProject.teamLeadId)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Drawer Modal */}
      <AddProjectModal
        isOpen={isEditOpen}
        employees={employees}
        onClose={() => {
          setIsEditOpen(false);
          dispatch(clearProjectError());
        }}
        onSave={handleSaveProject}
        project={currentProject}
        actionLoading={actionLoading}
        validationErrors={validationErrors}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${PROJECT_MODULE_NAME}`}
        message={`Are you sure you want to permanently delete project "${currentProject.name}"? This action is irreversible and all resource assigned mappings will be deleted.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        loading={actionLoading}
      />
    </div>
  );
};

export default ProjectDetails;
