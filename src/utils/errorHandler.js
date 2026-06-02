// Centralized error handler service
class ErrorHandler {
  constructor() {
    this.errorTypes = {
      // Database constraint errors
      FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
      UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
      NOT_NULL_VIOLATION: 'NOT_NULL_VIOLATION',
      
      // Network errors
      NETWORK_ERROR: 'NETWORK_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR',
      
      // Authentication errors
      UNAUTHORIZED: 'UNAUTHORIZED',
      FORBIDDEN: 'FORBIDDEN',
      SESSION_EXPIRED: 'SESSION_EXPIRED',
      
      // Validation errors
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      INVALID_INPUT: 'INVALID_INPUT',
      
      // Business logic errors
      ALREADY_PUNCHED_IN: 'ALREADY_PUNCHED_IN',
      ALREADY_PUNCHED_OUT: 'ALREADY_PUNCHED_OUT',
      OUTSIDE_WORKING_HOURS: 'OUTSIDE_WORKING_HOURS',
      LOCATION_NOT_ALLOWED: 'LOCATION_NOT_ALLOWED',
      
      // Server errors
      SERVER_ERROR: 'SERVER_ERROR',
      SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
      
      // Generic
      UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };

    this.errorMessages = {
      [this.errorTypes.FOREIGN_KEY_VIOLATION]: {
        title: 'Account Configuration Issue',
        message: 'Your account is missing required information. Please contact HR to complete your profile.',
        action: 'Contact HR',
        actionType: 'contact'
      },
      [this.errorTypes.UNIQUE_VIOLATION]: {
        title: 'Duplicate Entry',
        message: 'This record already exists in the system.',
        action: 'Try Again',
        actionType: 'retry'
      },
      [this.errorTypes.NETWORK_ERROR]: {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: 'Retry',
        actionType: 'retry'
      },
      [this.errorTypes.TIMEOUT_ERROR]: {
        title: 'Request Timeout',
        message: 'The server is taking too long to respond. Please try again.',
        action: 'Retry',
        actionType: 'retry'
      },
      [this.errorTypes.UNAUTHORIZED]: {
        title: 'Authentication Required',
        message: 'Please log in again to continue.',
        action: 'Login',
        actionType: 'login'
      },
      [this.errorTypes.FORBIDDEN]: {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'Contact Admin',
        actionType: 'contact'
      },
      [this.errorTypes.SESSION_EXPIRED]: {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        action: 'Login',
        actionType: 'login'
      },
      [this.errorTypes.VALIDATION_ERROR]: {
        title: 'Validation Error',
        message: 'Please check the form for errors and try again.',
        action: 'Fix Errors',
        actionType: 'fix'
      },
      [this.errorTypes.ALREADY_PUNCHED_IN]: {
        title: 'Already Punched In',
        message: 'You have already punched in for today.',
        action: 'Punch Out',
        actionType: 'punch_out'
      },
      [this.errorTypes.ALREADY_PUNCHED_OUT]: {
        title: 'Already Punched Out',
        message: 'You have already punched out for today.',
        action: 'Contact HR',
        actionType: 'contact'
      },
      [this.errorTypes.OUTSIDE_WORKING_HOURS]: {
        title: 'Outside Working Hours',
        message: 'Punch in/out is only allowed during working hours.',
        action: 'Check Schedule',
        actionType: 'schedule'
      },
      [this.errorTypes.LOCATION_NOT_ALLOWED]: {
        title: 'Location Not Allowed',
        message: 'Your current location is not within the allowed area.',
        action: 'Try Again',
        actionType: 'retry'
      },
      [this.errorTypes.SERVER_ERROR]: {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'Try Again',
        actionType: 'retry'
      },
      [this.errorTypes.SERVICE_UNAVAILABLE]: {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        action: 'Retry',
        actionType: 'retry'
      },
      [this.errorTypes.UNKNOWN_ERROR]: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Try Again',
        actionType: 'retry'
      }
    };
  }

  // Parse error and determine type
  parseError(error) {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.response?.data?.message || error?.message || error?.payload || '';
    
    const errorData = error?.response?.data || {};
    const statusCode = error?.response?.status;

    // Check for specific SQL errors
    if (errorMessage.includes('foreign key constraint fails') || 
        errorMessage.includes('1452')) {
      return this.errorTypes.FOREIGN_KEY_VIOLATION;
    }
    
    if (errorMessage.includes('Duplicate entry') || 
        errorMessage.includes('1062')) {
      return this.errorTypes.UNIQUE_VIOLATION;
    }
    
    if (errorMessage.includes('cannot be null') || 
        errorMessage.includes('1048')) {
      return this.errorTypes.NOT_NULL_VIOLATION;
    }

    // Check status codes
    if (statusCode === 401) {
      return this.errorTypes.UNAUTHORIZED;
    }
    
    if (statusCode === 403) {
      return this.errorTypes.FORBIDDEN;
    }
    
    if (statusCode === 422) {
      return this.errorTypes.VALIDATION_ERROR;
    }
    
    if (statusCode === 500) {
      return this.errorTypes.SERVER_ERROR;
    }
    
    if (statusCode === 503) {
      return this.errorTypes.SERVICE_UNAVAILABLE;
    }

    // Check network errors
    if (errorMessage.includes('Network Error') || 
        errorMessage.includes('Failed to fetch')) {
      return this.errorTypes.NETWORK_ERROR;
    }
    
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('Timeout')) {
      return this.errorTypes.TIMEOUT_ERROR;
    }

    // Check business logic errors
    if (errorMessage.toLowerCase().includes('already punched in')) {
      return this.errorTypes.ALREADY_PUNCHED_IN;
    }
    
    if (errorMessage.toLowerCase().includes('already punched out')) {
      return this.errorTypes.ALREADY_PUNCHED_OUT;
    }
    
    if (errorMessage.toLowerCase().includes('outside working hours')) {
      return this.errorTypes.OUTSIDE_WORKING_HOURS;
    }
    
    if (errorMessage.toLowerCase().includes('location')) {
      return this.errorTypes.LOCATION_NOT_ALLOWED;
    }

    return this.errorTypes.UNKNOWN_ERROR;
  }

  // Get user-friendly error object
  getFriendlyError(error) {
    const errorType = this.parseError(error);
    const defaultError = this.errorMessages[errorType];
    
    // Extract validation errors if present
    const validationErrors = error?.response?.data?.errors;
    if (validationErrors && errorType === this.errorTypes.VALIDATION_ERROR) {
      const fieldErrors = Object.values(validationErrors).flat();
      return {
        title: 'Validation Failed',
        message: fieldErrors.join(', '),
        action: 'Fix Errors',
        actionType: 'fix',
        details: validationErrors
      };
    }
    
    return defaultError;
  }

  // Handle error with callback actions
  handleError(error, callbacks = {}) {
    const friendlyError = this.getFriendlyError(error);
    
    // Log error for debugging
    console.error('Error occurred:', {
      original: error,
      friendly: friendlyError
    });
    
    // Execute callback based on action type
    if (friendlyError.actionType === 'login' && callbacks.onLogin) {
      callbacks.onLogin();
    }
    
    if (friendlyError.actionType === 'retry' && callbacks.onRetry) {
      callbacks.onRetry();
    }
    
    if (friendlyError.actionType === 'contact' && callbacks.onContact) {
      callbacks.onContact();
    }
    
    if (friendlyError.actionType === 'punch_out' && callbacks.onPunchOut) {
      callbacks.onPunchOut();
    }
    
    if (friendlyError.actionType === 'schedule' && callbacks.onViewSchedule) {
      callbacks.onViewSchedule();
    }
    
    return friendlyError;
  }

  // Get error message string (simple version)
  getErrorMessage(error) {
    const friendly = this.getFriendlyError(error);
    return friendly.message;
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;