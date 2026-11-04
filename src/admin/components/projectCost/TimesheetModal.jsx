// src/admin/components/projectCost/TimesheetModal.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import SearchableSelect from "../../../components/common/SearchableSelect"; 
import DateInput from "../common/DateInput"; 

// Import the thunks
import { fetchEmployees } from "../../store/slices/employeeSlice"; 
import { fetchProjects } from "../../store/slices/projectSlice";

const TimesheetModal = ({ isOpen, onClose, onSave, initialData, loading }) => {
  const dispatch = useDispatch();
  
  // Get from store
  const { employees, loading: empLoading } = useSelector((state) => state.employees || {});
  const { projects, loading: projLoading } = useSelector((state) => state.projects || {});

  const [formData, setFormData] = useState({
    employee_id: "",
    project_id: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    description: "",
  });

  // Fetch data if not present
  useEffect(() => {
    if (isOpen) {
      if (!employees || employees.length === 0) {
        dispatch(fetchEmployees());
      }
      if (!projects || projects.length === 0) {
        dispatch(fetchProjects());
      }
    }
  }, [isOpen, dispatch, employees, projects]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        employee_id: initialData.employee_id || initialData.employee?.id || "",
        project_id: initialData.project_id || initialData.project?.id || "",
        date: initialData.date || initialData.log_date || new Date().toISOString().split("T")[0],
        hours: initialData.hours || initialData.total_hours || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        employee_id: "",
        project_id: "",
        date: new Date().toISOString().split("T")[0],
        hours: "",
        description: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: initialData?.id });
  };

  // Map data for SearchableSelect - safety checks added
  const employeeOptions = Array.isArray(employees) 
    ? employees.map(emp => ({ value: String(emp.id), label: emp.name })) 
    : [];
    
  const projectOptions = Array.isArray(projects) 
    ? projects.map(proj => ({ value: String(proj.id), label: proj.name })) 
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          {initialData ? "Edit Timesheet" : "New Timesheet"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <SearchableSelect
            label="Employee"
            required
            value={formData.employee_id}
            onChange={(val) => setFormData({ ...formData, employee_id: val })}
            options={employeeOptions}
            loading={empLoading}
            placeholder="Select Employee"
          />

          <SearchableSelect
            label="Project"
            required
            value={formData.project_id}
            onChange={(val) => setFormData({ ...formData, project_id: val })}
            options={projectOptions}
            loading={projLoading}
            placeholder="Select Project"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
              <DateInput 
                value={formData.date} 
                onChange={(val) => setFormData({ ...formData, date: val })} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hours</label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5" 
                max="24" 
                required 
                value={formData.hours} 
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description / Task</label>
            <textarea 
              rows="2" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimesheetModal;