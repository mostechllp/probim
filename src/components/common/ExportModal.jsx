import { useState } from "react";
import { showToast } from "./Toast";

const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  title = "Export Report",
  totalRecords = 0,
  formats = ["csv", "pdf", "xlsx"],
  defaultFormat = "csv",
  additionalOptions = null,
  subtitle,
  isLoading = false,
}) => {
  const [exportFormat, setExportFormat] = useState(defaultFormat);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (totalRecords === 0) {
      showToast("No data to export", "warning");
      return;
    }

    setExporting(true);
    try {
      await onExport(exportFormat);
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      showToast(`Failed to export as ${exportFormat.toUpperCase()}`, "error");
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const isExporting = isLoading || exporting;

  // Check if format is available (not disabled)
  const isFormatAvailable = (format) => {
    return formats.includes(format);
  };

  // Get format icon
  const getFormatIcon = (format) => {
    switch(format) {
      case 'csv': return 'fa-file-csv';
      case 'pdf': return 'fa-file-pdf';
      case 'xlsx': return 'fa-file-excel';
      default: return 'fa-file';
    }
  };

  // Get format color
  const getFormatColor = (format) => {
    switch(format) {
      case 'csv': return 'text-green-500';
      case 'pdf': return 'text-red-500';
      case 'xlsx': return 'text-emerald-600';
      default: return 'text-gray-400';
    }
  };

  // Get format label
  const getFormatLabel = (format) => {
    switch(format) {
      case 'csv': return 'CSV';
      case 'pdf': return 'PDF';
      case 'xlsx': return 'Excel';
      default: return format.toUpperCase();
    }
  };

  // Format display name for button
  const formatDisplayName = (format) => {
    switch(format) {
      case 'xlsx': return 'Excel';
      default: return format.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-soft-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-export text-green-600 dark:text-green-400 text-lg"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-13">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors text-2xl leading-none flex-shrink-0 ml-2"
            disabled={isExporting}
          >
            &times;
          </button>
        </div>

        {/* Stats Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-6 border border-green-100 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                Total Records
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {totalRecords}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <i className="fas fa-database text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <i className="fas fa-file-export text-green-500 mr-1"></i> Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map((format) => {
              const isActive = exportFormat === format;
              const isDisabled = isExporting;
              const icon = getFormatIcon(format);
              const color = getFormatColor(format);
              const label = formatDisplayName(format);
              
              return (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  disabled={isDisabled}
                  className={`px-3 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                    isActive
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <i className={`fas ${icon} ${isActive ? color : "text-gray-400 dark:text-gray-500"}`}></i>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {additionalOptions && additionalOptions}

        {/* Info Box */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-start gap-2">
            <i className="fas fa-info-circle text-green-500 text-sm mt-0.5"></i>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Export will include all <strong className="text-gray-700 dark:text-gray-300">{totalRecords}</strong> records 
              with current filters applied. The file will be downloaded automatically.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Exporting...
              </>
            ) : (
              <>
                <i className="fas fa-download"></i> Export Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;