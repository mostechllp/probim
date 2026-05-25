import React from "react";

const EmptyState = ({ message, description, onAction, actionText }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-soft">
      <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
        <i className="fas fa-folder-open text-green-500 text-2xl animate-pulse"></i>
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
        {message || "No Data Found"}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description || "There are no records to display at this moment. You can start by adding a new one."}
      </p>
      {onAction && actionText && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold flex items-center gap-2 shadow-soft hover:shadow-soft-lg transform hover:-translate-y-0.5 transition-all"
        >
          <i className="fas fa-plus"></i>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
