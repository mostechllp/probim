import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { showToast } from "../components/common/Toast";
import {
  fetchAssetTypes,
  createAssetType,
  updateAssetType,
  deleteAssetType,
  clearError,
} from "../store/slices/assetSlice";
import ConfirmModal from "../components/common/ConfirmModal";
import { Link } from "react-router-dom";
import AssetTypeAddModal from "../components/assets/AssetTypeAddModal";
import AssetTypeEditModal from "../components/assets/AssetTypeEditModal";

const AssetTypesManagement = () => {
  const dispatch = useDispatch();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  const { assetTypes, loading, error } = useSelector((state) => state.assets);

  useEffect(() => {
    dispatch(fetchAssetTypes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filteredTypes = assetTypes.filter((type) =>
    type.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const resetForm = () => {
    setFormData({ name: "" });
    setSelectedType(null);
  };

  const handleAddType = async () => {
    if (!formData.name.trim()) {
      showToast("Please enter type name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(createAssetType({ name: formData.name })).unwrap();
      showToast("Asset type added successfully", "success");
      setShowAddModal(false);
      resetForm();
      dispatch(fetchAssetTypes());
    } catch (err) {
      if (err?.errors?.name) {
        showToast(err.errors.name[0], "error");
      } else if (err?.message) {
        showToast(err.message, "error");
      } else {
        showToast("Failed to add asset type", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditType = async () => {
    if (!formData.name.trim()) {
      showToast("Please enter type name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        updateAssetType({
          id: selectedType.id,
          typeData: { name: formData.name },
        }),
      ).unwrap();
      showToast("Asset type updated successfully", "success");
      setShowEditModal(false);
      resetForm();
      dispatch(fetchAssetTypes());
    } catch (err) {
      if (err?.errors?.name) {
        showToast(err.errors.name[0], "error");
      } else if (err?.message) {
        showToast(err.message, "error");
      } else {
        showToast("Failed to update asset type", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteType = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(deleteAssetType(selectedType.id)).unwrap();
      showToast("Asset type deleted successfully", "success");
      setShowDeleteConfirm(false);
      setSelectedType(null);
      dispatch(fetchAssetTypes());
    } catch (err) {
      showToast(err?.message || "Failed to delete asset type", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (type) => {
    setSelectedType(type);
    setFormData({ name: type.name });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (type) => {
    setSelectedType(type);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link
          to="/admin/employees/asset-management"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Assets
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500">Asset Types</span>
      </div>
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Asset Types
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage asset types
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
          Add New Type
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Types
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {assetTypes.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last Updated
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {assetTypes.length > 0 && assetTypes[0]?.updated_at
              ? new Date(assetTypes[0].updated_at).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search asset types..."
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
            <p className="text-gray-500 dark:text-gray-400">
              Loading asset types...
            </p>
          </div>
        </div>
      ) : (
        /* Types Table */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
          <div className="min-w-[500px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Sl.No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Type Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.length > 0 ? (
                  filteredTypes.map((type, idx) => (
                    <tr
                      key={type.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {idx + 1}
                       </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {type.name}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {type.created_at
                          ? new Date(type.created_at).toLocaleDateString()
                          : "-"}
                       </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(type)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                            title="Edit type"
                          >
                            <i className="fas fa-edit text-xs md:text-sm"></i>
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(type)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                            title="Delete type"
                          >
                            <i className="fas fa-trash text-xs md:text-sm"></i>
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {searchQuery
                        ? "No asset types found matching your search."
                        : "No asset types found. Click 'Add New Type' to create one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AssetTypeAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onSubmit={handleAddType}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      <AssetTypeEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        onSubmit={handleEditType}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedType(null);
        }}
        onConfirm={handleDeleteType}
        title="Delete Asset Type"
        message={`Are you sure you want to delete "${selectedType?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isSubmitting}
      />
    </div>
  );
};

export default AssetTypesManagement;