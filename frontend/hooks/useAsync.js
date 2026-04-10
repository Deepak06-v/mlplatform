import { useState, useCallback } from "react";

/**
 * Custom hook for managing async operations with loading and error states
 * @param {function} asyncFunction - Async function to execute
 * @returns {object} State and handlers
 */
export const useAsync = (asyncFunction) => {
  const [state, setState] = useState({
    status: "idle",
    data: null,
    error: null
  });

  const execute = useCallback(
    async (...args) => {
      setState({ status: "pending", data: null, error: null });
      try {
        const response = await asyncFunction(...args);
        setState({ status: "success", data: response, error: null });
        return response;
      } catch (error) {
        setState({ status: "error", data: null, error: error.message });
        throw error;
      }
    },
    [asyncFunction]
  );

  return {
    ...state,
    execute,
    isLoading: state.status === "pending",
    isError: state.status === "error",
    isSuccess: state.status === "success"
  };
};

export default useAsync;
