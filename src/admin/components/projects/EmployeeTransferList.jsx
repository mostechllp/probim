import React, { useState, useMemo } from "react";
import { getPhotoUrl, getFallbackAvatar } from "../../../utils/imageHelper";


const EmployeeTransferList = ({
  employees, // Array of ALL employees fetched from the store
  initiallyTaggedIds, // Array of employee IDs that are currently tagged to the project
  onSave, // Triggered when changes are saved
  onCancel, // Triggered when cancelled
  actionLoading
}) => {
  // We keep track of the tagged employee IDs in a local state
  const [taggedIds, setTaggedIds] = useState(() => {
    return (initiallyTaggedIds || []).map(Number);
  });

  // Track selection states in both lists (checkboxes/multi-select)
  const [selectedAvailableIds, setSelectedAvailableIds] = useState([]);
  const [selectedTaggedIds, setSelectedTaggedIds] = useState([]);

  // Search filter terms for left and right columns
  const [availableSearch, setAvailableSearch] = useState("");
  const [taggedSearch, setTaggedSearch] = useState("");

  // Map employee list to standard format to avoid raw mismatch
  const mappedEmployees = useMemo(() => {
    return employees.map((emp) => {
      // Find employee name
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

  // Available employees (not in taggedIds)
  const availableEmployees = useMemo(() => {
    return mappedEmployees.filter((emp) => !taggedIds.includes(emp.id));
  }, [mappedEmployees, taggedIds]);

  // Tagged employees (in taggedIds)
  const taggedEmployees = useMemo(() => {
    return mappedEmployees.filter((emp) => taggedIds.includes(emp.id));
  }, [mappedEmployees, taggedIds]);

  // Filtered available employees based on search
  const filteredAvailable = useMemo(() => {
    return availableEmployees.filter((emp) => {
      const matchName = emp.name.toLowerCase().includes(availableSearch.toLowerCase());
      const matchDept = emp.department.toLowerCase().includes(availableSearch.toLowerCase());
      const matchRole = emp.designation.toLowerCase().includes(availableSearch.toLowerCase());
      return matchName || matchDept || matchRole;
    });
  }, [availableEmployees, availableSearch]);

  // Filtered tagged employees based on search
  const filteredTagged = useMemo(() => {
    return taggedEmployees.filter((emp) => {
      const matchName = emp.name.toLowerCase().includes(taggedSearch.toLowerCase());
      const matchDept = emp.department.toLowerCase().includes(taggedSearch.toLowerCase());
      const matchRole = emp.designation.toLowerCase().includes(taggedSearch.toLowerCase());
      return matchName || matchDept || matchRole;
    });
  }, [taggedEmployees, taggedSearch]);

  // Selection toggle handlers
  const handleToggleAvailable = (id) => {
    setSelectedAvailableIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleTagged = (id) => {
    setSelectedTaggedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Move selected available employees to tagged list (Right Arrow)
  const handleMoveRight = () => {
    if (selectedAvailableIds.length === 0) return;
    
    setTaggedIds((prev) => [...prev, ...selectedAvailableIds]);
    setSelectedAvailableIds([]);
  };

  // Move selected tagged employees back to available list (Left Arrow)
  const handleMoveLeft = () => {
    if (selectedTaggedIds.length === 0) return;

    setTaggedIds((prev) => prev.filter((id) => !selectedTaggedIds.includes(id)));
    setSelectedTaggedIds([]);
  };

  // Move ALL available employees to tagged list (Double Right)
  const handleMoveAllRight = () => {
    const allAvailableIds = filteredAvailable.map((emp) => emp.id);
    if (allAvailableIds.length === 0) return;
    setTaggedIds((prev) => [...new Set([...prev, ...allAvailableIds])]);
    setSelectedAvailableIds([]);
  };

  // Remove ALL tagged employees (Double Left)
  const handleMoveAllLeft = () => {
    const allTaggedIds = filteredTagged.map((emp) => emp.id);
    if (allTaggedIds.length === 0) return;
    setTaggedIds((prev) => prev.filter((id) => !allTaggedIds.includes(id)));
    setSelectedTaggedIds([]);
  };

  // Quick single-click assign/remove triggers
  const handleQuickAssign = (id) => {
    setTaggedIds((prev) => [...prev, id]);
    setSelectedAvailableIds((prev) => prev.filter((item) => item !== id));
  };

  const handleQuickRemove = (id) => {
    setTaggedIds((prev) => prev.filter((item) => item !== id));
    setSelectedTaggedIds((prev) => prev.filter((item) => item !== id));
  };

  // Avatar helper for missing images
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "E";
  };

  return (
    <div className="space-y-6">
      {/* 3-Column Transfer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
        
        {/* LEFT COLUMN: Available Employees */}
        <div className="lg:col-span-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Available Employees ({filteredAvailable.length})
            </span>
            {selectedAvailableIds.length > 0 && (
              <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-bold px-2 py-0.5 rounded-full">
                {selectedAvailableIds.length} selected
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-3 flex-shrink-0">
            <input
              type="text"
              placeholder="Search name, role, department..."
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-850 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-gray-400"
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-[10px]"></i>
            {availableSearch && (
              <button
                onClick={() => setAvailableSearch("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-red-500"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredAvailable.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <i className="fas fa-users-slash text-gray-300 dark:text-gray-600 text-2xl mb-2"></i>
                <p className="text-xs text-gray-400">No available employees found</p>
              </div>
            ) : (
              filteredAvailable.map((emp) => {
                const isSelected = selectedAvailableIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleAvailable(emp.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-green-500/10 border-green-400/50 dark:border-green-500/30"
                        : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <i className="fas fa-check text-[9px]"></i>}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-500/10 dark:to-teal-500/10 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
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

                    {/* Meta details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-250 truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-semibold">
                        {emp.designation} &bull; {emp.department}
                      </p>
                    </div>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssign(emp.id);
                      }}
                      title="Quick Tag"
                      className="opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-green-500 hover:text-white text-green-500 flex items-center justify-center transition-all bg-green-500/10"
                    >
                      <i className="fas fa-plus text-[10px]"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Action Controls */}
        <div className="lg:col-span-1 flex lg:flex-col justify-center items-center gap-2 p-2 flex-shrink-0">
          {/* Quick Tag Select */}
          <button
            type="button"
            onClick={handleMoveRight}
            disabled={selectedAvailableIds.length === 0}
            title="Move Selected Right"
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-55 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-300 dark:disabled:hover:border-gray-700 transition-all shadow-sm hover:shadow-soft"
          >
            <i className="fas fa-chevron-right lg:rotate-0 rotate-90 text-sm"></i>
          </button>

          {/* Quick Remove Selected */}
          <button
            type="button"
            onClick={handleMoveLeft}
            disabled={selectedTaggedIds.length === 0}
            title="Move Selected Left"
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-55 disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 dark:disabled:hover:bg-gray-800 dark:disabled:hover:text-gray-300 dark:disabled:hover:border-gray-700 transition-all shadow-sm hover:shadow-soft"
          >
            <i className="fas fa-chevron-left lg:rotate-0 rotate-90 text-sm"></i>
          </button>

          {/* Tag All (Double Right) */}
          <button
            type="button"
            onClick={handleMoveAllRight}
            disabled={filteredAvailable.length === 0}
            title="Tag All Employees"
            className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center border border-gray-150 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20 disabled:opacity-50 disabled:hover:bg-gray-55 transition-all text-xs font-bold"
          >
            <i className="fas fa-angles-right"></i>
          </button>

          {/* Untag All (Double Left) */}
          <button
            type="button"
            onClick={handleMoveAllLeft}
            disabled={filteredTagged.length === 0}
            title="Untag All Employees"
            className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center border border-gray-150 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 disabled:opacity-50 disabled:hover:bg-gray-55 transition-all text-xs font-bold"
          >
            <i className="fas fa-angles-left"></i>
          </button>
        </div>

        {/* RIGHT COLUMN: Tagged Employees */}
        <div className="lg:col-span-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tagged Employees ({filteredTagged.length})
            </span>
            {selectedTaggedIds.length > 0 && (
              <span className="text-[10px] bg-red-500/10 text-red-500 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                {selectedTaggedIds.length} selected
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-3 flex-shrink-0">
            <input
              type="text"
              placeholder="Search tagged employees..."
              value={taggedSearch}
              onChange={(e) => setTaggedSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-850 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-gray-400"
            />
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-[10px]"></i>
            {taggedSearch && (
              <button
                onClick={() => setTaggedSearch("")}
                className="absolute right-3 top-2 text-gray-400 hover:text-red-500"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredTagged.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <i className="fas fa-user-plus text-gray-300 dark:text-gray-600 text-2xl mb-2"></i>
                <p className="text-xs text-gray-400">No employees assigned to project yet</p>
                <span className="text-[10px] text-gray-400/80 mt-1 max-w-[200px]">
                  Select employees from the left column and click the right arrow to tag them.
                </span>
              </div>
            ) : (
              filteredTagged.map((emp) => {
                const isSelected = selectedTaggedIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleTagged(emp.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all group ${
                      isSelected
                        ? "bg-red-500/5 border-red-400/30 dark:border-red-500/20"
                        : "bg-white dark:bg-gray-800 border-gray-150 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <i className="fas fa-check text-[9px]"></i>}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/20 to-blue-500/20 dark:from-indigo-500/10 dark:to-blue-500/10 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
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
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {getInitials(emp.name)}
                        </span>
                      )}
                    </div>

                    {/* Meta details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-250 truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-semibold">
                        {emp.designation} &bull; {emp.department}
                      </p>
                    </div>

                    {/* Quick Remove Button (hover action) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickRemove(emp.id);
                      }}
                      title="Remove employee"
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all bg-red-500/10"
                    >
                      <i className="fas fa-minus text-[10px]"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Save / Cancel controls */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={actionLoading}
          className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold transition-all disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => onSave(taggedIds)}
          disabled={actionLoading}
          className="px-6 py-2.5 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/70 text-white text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 disabled:transform-none transition-all"
        >
          {actionLoading ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-user-check"></i>
              Save Assignments
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EmployeeTransferList;
