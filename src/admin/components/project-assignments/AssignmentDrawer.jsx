import React from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";

const AssignmentDrawer = ({
  isOpen,
  onClose,
  children,
  isEditMode
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[1100] transition-opacity duration-300 animate-fadeIn"
      />

      {/* Slide Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white dark:bg-gray-800 border-l border-gray-150 dark:border-gray-700/60 z-[1200] shadow-soft-lg transform transition-transform duration-300 ease-out flex flex-col animate-slideLeft`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/20 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                <i className={isEditMode ? "fas fa-pencil-alt text-xs" : "fas fa-user-plus text-xs"}></i>
              </div>
              {isEditMode ? "Edit Project Assignment" : "Assign Projects"}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold leading-none mt-1.5 uppercase tracking-wider">
              {isEditMode ? "Modify resource allocations" : `Map multiple ${PROJECT_MODULE_NAME}s to employee`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>
      </div>
    </>
  );
};

export default AssignmentDrawer;
