import React, { useState, useEffect, useRef } from "react";
import { getPhotoUrl, getFallbackAvatar } from "../../../utils/imageHelper";


const EmployeeSearchSelect = ({
  employees, // List of all employees to choose from
  selectedEmployeeId, // The currently chosen employee ID
  onChange, // Callback when selection changes
  disabled // Disabled state (e.g. in Edit mode, employee selection should be locked)
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Standardize employees list format
  const mappedEmployees = React.useMemo(() => {
    return employees.map((emp) => {
      let name = emp.name;
      if (!name) {
        name = [emp.first_name, emp.last_name].filter(Boolean).join(" ");
      }
      if (!name) name = emp.user?.username || `Employee #${emp.id}`;

      return {
        id: Number(emp.id),
        name,
        department: emp.department || emp.user?.department?.name || "-",
        designation: emp.designation || emp.user?.designation?.name || "-",
        avatar: getPhotoUrl(emp.avatar) || null
      };
    });
  }, [employees]);

  // Find the selected employee details
  const selectedEmployee = mappedEmployees.find(
    (emp) => emp.id === Number(selectedEmployeeId)
  );

  // Filter list based on search query
  const filteredEmployees = React.useMemo(() => {
    return mappedEmployees.filter((emp) => {
      const matchName = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchDept || matchRole;
    });
  }, [mappedEmployees, searchTerm]);

  const handleSelect = (emp) => {
    onChange(emp.id);
    setSearchTerm("");
    setIsOpen(false);
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "E";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
        Select Employee <span className="text-red-500">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm text-left bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-soft focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-700/30 border-gray-150 dark:border-gray-700" : "border-gray-200 dark:border-gray-650"
          }`}
      >
        {selectedEmployee ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-500/10 dark:to-teal-500/10 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700">
              {selectedEmployee.avatar ? (
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getFallbackAvatar(selectedEmployee.name);
                  }}
                />
              ) : (
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                  {getInitials(selectedEmployee.name)}
                </span>
              )}
            </div>
            {/* Info */}
            <span className="font-semibold truncate">
              {selectedEmployee.name}{" "}
              <span className="text-[10px] text-gray-400 font-normal leading-none ml-1">
                ({selectedEmployee.designation})
              </span>
            </span>
          </div>
        ) : (
          <span className="text-gray-400 font-medium">Choose an employee...</span>
        )}

        {!disabled && (
          <i className={`fas fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}></i>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-[78px] left-0 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-150 dark:border-gray-700/60 z-50 overflow-hidden animate-slideUp">

          {/* Search box inside dropdown */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 relative">
            <input
              type="text"
              placeholder="Search by name, department, designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-gray-400"
            />
            <i className="fas fa-search absolute left-6 top-5 text-gray-400 text-xs"></i>
          </div>

          {/* List items */}
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-xs italic">
                No employees matching search
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isCurrent = Number(emp.id) === Number(selectedEmployeeId);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isCurrent
                        ? "bg-green-500/10 dark:bg-green-500/5 text-green-600 dark:text-green-400 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-500/10 dark:to-teal-500/10 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700">
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getFallbackAvatar(emp.name);
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                          {getInitials(emp.name)}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{emp.name}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-none mt-1">
                        {emp.designation} &bull; {emp.department}
                      </p>
                    </div>

                    {isCurrent && <i className="fas fa-check text-xs"></i>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSearchSelect;
