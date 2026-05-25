import React, { useState, useEffect, useRef } from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";

const ProjectMultiSelect = ({
  projects, // List of all projects available
  selectedProjectIds, // Array of currently assigned project IDs
  onChange // Callback when selections change
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedIds = React.useMemo(() => {
    return (selectedProjectIds || []).map(String);
  }, [selectedProjectIds]);

  // Selected project details
  const selectedProjects = React.useMemo(() => {
    return projects.filter((p) => selectedIds.includes(String(p.id)));
  }, [projects, selectedIds]);

  // Available options filtering based on search
  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [projects, searchTerm]);

  const handleSelectToggle = (id) => {
    const stringId = String(id);
    let updated;
    if (selectedIds.includes(stringId)) {
      updated = selectedIds.filter((item) => item !== stringId);
    } else {
      updated = [...selectedIds, stringId];
    }
    onChange(updated);
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== String(id)));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
        Assign {PROJECT_MODULE_NAME}s <span className="text-red-500">*</span>
      </label>

      {/* Trigger Select Box (with Chip Tags inside) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-650 bg-white dark:bg-gray-800 flex flex-wrap items-center gap-1.5 cursor-pointer shadow-soft focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all select-none pr-9 relative"
      >
        {selectedProjects.length === 0 ? (
          <span className="text-gray-400 font-medium text-sm">Choose projects...</span>
        ) : (
          selectedProjects.map((proj) => (
            <span
              key={proj.id}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-300 bg-green-500/10 dark:bg-green-500/5 rounded-full border border-green-500/10 max-w-[150px] truncate"
            >
              <span className="truncate" title={proj.name}>{proj.name}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(e, proj.id)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-green-500/20 text-green-600 dark:text-green-400 hover:text-green-700 transition-all text-[9px] flex-shrink-0"
              >
                &#10005;
              </button>
            </span>
          ))
        )}

        {/* Arrow indicators */}
        <div className="absolute right-3.5 top-3 flex items-center justify-center text-gray-400 pointer-events-none">
          <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}></i>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-[78px] left-0 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-150 dark:border-gray-700/60 z-50 overflow-hidden animate-slideUp">

          {/* Search box */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 relative">
            <input
              type="text"
              placeholder={`Search ${PROJECT_MODULE_NAME}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-gray-400"
            />
            <i className="fas fa-search absolute left-6 top-5 text-gray-400 text-xs"></i>
          </div>

          {/* List items */}
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin">
            {filteredProjects.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-xs italic">
                No projects matching search
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = selectedIds.includes(String(proj.id));
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectToggle(proj.id)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-55 dark:hover:bg-gray-700/50 cursor-pointer select-none transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <span className={`text-xs font-bold truncate block ${isSelected ? "text-green-500" : "text-gray-700 dark:text-gray-300"}`}>
                        {proj.name}
                      </span>
                      {proj.description && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate block mt-0.5 max-w-xs font-medium">
                          {proj.description}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 dark:border-gray-650"
                        }`}
                    >
                      {isSelected && <i className="fas fa-check text-[9px]"></i>}
                    </div>
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

export default ProjectMultiSelect;
