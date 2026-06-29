import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2, X, Search, AlertCircle, Check, XCircle } from "lucide-react";
import { showToast } from "../components/common/Toast";
import { 
  fetchChecklistCategories, 
  createChecklistCategory, 
  updateChecklistCategory, 
  deleteChecklistCategory,
  toggleChecklistCategoryStatus,
  clearError,
  clearCurrentCategory
} from "../store/slices/checklistCategorySlice";
import ConfirmModal from "../components/common/ConfirmModal";
import { Link } from "react-router-dom";

const ChecklistCategoriesManagement = () => {
  const dispatch = useDispatch();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const { categories, loading, error } = useSelector((state) => state.checklistCategory);

  useEffect(() => {
    dispatch(fetchChecklistCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setSelectedCategory(null);
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      showToast("Please enter category name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(createChecklistCategory(formData)).unwrap();
      showToast("Checklist category added successfully", "success");
      setShowAddModal(false);
      resetForm();
      dispatch(fetchChecklistCategories());
    } catch (err) {
      if (err?.errors?.name) {
        showToast(err.errors.name[0], "error");
      } else if (err?.message) {
        showToast(err.message, "error");
      } else {
        showToast("Failed to add category", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!formData.name.trim()) {
      showToast("Please enter category name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(updateChecklistCategory({ 
        id: selectedCategory.id, 
        categoryData: formData 
      })).unwrap();
      showToast("Checklist category updated successfully", "success");
      setShowEditModal(false);
      resetForm();
      dispatch(fetchChecklistCategories());
    } catch (err) {
      if (err?.errors?.name) {
        showToast(err.errors.name[0], "error");
      } else if (err?.message) {
        showToast(err.message, "error");
      } else {
        showToast("Failed to update category", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(deleteChecklistCategory(selectedCategory.id)).unwrap();
      showToast("Checklist category deleted successfully", "success");
      setShowDeleteConfirm(false);
      setSelectedCategory(null);
      dispatch(fetchChecklistCategories());
    } catch (err) {
      showToast(err?.message || "Failed to delete category", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (category) => {
    setIsSubmitting(true);
    try {
      await dispatch(toggleChecklistCategoryStatus({ 
        id: category.id, 
        is_active: !category.is_active 
      })).unwrap();
      showToast(`Category ${!category.is_active ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      showToast(err?.message || "Failed to update status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active === 1 || category.is_active === true,
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (category) => {
    setSelectedCategory(category);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link
          to="/admin/employees/offboarding"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Offboarding
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500">Checklist Categories</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Checklist Categories
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage offboarding checklist categories
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {categories.filter(c => c.is_active === 1 || c.is_active === true).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
          <p className="text-2xl font-bold text-red-600">
            {categories.filter(c => c.is_active === 0 || c.is_active === false).length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Sl.No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Category Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Created At</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category, idx) => (
                    <tr key={category.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{category.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.description || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(category)}
                          disabled={isSubmitting}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            category.is_active === 1 || category.is_active === true
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {(category.is_active === 1 || category.is_active === true) ? (
                            <Check size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {(category.is_active === 1 || category.is_active === true) ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {category.created_at ? new Date(category.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                            title="Edit category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(category)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery
                        ? "No categories found matching your search."
                        : "No categories found. Click 'Add Category' to create one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Add Category</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Visa Cancellation, Asset Return"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter category description..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              <button onClick={handleAddCategory} disabled={isSubmitting} className="px-4 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Edit Category</h2>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
              <button onClick={handleEditCategory} disabled={isSubmitting} className="px-4 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSelectedCategory(null); }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isSubmitting}
      />
    </div>
  );
};

export default ChecklistCategoriesManagement;