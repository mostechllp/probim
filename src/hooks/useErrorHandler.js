// hooks/useErrorHandler.js
import { useState, useCallback } from 'react';
import errorHandler from '../utils/errorHandler';

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((err, callbacks = {}) => {
    // Extract the actual error from Redux thunk rejection
    let actualError = err;
    
    // If it's a thunk rejection with payload
    if (err?.payload) {
      actualError = err.payload;
    } 
    // If it's a thunk rejection with error
    else if (err?.error) {
      actualError = err.error;
    }
    // If it's an object with response data
    else if (err?.response?.data) {
      actualError = err.response.data;
    }
    // If it's an error with message
    else if (err?.message) {
      actualError = err.message;
    }
    // If it's a string
    else if (typeof err === 'string') {
      actualError = err;
    }
    
    // Pass to errorHandler
    const friendlyError = errorHandler.handleError(actualError, callbacks);
    setError(friendlyError);
    return friendlyError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(async (asyncFn, callbacks = {}) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await asyncFn();
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      handleError(err, callbacks);
      throw err;
    }
  }, [handleError, clearError]);

  return {
    error,
    loading,
    handleError,
    clearError,
    withErrorHandling,
    setError
  };
};

export default useErrorHandler;