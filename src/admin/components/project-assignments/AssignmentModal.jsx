import React, { useState, useEffect, useRef, useMemo } from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";
import { getPhotoUrl, getFallbackAvatar } from "../../../utils/imageHelper";


/* ─── helpers ──────────────────────────────────────────────────── */
const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "E");

const mapEmployee = (emp) => {
  let name = emp.name;
  if (!name) name = [emp.first_name, emp.last_name].filter(Boolean).join(" ");
  if (!name) name = emp.user?.username || `Employee #${emp.id}`;
  return {
    id: Number(emp.id),
    name,
    department: emp.department || emp.user?.department?.name || "",
    designation: emp.designation || emp.user?.designation?.name || "",
    avatar: getPhotoUrl(emp.avatar) || null,
  };
};

/* ─── ProjectDropdown ───────────────────────────────────────────── */
const ProjectDropdown = ({ projects, selectedIds, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    let timeoutId;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        // Delay closing slightly so that click events on the main form buttons
        // (Save Changes, Cancel, Reset) have time to register before the dropdown collapses.
        timeoutId = setTimeout(() => {
          setOpen(false);
        }, 150);
      }
    };
    // Use pointerdown so we catch touch + mouse reliably
    document.addEventListener("pointerdown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const sel = useMemo(() => (selectedIds || []).map(String), [selectedIds]);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(search.toLowerCase())
      ),
    [projects, search]
  );

  const selected = useMemo(
    () => projects.filter((p) => sel.includes(String(p.id))),
    [projects, sel]
  );

  const toggle = (e, id) => {
    // Prevent bubbling so the outside-click handler never fires
    e.stopPropagation();
    const s = String(id);
    onChange(sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s]);
  };

  const removeTag = (e, id) => {
    e.stopPropagation();
    onChange(sel.filter((x) => x !== String(id)));
  };

  return (
    <div className="relative" ref={ref}>
      {/* label */}
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
        Assign {PROJECT_MODULE_NAME}s <span className="text-red-500">*</span>
      </label>

      {/* trigger box */}
      <div
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`relative min-h-[46px] w-full px-3.5 py-2.5 pr-10 rounded-xl border bg-white dark:bg-gray-800 flex flex-wrap items-center gap-1.5 transition-all select-none
          ${disabled ? "opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700" : "cursor-pointer border-gray-200 dark:border-gray-655 hover:border-green-400 dark:hover:border-green-500"}
          ${open ? "border-green-500 ring-2 ring-green-500/20" : ""}
        `}
      >
        {selected.length === 0 ? (
          <span className="text-sm text-gray-400 font-medium">
            Choose {PROJECT_MODULE_NAME}s…
          </span>
        ) : (
          selected.map((proj) => (
            <span
              key={proj.id}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-500/10 rounded-lg border border-green-500/20 max-w-[160px]"
            >
              <span className="truncate" title={proj.name}>
                {proj.name}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeTag(e, proj.id)}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-green-500/30 text-green-600 dark:text-green-400 flex-shrink-0 transition-colors"
                >
                  <i className="fas fa-times text-[9px]" />
                </button>
              )}
            </span>
          ))
        )}

        {/* chevron */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </div>

      {/* count badge */}
      {selected.length > 0 && (
        <span className="absolute -top-1 right-8 inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full shadow">
          {selected.length}
        </span>
      )}

      {/* dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden animate-slideUp">
          {/* search — no autoFocus: it triggers the outside-click handler on mount */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 relative">
            <i className="fas fa-search absolute left-6 top-[22px] text-gray-400 text-xs pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${PROJECT_MODULE_NAME}s…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-655 bg-gray-50 dark:bg-gray-750 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* list */}
          <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-xs italic">
                No matching {PROJECT_MODULE_NAME}s
              </div>
            ) : (
              filtered.map((proj) => {
                const checked = sel.includes(String(proj.id));
                return (
                  // Use div NOT label — label element fires onClick twice (label + implicit input click)
                  <div
                    key={proj.id}
                    onPointerDown={(e) => toggle(e, proj.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none ${
                      checked
                        ? "bg-green-500/5 dark:bg-green-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    }`}
                  >
                    {/* custom checkbox */}
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all pointer-events-none ${
                        checked
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {checked && <i className="fas fa-check text-white text-[8px]" />}
                    </div>

                    <div className="min-w-0 flex-1 pointer-events-none">
                      <p className={`text-xs font-semibold truncate ${checked ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-200"}`}>
                        {proj.name}
                      </p>
                      {proj.description && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* footer */}
          <div className="px-4 py-2 bg-gray-50/60 dark:bg-gray-750/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-400">
              {sel.length} selected
            </span>
            <div className="flex items-center gap-2">
              {sel.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="text-[10px] font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── EmployeeDropdown ───────────────────────────────────────────── */
const EmployeeDropdown = ({ employees, selectedId, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    let timeoutId;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        timeoutId = setTimeout(() => {
          setOpen(false);
        }, 150);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const filtered = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          (e.designation || "").toLowerCase().includes(search.toLowerCase()) ||
          (e.department || "").toLowerCase().includes(search.toLowerCase())
      ),
    [employees, search]
  );

  const selected = useMemo(
    () => employees.find((e) => String(e.id) === String(selectedId)),
    [employees, selectedId]
  );

  const selectEmployee = (e, id) => {
    e.stopPropagation();
    onChange(String(id));
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`relative min-h-[46px] w-full px-4 py-2.5 pr-10 rounded-xl border bg-white dark:bg-gray-800 flex items-center gap-3 transition-all select-none
          ${disabled ? "opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700" : "cursor-pointer border-gray-200 dark:border-gray-655 hover:border-green-400 dark:hover:border-green-500"}
          ${open ? "border-green-500 ring-2 ring-green-500/20" : ""}
        `}
      >
        {selected ? (
          <div className="flex items-center gap-2.5 truncate">
            {selected.avatar ? (
              <img
                src={selected.avatar}
                alt={selected.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getFallbackAvatar(selected.name);
                }}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400/30 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                  {getInitials(selected.name)}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {selected.name}
              {selected.designation && <span className="text-gray-400 ml-1 text-xs font-normal">({selected.designation})</span>}
            </span>
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            — Choose an employee —
          </span>
        )}

        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden animate-slideUp">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 relative">
            <i className="fas fa-search absolute left-6 top-[22px] text-gray-400 text-xs pointer-events-none" />
            <input
              type="text"
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-655 bg-gray-50 dark:bg-gray-750 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-xs italic">
                No matching employees
              </div>
            ) : (
              filtered.map((emp) => {
                const isSelected = String(emp.id) === String(selectedId);
                return (
                  <div
                    key={emp.id}
                    onPointerDown={(e) => selectEmployee(e, emp.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-green-500/5 dark:bg-green-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400/30 to-teal-500/20 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    <div className="min-w-0 flex-1 pointer-events-none">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-200"}`}>
                        {emp.name}
                      </p>
                      {emp.designation && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                          {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <i className="fas fa-check text-green-500 text-xs flex-shrink-0" />
                    )}
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

/* ─── Main Modal ────────────────────────────────────────────────── */
const AssignmentModal = ({
  isOpen,
  onClose,
  employees,
  projects,
  existingAssignments,
  selectedAssignment,
  onSave,
  actionLoading,
}) => {
  const [employeeId, setEmployeeId] = useState("");
  const [projectIds, setProjectIds] = useState([]);
  const [error, setError] = useState("");

  const isEditMode = !!selectedAssignment;

  const mappedEmployees = useMemo(() => employees.map(mapEmployee), [employees]);

  const selectedEmp = useMemo(
    () => mappedEmployees.find((e) => e.id === Number(employeeId)),
    [mappedEmployees, employeeId]
  );

  // Sync with selection
  useEffect(() => {
    if (selectedAssignment) {
      setEmployeeId(selectedAssignment.employeeId || "");
      setProjectIds(selectedAssignment.projectIds || []);
    } else {
      setEmployeeId("");
      setProjectIds([]);
    }
    setError("");
  }, [selectedAssignment, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (!projectIds || projectIds.length === 0) {
      setError(`Please assign at least one ${PROJECT_MODULE_NAME}.`);
      return;
    }

    const empId = Number(employeeId);

    if (!isEditMode) {
      const isDupe = existingAssignments.some(
        (a) => Number(a.employeeId) === empId
      );
      if (isDupe) {
        setError(
          "This employee already has an assignment. Edit the existing one instead."
        );
        return;
      }
    }

    onSave({ employeeId: empId, projectIds });
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[1100] animate-fadeIn"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-lg pointer-events-auto bg-white dark:bg-gray-800 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-gray-700 animate-slideUp">

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <i className={`fas ${isEditMode ? "fa-pencil-alt" : "fa-user-plus"} text-sm`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {isEditMode ? "Edit Assignment" : "Assign Projects"}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                  {isEditMode ? "Modify resource allocations" : `Map ${PROJECT_MODULE_NAME}s to employee`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                  <i className="fas fa-triangle-exclamation mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Field 1: Employee Select ── */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Select Employee <span className="text-red-500">*</span>
                </label>

                {isEditMode && selectedEmp ? (
                  /* locked display in edit mode */
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 opacity-80">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400/30 to-teal-500/20 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      {selectedEmp.avatar ? (
                        <img
                          src={selectedEmp.avatar}
                          alt={selectedEmp.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getFallbackAvatar(selectedEmp.name);
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                          {getInitials(selectedEmp.name)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{selectedEmp.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                        {selectedEmp.designation}{selectedEmp.department ? ` · ${selectedEmp.department}` : ""}
                      </p>
                    </div>
                    <i className="fas fa-lock text-gray-300 dark:text-gray-600 text-xs ml-auto flex-shrink-0" />
                  </div>
                ) : (
                  <EmployeeDropdown
                    employees={mappedEmployees}
                    selectedId={employeeId}
                    onChange={setEmployeeId}
                    disabled={actionLoading}
                  />
                )}
              </div>

              {/* ── Field 2: Project Multi-Select Dropdown ── */}
              <ProjectDropdown
                projects={projects}
                selectedIds={projectIds}
                onChange={setProjectIds}
                disabled={actionLoading}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-gray-50/60 dark:bg-gray-750/30 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-650 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-650 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                <i className="fas fa-rotate-left mr-1.5" />
                Reset
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-70 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none transition-all"
              >
                {actionLoading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="fas fa-check" />
                    {isEditMode ? "Save Changes" : "Save Assignment"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AssignmentModal;
