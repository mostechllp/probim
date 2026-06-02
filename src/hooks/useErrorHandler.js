import { useState, useCallback } from 'react';
import errorHandler from '../utils/errorHandler';

const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((err, callbacks = {}) => {
    const friendlyError = errorHandler.handleError(err, callbacks);
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
    withErrorHandling
  };
};

export default useErrorHandler;