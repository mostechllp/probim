// Centralized error handler service
const IS_DEV =
  typeof process !== "undefined"
    ? process.env?.NODE_ENV !== "production"
    : true;

const devLog = (...args) => {
  if (IS_DEV) console.log(...args);
};

// ✅ Action types as constants (avoids typos)
const ActionType = Object.freeze({
  RETRY: "retry",
  LOGIN: "login",
  CONTACT: "contact",
  PUNCH_OUT: "punch_out",
  SCHEDULE: "schedule",
  WAIT: "wait",
  FIX: "fix",
});

class ErrorHandler {
  constructor() {
    this.errorTypes = Object.freeze({
      // Database constraint errors
      FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
      UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
      NOT_NULL_VIOLATION: "NOT_NULL_VIOLATION",

      // Network errors
      NETWORK_ERROR: "NETWORK_ERROR",
      TIMEOUT_ERROR: "TIMEOUT_ERROR",

      // Authentication errors
      UNAUTHORIZED: "UNAUTHORIZED",
      FORBIDDEN: "FORBIDDEN",
      SESSION_EXPIRED: "SESSION_EXPIRED",

      // Validation errors
      VALIDATION_ERROR: "VALIDATION_ERROR",

      // Business logic errors
      ALREADY_PUNCHED_IN: "ALREADY_PUNCHED_IN",
      ALREADY_PUNCHED_OUT: "ALREADY_PUNCHED_OUT",
      OUTSIDE_WORKING_HOURS: "OUTSIDE_WORKING_HOURS",
      LOCATION_NOT_ALLOWED: "LOCATION_NOT_ALLOWED",
      PENDING_PUNCH_OUT: "PENDING_PUNCH_OUT",
      LATE_PUNCH_PENDING_APPROVAL: "LATE_PUNCH_PENDING_APPROVAL",

      // Server errors
      SERVER_ERROR: "SERVER_ERROR",
      SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

      // Generic
      UNKNOWN_ERROR: "UNKNOWN_ERROR",
    });

    this.errorMessages = Object.freeze({
      [this.errorTypes.FOREIGN_KEY_VIOLATION]: {
        title: "Account Configuration Issue",
        message:
          "Your account is missing required information. Please contact HR to complete your profile.",
        action: "Contact HR",
        actionType: ActionType.CONTACT,
      },
      [this.errorTypes.UNIQUE_VIOLATION]: {
        title: "Duplicate Entry",
        message: "This record already exists in the system.",
        action: "Try Again",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.NOT_NULL_VIOLATION]: {
        title: "Missing Required Data",
        message:
          "A required field is missing. Please contact HR or try again.",
        action: "Try Again",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.NETWORK_ERROR]: {
        title: "Connection Error",
        message:
          "Unable to connect to the server. Please check your internet connection.",
        action: "Retry",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.TIMEOUT_ERROR]: {
        title: "Request Timeout",
        message: "The server is taking too long to respond. Please try again.",
        action: "Retry",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.UNAUTHORIZED]: {
        title: "Authentication Required",
        message: "Please log in again to continue.",
        action: "Login",
        actionType: ActionType.LOGIN,
      },
      [this.errorTypes.FORBIDDEN]: {
        title: "Access Denied",
        message: "You don't have permission to perform this action.",
        action: "Contact Admin",
        actionType: ActionType.CONTACT,
      },
      [this.errorTypes.SESSION_EXPIRED]: {
        title: "Session Expired",
        message: "Your session has expired. Please log in again.",
        action: "Login",
        actionType: ActionType.LOGIN,
      },
      [this.errorTypes.VALIDATION_ERROR]: {
        title: "Validation Error",
        message: "Please check the form for errors and try again.",
        action: "Fix Errors",
        actionType: ActionType.FIX,
      },
      [this.errorTypes.ALREADY_PUNCHED_IN]: {
        title: "Already Punched In",
        message: "You have already punched in for today.",
        action: "Punch Out",
        actionType: ActionType.PUNCH_OUT,
      },
      [this.errorTypes.ALREADY_PUNCHED_OUT]: {
        title: "Already Punched Out",
        message: "You have already punched out for today.",
        action: "Contact HR",
        actionType: ActionType.CONTACT,
      },
      [this.errorTypes.OUTSIDE_WORKING_HOURS]: {
        title: "Outside Working Hours",
        message: "Punch in/out is only allowed during working hours.",
        action: "Check Schedule",
        actionType: ActionType.SCHEDULE,
      },
      [this.errorTypes.LOCATION_NOT_ALLOWED]: {
        title: "Location Not Allowed",
        message: "Your current location is not within the allowed area.",
        action: "Try Again",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.PENDING_PUNCH_OUT]: {
        title: "Pending Punch Out",
        message:
          "You have a pending punch out from a previous day. Please complete it first.",
        action: "Punch Out Now",
        actionType: ActionType.PUNCH_OUT,
      },
      [this.errorTypes.LATE_PUNCH_PENDING_APPROVAL]: {
        title: "Late Punch In - Pending Approval",
        message:
          "Your late punch-in request is pending HR approval. Please wait.",
        action: "Okay, I'll Wait",
        actionType: ActionType.WAIT,
      },
      [this.errorTypes.SERVER_ERROR]: {
        title: "Server Error",
        message: "Something went wrong on our end. Please try again later.",
        action: "Try Again",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.SERVICE_UNAVAILABLE]: {
        title: "Service Unavailable",
        message:
          "The service is temporarily unavailable. Please try again later.",
        action: "Retry",
        actionType: ActionType.RETRY,
      },
      [this.errorTypes.UNKNOWN_ERROR]: {
        title: "Something Went Wrong",
        message: "An unexpected error occurred. Please try again.",
        action: "Try Again",
        actionType: ActionType.RETRY,
      },
    });
  }

