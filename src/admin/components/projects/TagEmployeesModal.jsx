import React from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";
import EmployeeTransferList from "./EmployeeTransferList";

const TagEmployeesModal = ({
  isOpen,
  onClose,
  project, // The project currently being modified
  employees, // List of all employees to choose from
  onSave, // Save callback
  actionLoading
}) => {
  if (!isOpen || !project) return null;

  const handleSaveAssignments = (taggedEmployeeIds) => {
    onSave({
      projectId: project.id,
      employeeIds: taggedEmployeeIds
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl shadow-soft-lg border border-gray-150 dark:border-gray-700/60 overflow-hidden transform scale-100 transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/20">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <i className="fas fa-users-gear text-sm animate-bounce"></i>
              </div>
              Tag Employees to Project
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
              Manage resource allocation for project: <strong className="text-gray-700 dark:text-gray-300">{project.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <EmployeeTransferList
            employees={employees}
            initiallyTaggedIds={project.taggedEmployees || []}
            onSave={handleSaveAssignments}
            onCancel={onClose}
            actionLoading={actionLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default TagEmployeesModal;
