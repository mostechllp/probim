import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchModules,
  addModule,
  updateModule,
  deleteModule,
} from "../store/slices/moduleSlice";
import { showToast } from "../components/common/Toast";
import { Link } from "react-router-dom";
import ConfirmModal from "../components/common/ConfirmModal";

function ModuleManagement() {
  const dispatch = useDispatch();
  const { modules, loading } = useSelector((state) => state.modules);

  const [moduleName, setModuleName] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  
  // Confirm Modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedModuleName, setSelectedModuleName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchModules());
  }, [dispatch]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!moduleName.trim()) {
      showToast("Module name is required", "error");
      return;
    }

    const slug = generateSlug(moduleName);

    try {
      if (editingModuleId) {
        await dispatch(
          updateModule({
            id: editingModuleId,
            data: { name: moduleName, slug },
          }),
        ).unwrap();
        showToast("Module updated successfully", "success");
        setEditingModuleId(null);
      } else {
        await dispatch(addModule({ name: moduleName, slug })).unwrap();
        showToast("Module added successfully", "success");
      }
      setModuleName("");
    } catch (error) {
      showToast(error || "An error occurred", "error");
    }
  };

  const handleEdit = (module) => {
    setEditingModuleId(module.id);
    setModuleName(module.name || module.label || "");
  };

  const handleDeleteClick = (module) => {
    setSelectedModuleId(module.id);
    setSelectedModuleName(module.name || module.label || "");
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedModuleId) return;
    
    setDeleteLoading(true);
    try {
      await dispatch(deleteModule(selectedModuleId)).unwrap();
      showToast(`Module "${selectedModuleName}" deleted successfully`, "success");
      setConfirmOpen(false);
      setSelectedModuleId(null);
      setSelectedModuleName("");
    } catch (error) {
      showToast(error || "Failed to delete module", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingModuleId(null);
    setModuleName("");
  };

  return (
    <div className="w-full overflow-x-hidden p-4 md:p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
          <Link
            to="/admin/roles"
            className="text-green-500 hover:text-green-600 font-medium"
          >
            Roles
          </Link>
          <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
          <span className="text-gray-500">Add Module</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
        {/* Add/Edit Module Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <i className="fas fa-layer-group text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-100">
                {editingModuleId ? "Edit Module" : "Add Module"}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {editingModuleId
                  ? "Update module details"
                  : "Add a new module to the system"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Module Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g. Payroll"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <i className="fas fa-check mr-2"></i>
                {editingModuleId ? "Update Module" : "Add Module"}
              </button>
              {editingModuleId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Modules List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft p-4 md:p-6">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            Modules List
          </h3>
          {loading && !modules.length ? (
            <div className="text-center py-4 text-sm text-gray-500">
              Loading modules...
            </div>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {modules.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-600 group"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {m.name || m.label}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      title="Edit module"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(m)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete module"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </li>
              ))}
              {modules.length === 0 && !loading && (
                <li className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                  No modules found.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedModuleId(null);
          setSelectedModuleName("");
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Module"
        message={`Are you sure you want to delete the module "${selectedModuleName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        type="delete"
      />
    </div>
  );
}

export default ModuleManagement;