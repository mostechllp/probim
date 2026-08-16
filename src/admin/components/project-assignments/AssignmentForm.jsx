import React, { useState, useEffect } from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";
import EmployeeSearchSelect from "./EmployeeSearchSelect";
import ProjectMultiSelect from "./ProjectMultiSelect";
import { createPortal } from "react-dom";

const AssignmentForm = ({
  employees, // List of all employees to choose from
  projects, // List of all projects available
  existingAssignments, // Current assignments from Redux store for duplicate check
  selectedAssignment, // If editing, holds { employeeId, projectIds }
  onSave, // Submit handler
  onCancel, // Cancel handler
  actionLoading
}) => {
  const [employeeId, setEmployeeId] = useState("");
  const [projectIds, setProjectIds] = useState([]);
  const [error, setError] = useState("");

  const isEditMode = !!selectedAssignment;

  // Sync state with selectedAssignment on mount or edit trigger
  useEffect(() => {
    if (selectedAssignment) {
      setEmployeeId(selectedAssignment.employeeId || "");
      setProjectIds(selectedAssignment.projectIds || []);
      setError("");
    } else {
      setEmployeeId("");
      setProjectIds([]);
      setError("");
    }
  }, [selectedAssignment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!projectIds || projectIds.length === 0) {
      setError(`Please select at least one ${PROJECT_MODULE_NAME} to assign.`);
      return;
    }

    const empId = Number(employeeId);

    // Duplicate Check: Verify if employee already has mappings defined (only in CREATE mode)
    if (!isEditMode) {
      const isDuplicate = existingAssignments.some(
        (a) => Number(a.employeeId) === empId
      );
      if (isDuplicate) {
        setError(
          "An assignment mapping already exists for this employee. Please edit the existing assignment instead."
        );
        return;
      }
    }

    onSave({
      employeeId: empId,
      projectIds
    });
  };

  const handleReset = () => {
    if (selectedAssignment) {
      setEmployeeId(selectedAssignment.employeeId || "");
      setProjectIds(selectedAssignment.projectIds || []);
    } else {
      setEmployeeId("");
      setProjectIds([]);
    }
    setError("");
  };

  return createPortal(
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2.5">
          <i className="fas fa-triangle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Field 1: Employee Selector */}
      <EmployeeSearchSelect
        employees={employees}
        selectedEmployeeId={employeeId}
        onChange={setEmployeeId}
        disabled={isEditMode || actionLoading} // Locked in Edit mode to preserve key relations
      />

      {/* Field 2: Projects Multi Select */}
      <ProjectMultiSelect
        projects={projects}
        selectedProjectIds={projectIds}
        onChange={setProjectIds}
        disabled={actionLoading}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={actionLoading}
          className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={actionLoading}
          className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all disabled:opacity-50"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={actionLoading}
          className="px-6 py-2.5 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/70 text-white text-xs font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 disabled:transform-none transition-all"
        >
          {actionLoading ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i>
              {isEditMode ? "Save Changes" : "Save Assignment"}
            </>
          )}
        </button>
      </div>
    </form>,
    document.body
  );
};

export default AssignmentForm;
