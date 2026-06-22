const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "Cancel",
  loading = false,
  type = "default", // "default", "approve", "delete"
}) => {
  if (!isOpen) return null;

  // Determine button styling based on type
  const getConfirmButtonStyle = () => {
    switch (type) {
      case "approve":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "delete":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "bg-green-500 hover:bg-green-600 text-white";
    }
  };

  const getConfirmIcon = () => {
    switch (type) {
      case "approve":
        return <i className="fas fa-check-circle"></i>;
      case "delete":
        return <i className="fas fa-trash"></i>;
      default:
        return <i className="fas fa-check"></i>;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "approve":
        return "text-green-500";
      case "delete":
        return "text-red-500";
      default:
        return "text-green-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700">

        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <i className={`fas fa-exclamation-triangle ${getIconColor()}`}></i>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${getConfirmButtonStyle()}`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Processing...
              </>
            ) : (
              <>
                {getConfirmIcon()} {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;