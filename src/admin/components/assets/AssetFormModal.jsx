import { X, Plus } from "lucide-react";
import { useState } from "react";
import { ASSET_STATUS } from "../../pages/AssetManagement";
import DateInput from "../common/DateInput";
import AssetTypeAddModal from "./AssetTypeAddModal";
import { useDispatch } from "react-redux";
import { createAssetType, fetchAssetTypes } from "../../store/slices/assetSlice";
import { showToast } from "../common/Toast";

export const AssetFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, assetTypeOptions, isSubmitting, isEdit = false }) => {
  const dispatch = useDispatch();
  const [showAssetTypeModal, setShowAssetTypeModal] = useState(false);
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: "" });

  if (!isOpen) return null;

  const handleDateChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddAssetType = async () => {
    if (!newTypeData.name.trim()) {
      showToast("Please enter asset type name", "error");
      return;
    }

    setIsAddingType(true);
    try {
      const result = await dispatch(createAssetType({ name: newTypeData.name })).unwrap();
      console.log("Asset type created:", result);
      showToast("Asset type added successfully", "success");
      setShowAssetTypeModal(false);
      setNewTypeData({ name: "" });
      // Refresh asset types
      await dispatch(fetchAssetTypes());
      // Auto-select the newly created type
      if (result && result.id) {
        setFormData({ ...formData, asset_type_id: result.id });
      }
    } catch (err) {
      console.error("Create asset type error:", err);
      if (err?.errors?.name) {
        showToast(err.errors.name[0], "error");
      } else if (err?.message) {
        showToast(err.message, "error");
      } else {
        showToast("Failed to add asset type", "error");
      }
    } finally {
      setIsAddingType(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl my-8 shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Asset" : "Add New Asset"}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  placeholder="e.g., Dell XPS 15"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Asset Type <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTypeData({ name: "" });
                      setShowAssetTypeModal(true);
                    }}
                    className="text-green-500 hover:text-green-600 transition-colors"
                    title="Add new asset type"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <select
                  value={formData.asset_type_id}
                  onChange={(e) => setFormData({ ...formData, asset_type_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Select type</option>
                  {assetTypeOptions.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Brand</label>
                <input 
                  type="text" 
                  value={formData.brand} 
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                  placeholder="e.g., Dell, Apple, HP" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Model</label>
                <input 
                  type="text" 
                  value={formData.model} 
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                  placeholder="e.g., XPS 15 9520" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Serial Number</label>
                <input 
                  type="text" 
                  value={formData.serial_number} 
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} 
                  placeholder="Enter serial number" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Purchase Price</label>
                <input 
                  type="number" 
                  value={formData.purchase_price} 
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} 
                  placeholder="0.00" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Purchase Date</label>
                <DateInput
                  value={formData.purchase_date}
                  onChange={(value) => handleDateChange("purchase_date", value)}
                  placeholder="Select purchase date"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Warranty Expiry</label>
                <DateInput
                  value={formData.warranty_expiry}
                  onChange={(value) => handleDateChange("warranty_expiry", value)}
                  placeholder="Select warranty expiry date"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  {ASSET_STATUS.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows={3} 
                  placeholder="Additional details about the asset..." 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
            <button onClick={onSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isEdit ? "Save Changes" : "Add Asset")}
            </button>
          </div>
        </div>
      </div>

      {/* Asset Type Add Modal */}
      <AssetTypeAddModal
        isOpen={showAssetTypeModal}
        onClose={() => {
          setShowAssetTypeModal(false);
          setNewTypeData({ name: "" });
        }}
        onSubmit={handleAddAssetType}
        formData={newTypeData}
        setFormData={setNewTypeData}
        isSubmitting={isAddingType}
      />
    </>
  );
};