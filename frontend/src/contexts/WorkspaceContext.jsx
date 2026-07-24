import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { workspaceService } from "../services/workspaceService";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    try {
      const result = await workspaceService.getCurrent();
      setWorkspace(result);
    } catch {
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    fetchWorkspace();
  }, [fetchWorkspace]);

  const resetWorkspace = useCallback(async () => {
    try {
      const result = await workspaceService.reset();
      setWorkspace((prev) => ({
        ...prev,
        dataset_id: null,
        status: "empty",
      }));
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  const hasDataset = !!workspace?.dataset_id;

  const value = {
    workspace,
    loading,
    hasDataset,
    refetch: fetchWorkspace,
    resetWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