  // Safely dig a nested property by "a.b.c" path
  _dig(obj, path) {
    try {
      return path.split(".").reduce((acc, key) => acc?.[key], obj);
    } catch {
      return undefined;
    }
  }

  // Extract a user-facing error message from various formats
  extractErrorMessage(error) {
    if (error == null) return null;

    // Plain string
    if (typeof error === "string") {
      return error.trim() || null;
    }

    // Number / boolean / etc. -> stringify for debugging but don't return raw junk
    if (typeof error !== "object") {
      return null;
    }

    // Candidate paths, checked in order
    const paths = [
      "payload.message",
      "payload.data.message",
      "payload.error.message",
      "payload.error",
      "payload.data.error.message",
      "payload.msg",
      "payload.detail",
      "response.data.message",
      "response.data.error.message",
      "response.data.error",
      "response.data.msg",
      "response.data.detail",
      "response.data.data.message",
      "data.message",
      "data.error.message",
      "data.error",
      "error.message",
      "error.response.data.message",
      "message",
      "msg",
      "detail",
    ];

    for (const path of paths) {
      const value = this._dig(error, path);
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    // Last resort: maybe a plain object with only .message at root — covered above.
    // Do NOT stringify the whole object — it can leak internals to the UI,
    // or fail on circular refs.
    return null;
  }

  // Parse error and determine type
  // ✅ Order matters: business codes → SQL → status → message fallbacks
  parseError(error) {
    const errorMessage = this.extractErrorMessage(error) || "";
    const lower = errorMessage.toLowerCase();

    const statusCode =
      error?.response?.status ??
      error?.status ??
      error?.payload?.status ??
      error?.error?.response?.status ??
      null;

    // ---- 1) Explicit business codes / messages (highest priority) ----

    if (
      lower.includes("punch-in blocked") ||
      lower.includes("punch in blocked") ||
      lower.includes("pending hr approval") ||
      lower.includes("late check-in request") ||
      lower.includes("late check-in is pending") ||
      lower.includes("late check-in request is pending")
    ) {
      return this.errorTypes.LATE_PUNCH_PENDING_APPROVAL;
    }

    if (
      lower.includes("pending punch-out") ||
      lower.includes("pending punch out") ||
      lower.includes("punch out for that day") ||
      lower.includes("please punch out first") ||
      lower.includes("you have pending punch out")
    ) {
      return this.errorTypes.PENDING_PUNCH_OUT;
    }

    if (lower.includes("already punched in")) {
      return this.errorTypes.ALREADY_PUNCHED_IN;
    }

    if (lower.includes("already punched out")) {
      return this.errorTypes.ALREADY_PUNCHED_OUT;
    }

    if (lower.includes("outside working hours")) {
      return this.errorTypes.OUTSIDE_WORKING_HOURS;
    }

    // More specific than bare "location"
    if (
      lower.includes("location is not within") ||
      lower.includes("outside allowed location") ||
      lower.includes("location not allowed")
    ) {
      return this.errorTypes.LOCATION_NOT_ALLOWED;
    }

    // ---- 2) SQL / DB errors ----

    if (
      lower.includes("foreign key constraint fails") ||
      lower.includes("1452")
    ) {
      return this.errorTypes.FOREIGN_KEY_VIOLATION;
    }

    if (lower.includes("duplicate entry") || lower.includes("1062")) {
      return this.errorTypes.UNIQUE_VIOLATION;
    }

    if (lower.includes("cannot be null") || lower.includes("1048")) {
      return this.errorTypes.NOT_NULL_VIOLATION;
    }

    // ---- 3) HTTP status ----

    if (statusCode === 401) {
      // Distinguish expired-session if we can
      if (
        lower.includes("expired") ||
        error?.response?.data?.code === "TOKEN_EXPIRED" ||
        error?.payload?.code === "TOKEN_EXPIRED"
      ) {
        return this.errorTypes.SESSION_EXPIRED;
      }
      return this.errorTypes.UNAUTHORIZED;
    }

    if (statusCode === 403) return this.errorTypes.FORBIDDEN;
    if (statusCode === 422) return this.errorTypes.VALIDATION_ERROR;

    if (statusCode === 503) return this.errorTypes.SERVICE_UNAVAILABLE;

    if (typeof statusCode === "number" && statusCode >= 500 && statusCode < 600) {
      return this.errorTypes.SERVER_ERROR;
    }

    // ---- 4) Network / transport ----

    if (lower.includes("network error") || lower.includes("failed to fetch")) {
      return this.errorTypes.NETWORK_ERROR;
    }

    if (lower.includes("timeout") || lower.includes("timed out")) {
      return this.errorTypes.TIMEOUT_ERROR;
    }

    return this.errorTypes.UNKNOWN_ERROR;
  }

  // Get user-friendly error object
  getFriendlyError(error) {
    const errorType = this.parseError(error);
    devLog("Error type determined:", errorType);

    const base = this.errorMessages[errorType];

    // Dynamic message overrides
    const actualMessage = this.extractErrorMessage(error);

    if (errorType === this.errorTypes.LATE_PUNCH_PENDING_APPROVAL) {
      return {
        ...base,
        message: actualMessage || base.message,
      };
    }

    if (errorType === this.errorTypes.PENDING_PUNCH_OUT && actualMessage) {
      return { ...base, message: actualMessage };
    }

    // Validation errors — extract per-field messages safely
    if (errorType === this.errorTypes.VALIDATION_ERROR) {
      const validationErrors =
        error?.response?.data?.errors ??
        error?.data?.errors ??
        error?.payload?.errors;

      if (validationErrors && typeof validationErrors === "object") {
        const fieldErrors = Object.values(validationErrors)
          .flat()
          .map((v) => {
            if (typeof v === "string") return v;
            if (v && typeof v === "object") return v.message ?? null;
            return null;
          })
          .filter(Boolean);

        if (fieldErrors.length > 0) {
          return {
            title: "Validation Failed",
            message: fieldErrors.join(", "),
            action: "Fix Errors",
            actionType: ActionType.FIX,
            details: validationErrors,
          };
        }
      }
    }

    // Unknown error but with a useful message
    if (
      errorType === this.errorTypes.UNKNOWN_ERROR &&
      actualMessage &&
      actualMessage !== "{}"
    ) {
      return {
        title: "Error",
        message: actualMessage,
        action: "Try Again",
        actionType: ActionType.RETRY,
      };
    }

    return base || this.errorMessages[this.errorTypes.UNKNOWN_ERROR];
  }

  // Default fallbacks when caller doesn't supply a callback
  _defaultAction(actionType) {
    switch (actionType) {
      case ActionType.RETRY:
        // Force a fresh document load
        try {
          window.location.reload();
        } catch {
          window.location.href = window.location.href;
        }
        break;
      case ActionType.LOGIN:
        try {
          window.location.href = "/login";
        } catch {
          /* no-op */
        }
        break;
      case ActionType.CONTACT:
        // Do nothing — caller should wire this to a modal / mailto
        break;
      case ActionType.PUNCH_OUT:
      case ActionType.SCHEDULE:
      case ActionType.WAIT:
      case ActionType.FIX:
      default:
        // Let the caller decide — no default side effect
        break;
    }
  }

  // Handle error with callback actions
  handleError(error, callbacks = {}) {
    const friendlyError = this.getFriendlyError(error);

    // Log for debugging (dev only)
    if (IS_DEV) {
      console.error("[ErrorHandler]", {
        original: error,
        friendly: friendlyError,
      });
    }

    const callbackMap = {
      [ActionType.LOGIN]: callbacks.onLogin,
      [ActionType.RETRY]: callbacks.onRetry,
      [ActionType.CONTACT]: callbacks.onContact,
      [ActionType.PUNCH_OUT]: callbacks.onPunchOut,
      [ActionType.SCHEDULE]: callbacks.onViewSchedule,
      [ActionType.WAIT]: callbacks.onWait,
      [ActionType.FIX]: callbacks.onFix,
    };

    const fn = callbackMap[friendlyError?.actionType];
    if (typeof fn === "function") {
      fn();
      // Indicate a callback handled it
      return { ...friendlyError, handled: true };
    }

    // No callback supplied — indicate the caller can wire one,
    // and fall back to a sensible default for RETRY/LOGIN.
    if (IS_DEV) {
      console.warn(
        `[ErrorHandler] No callback provided for action "${friendlyError?.actionType}". Falling back to default.`
      );
    }

    if (friendlyError?.actionType === ActionType.RETRY) {
      // Don't auto-reload silently — flag for UI to handle if possible,
      // but still provide the fallback to avoid a dead button.
      this._defaultAction(ActionType.RETRY);
    } else if (friendlyError?.actionType === ActionType.LOGIN) {
      this._defaultAction(ActionType.LOGIN);
    }

    return { ...friendlyError, handled: false };
  }

  // Simple message string
  getErrorMessage(error) {
    const friendly = this.getFriendlyError(error);
    return friendly.message;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;