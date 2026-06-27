import { X } from "lucide-react";
import { useState } from "react";
import DateInput from "../common/DateInput";

export const AssignAssetModal = ({ isOpen, onClose, onSubmit, assignmentData, setAssignmentData, selectedAsset, employees, employeesLoading, isSubmitting }) => {
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [, setSelectedEmployee] = useState(null);

  const filteredEmployees = (employees || []).filter((emp) => {
    const employeeName = emp.name ? String(emp.name).toLowerCase() : "";
    const employeeId = emp.id ? String(emp.id).toLowerCase() : "";
    const searchLower = employeeSearchQuery.toLowerCase();
    return employeeName.includes(searchLower) || employeeId.includes(searchLower);
  });

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setAssignmentData({
      ...assignmentData,
      employeeId: emp.id,
      employeeName: emp.name,
    });
    setEmployeeSearchQuery(emp.name);
    setShowEmployeeDropdown(false);
  };

  const resetForm = () => {
    setEmployeeSearchQuery("");
    setShowEmployeeDropdown(false);
    setSelectedEmployee(null);
  };

  const handleDateChange = (field, value) => {
    setAssignmentData({ ...assignmentData, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Assign Asset</h2>
          <button onClick={() => { onClose(); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Asset</label>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedAsset?.asset_name || selectedAsset?.assetName || "Unknown Asset"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {selectedAsset?.id || selectedAsset?.assetId}
              </p>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Select Employee <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search employee by name or ID..."
                value={employeeSearchQuery}
                onChange={(e) => { setEmployeeSearchQuery(e.target.value); setShowEmployeeDropdown(true); }}
                onFocus={() => setShowEmployeeDropdown(true)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              {employeeSearchQuery && (
                <button onClick={() => { setEmployeeSearchQuery(""); setAssignmentData({ ...assignmentData, employeeId: "", employeeName: "" }); setSelectedEmployee(null); }} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <X size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {showEmployeeDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {employeesLoading ? (
                  <div className="p-3 text-center text-xs text-gray-400">Loading employees...</div>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <button key={emp.id} type="button" onClick={() => handleSelectEmployee(emp)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.id} • {emp.department}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-gray-400">No employees found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Assigned Date <span className="text-red-500">*</span></label>
            <DateInput
              value={assignmentData.assignedDate}
              onChange={(value) => handleDateChange("assignedDate", value)}
              placeholder="Select assigned date"
              className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Expected Return Date (Optional)</label>
            <DateInput
              value={assignmentData.expectedReturnDate}
              onChange={(value) => handleDateChange("expectedReturnDate", value)}
              placeholder="Select expected return date"
              className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notes (Optional)</label>
            <textarea 
              value={assignmentData.notes} 
              onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })} 
              rows={3} 
              placeholder="Any additional notes about this assignment..." 
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none" 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => { onClose(); resetForm(); }} className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
          <button onClick={onSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Assign Asset"}
          </button>
        </div>
      </div>
    </div>
  );
};