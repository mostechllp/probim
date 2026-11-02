import React from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

const RELOAD_FLAG = "error_boundary_reload_attempted";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      reloading: false,
    };
    this.reloadTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 1. Log the error so it appears in the console
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo?.componentStack);

    // 2. Check if we've already tried reloading for this specific error
    const hasAttemptedReload = sessionStorage.getItem(RELOAD_FLAG);

    if (!hasAttemptedReload) {
      // First crash: Set the flag BEFORE reloading, so when the page loads again, it knows.
      sessionStorage.setItem(RELOAD_FLAG, "true");
      
      // Show the reloading UI state
      this.setState({ reloading: true });
      
      // Auto-reload after a brief delay so they can see the message
      this.reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      // If we are here, it means it crashed AGAIN after a reload. 
      // Do not reload. Just show the UI and clear the flag for manual retries.
      this.setState({ reloading: false });
      sessionStorage.removeItem(RELOAD_FLAG);
    }
  }

  componentWillUnmount() {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
  }

  handleRetry = () => {
    // Manual retry: Clear the flag so they get one more auto-reload shot if it crashes again
    sessionStorage.removeItem(RELOAD_FLAG);
    this.setState({ reloading: true });
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      const hasAttemptedReload = sessionStorage.getItem(RELOAD_FLAG) === "true";

      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertTriangle className="text-red-500 text-4xl" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Something went wrong
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {this.state.reloading 
                ? "The application encountered an error. Reloading the page..." 
                : hasAttemptedReload
                  ? "The page encountered a critical error that persists after reloading. Please try again or check the browser console for details."
                  : "We couldn't load this section of the application."}
            </p>

            <button
              onClick={this.handleRetry}
              disabled={this.state.reloading}
              className="px-6 py-2.5 bg-green-500 text-white rounded-full font-semibold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <FiRefreshCw
                size={16}
                className={this.state.reloading ? "animate-spin" : ""}
              />
              {this.state.reloading ? "Reloading..." : "Try Again"}
            </button>
            
            {/* Optional: Show the actual error message if in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 text-xs text-left rounded-lg overflow-auto max-h-40">
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;