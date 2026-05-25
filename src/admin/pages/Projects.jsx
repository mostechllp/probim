import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PROJECT_MODULE_NAME } from "../utils/constants";
import { showToast } from "../../components/common/Toast";

// Redux Actions
import {
  fetchProjects,
  addProject,
  updateProject,
  deleteProject,
  clearProjectError
} from "../store/slices/projectSlice";

// Components
import ProjectStatsCards from "../components/projects/ProjectStatsCards";
import ProjectTable from "../components/projects/ProjectTable";
import AddProjectModal from "../components/projects/AddProjectModal";
import ConfirmModal from "../components/common/ConfirmModal";

const Projects = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { projects, loading, actionLoading, error, stats } = useSelector(
    (state) => state.projects
  );

  // Local UI States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState(null);

  // Load Initial Data on Mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Error Listening
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearProjectError());
    }
  }, [error, dispatch]);

  // Open Actions
  const handleAddNew = () => {
    setSelectedProject(null);
    setIsAddOpen(true);
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setIsAddOpen(true);
  };

  const handleDeleteTrigger = (project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  // Submit Operations
  const handleSaveProject = async (projectData) => {
    try {
      if (projectData.id) {
        // Edit Action
        await dispatch(updateProject(projectData)).unwrap();
        showToast(`${PROJECT_MODULE_NAME} updated successfully!`, "success");
      } else {
        // Create Action
        await dispatch(addProject(projectData)).unwrap();
        showToast(`${PROJECT_MODULE_NAME} created successfully!`, "success");
      }
      setIsAddOpen(false);
      setSelectedProject(null);
    } catch (e) {
      // Handled by error listener
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProject) return;
    try {
      await dispatch(deleteProject(selectedProject.id)).unwrap();
      showToast(`${PROJECT_MODULE_NAME} deleted successfully!`, "success");
      setIsDeleteOpen(false);
      setSelectedProject(null);
    } catch (e) {
      // Handled by error listener
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2 tracking-tight">
            {PROJECT_MODULE_NAME}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage corporate projects and track operational activities.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all self-start md:self-auto"
        >
          <i className="fas fa-plus-circle text-sm"></i>
          Add {PROJECT_MODULE_NAME}
        </button>
      </div>

      {/* Top statistics widgets */}
      <ProjectStatsCards stats={stats} loading={loading} />

      {/* Main projects data table */}
      <ProjectTable
        projects={projects}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteTrigger}
        onAddNew={handleAddNew}
      />

      {/* Add / Edit Modal Drawer */}
      <AddProjectModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleSaveProject}
        project={selectedProject}
        actionLoading={actionLoading}
      />

      {/* Cascading Deletion Modal Dialog */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedProject(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${PROJECT_MODULE_NAME}`}
        message={`Are you sure you want to permanently delete project "${selectedProject?.name}"? All assigned employee mappings will be unlinked. This action is irreversible.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        loading={actionLoading}
      />
    </div>
  );
};

export default Projects;
