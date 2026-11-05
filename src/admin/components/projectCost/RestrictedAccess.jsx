// src/admin/components/common/RestrictedAccess.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const RestrictedAccess = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center animate-fadeIn">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <i className="fas fa-lock text-red-500 dark:text-red-400 text-3xl"></i>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        Access Restricted
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8">
        You do not have permission to view this module. Project financial data
        is restricted to Super Admins and Management only.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
      >
        <i className="fas fa-arrow-left"></i>
        Go Back
      </button>
    </div>
  );
};

export default RestrictedAccess;