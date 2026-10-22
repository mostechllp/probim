import React from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      reloading: false,
    };
    this.reloadTimer = null;
    this.reloadCount = 0;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // ✅ Only log to console — never surface to UI
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo?.componentStack);

    // Optional: send to monitoring (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);

    // ✅ Auto-reload the page after showing the message briefly
    this.scheduleReload(1500);
  }

  componentWillUnmount() {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }
  }

  scheduleReload = (delay = 1000) => {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.setState({ reloading: true });
    this.reloadTimer = setTimeout(() => {
      this.hardReload();
    }, delay);
  };

  hardReload = () => {
    // Bypass bfcache / force a fresh document load
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.href;
    }
  };

  handleRetry = () => {
    // ✅ No state reset — just reload the page (fresh mount + fresh data)
    this.scheduleReload(0);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-red-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {this.state.reloading
                ? "Reloading the page…"
                : "We couldn't load this section. Reloading shortly…"}
            </p>
            <button
              onClick={this.handleRetry}
              disabled={this.state.reloading}
              className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold text-sm hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiRefreshCw
                size={16}
                className={this.state.reloading ? "animate-spin" : ""}
              />
              {this.state.reloading ? "Reloading…" : "Try Again"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;