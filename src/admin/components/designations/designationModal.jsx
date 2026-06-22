import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../components/common/Toast";
import {
  addDesignation,
  fetchDesignations,
  updateDesignation,
} from "../../store/slices/designationSlice";

const DesignationModal = ({ isOpen, onClose, editingDesignation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    if (editingDesignation) {
      setFormData({
        name: editingDesignation.name || "",
      });
    } else {
      setFormData({
        name: "",
      });
    }
  }, [editingDesignation, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("Designation name is required", "error");
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
    };

    let result;

    if (editingDesignation) {
      result = await dispatch(
        updateDesignation({
          id: editingDesignation.id,
          data: payload,
        }),
      );

      if (updateDesignation.fulfilled.match(result)) {
        showToast(
          `Designation "${formData.name}" updated successfully`,
          "success",
        );
        dispatch(fetchDesignations());
        onClose();
        setFormData({
          name: "",
        });
      } else {
        const errorMessage = result.payload?.message || result.payload || "Failed to update designation";
        showToast(errorMessage, "error");
      }
    } else {
      result = await dispatch(addDesignation(payload));

      if (addDesignation.fulfilled.match(result)) {
        showToast(
          `Designation "${formData.name}" added successfully`,
          "success",
        );
        dispatch(fetchDesignations());
        onClose();
        setFormData({
          name: "",
        });
      } else {
        const errorMessage = result.payload?.message || result.payload || "Failed to add designation";
        showToast(errorMessage, "error");
      }
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <i
              className={`fas ${editingDesignation ? "fa-edit" : "fa-plus-circle"} text-green-500`}
            ></i>
            {editingDesignation ? "Edit Designation" : "Add Designation"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Designation Name Field */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <i className="fas fa-tag text-green-500 mr-1"></i>
              Designation Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter designation name (e.g., Manager, Driver)"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 transition-all focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              autoFocus
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center gap-2 text-sm disabled:opacity-70"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>{" "}
                  {editingDesignation ? "Update" : "Save"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DesignationModal;