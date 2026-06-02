import React, { useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiX, FiRefreshCw, FiLogOut, FiPhone, FiClock } from 'react-icons/fi';

const ErrorToast = ({ error, onClose, onAction, duration = 8000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'login':
        return <FiLogOut className="mr-1" />;
      case 'retry':
        return <FiRefreshCw className="mr-1" />;
      case 'contact':
        return <FiPhone className="mr-1" />;
      case 'punch_out':
        return <FiClock className="mr-1" />;
      default:
        return <FiRefreshCw className="mr-1" />;
    }
  };

  const getActionButton = () => {
    if (!error.action) return null;
    
    return (
      <button
        onClick={() => onAction?.(error.actionType)}
        className="mt-2 px-3 py-1 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
      >
        {getActionIcon(error.actionType)}
        {error.action}
      </button>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md">
      <div className={`bg-[var(--surface)] rounded-xl shadow-2xl border-l-4 overflow-hidden ${
        error.type === 'success' ? 'border-green-500' : 'border-red-500'
      }`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {error.type === 'success' ? (
                <FiCheckCircle className="text-green-500 text-xl" />
              ) : (
                <FiAlertCircle className="text-red-500 text-xl" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-bold text-[var(--text)]">
                  {error.title || (error.type === 'success' ? 'Success' : 'Error')}
                </h4>
                <button
                  onClick={onClose}
                  className="ml-3 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {error.message}
              </p>
              {getActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorToast;