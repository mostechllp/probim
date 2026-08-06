// components/common/ErrorToast.jsx
import React, { useEffect, useState } from 'react';
import { 
  FiAlertCircle, 
  FiCheckCircle, 
  FiX, 
  FiRefreshCw, 
  FiLogOut, 
  FiPhone, 
  FiClock,
  FiInfo,
  FiAlertTriangle
} from 'react-icons/fi';

const ErrorToast = ({ error, onClose, onAction, duration = 10000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Different durations for different error types
      let toastDuration = duration;
      if (error.type === 'warning' || error.type === 'info') {
        toastDuration = 12000; // Longer for warnings/info
      } else if (error.type === 'error') {
        toastDuration = 8000;
      } else if (error.type === 'success') {
        toastDuration = 4000;
      }
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, toastDuration);
      return () => clearTimeout(timer);
    }
  }, [error, onClose, duration]);

  if (!error || !isVisible) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'success':
        return FiCheckCircle;
      case 'warning':
        return FiAlertTriangle;
      case 'info':
        return FiInfo;
      case 'error':
      default:
        return FiAlertCircle;
    }
  };

  const getIconColor = () => {
    switch (error.type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-amber-500';
      case 'info':
        return 'text-blue-500';
      case 'error':
      default:
        return 'text-red-500';
    }
  };

  const getBorderColor = () => {
    switch (error.type) {
      case 'success':
        return 'border-green-500';
      case 'warning':
        return 'border-amber-500';
      case 'info':
        return 'border-blue-500';
      case 'error':
      default:
        return 'border-red-500';
    }
  };

  const getBgColor = () => {
    switch (error.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'error':
      default:
        return 'bg-red-50 dark:bg-red-900/20';
    }
  };

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
      case 'wait':
        return <FiClock className="mr-1" />;
      default:
        return <FiRefreshCw className="mr-1" />;
    }
  };

  const getActionButtonStyles = (actionType) => {
    switch (actionType) {
      case 'login':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'punch_out':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'wait':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'contact':
        return 'bg-purple-500 hover:bg-purple-600 text-white';
      case 'retry':
        return 'bg-green-500 hover:bg-green-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getActionButton = () => {
    if (!error.action) return null;
    
    return (
      <button
        onClick={() => onAction?.(error.actionType)}
        className={`mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${getActionButtonStyles(error.actionType)}`}
      >
        {getActionIcon(error.actionType)}
        {error.action}
      </button>
    );
  };

  const Icon = getIcon();

  return (
    <div className="fixed bottom-6 right-6 z-[999] max-w-md w-full animate-slide-in-right">
      <div className={`${getBgColor()} border-l-4 ${getBorderColor()} rounded-xl shadow-2xl overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Icon className={`text-xl ${getIconColor()}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`text-sm font-bold ${getIconColor()}`}>
                  {error.title || (error.type === 'success' ? 'Success' : 'Error')}
                </h4>
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="text-[var(--muted)] hover:text-[var(--text)] transition-colors flex-shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
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