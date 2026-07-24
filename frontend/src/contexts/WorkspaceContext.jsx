import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { workspaceService } from "../services/workspaceService";
import { storageUtils } from "../utils/storageUtils";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(true);
  const fetching = useRef(false);

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

  const loadState = useCallback(async () => {
    if (!isAuthenticated || fetching.current) return;
    fetching.current = true;
    setStateLoading(true);
    try {
      const result = await workspaceService.getState();
      setState(result);

      const dsId = result?.dataset?.dataset_id || workspace?.dataset_id;

      if (result?.eda && dsId) {
        storageUtils.saveEDA(dsId, result.eda);
      }
      if (result?.training?.experiments && dsId) {
        storageUtils._experimentsCache[dsId] = result.training.experiments;
      }
      if (result?.training?.comparison && dsId) {
        storageUtils.saveComparisonResult(dsId, result.training.comparison);
      }
      if (result?.ai_insights && dsId) {
        Object.entries(result.ai_insights).forEach(([page, data]) => {
          if (data) {
            storageUtils.saveAiRecommendation(dsId, page, data);
          }
        });
      }
    } catch {
      // state not found — first visit / fresh workspace
    } finally {
      setStateLoading(false);
      fetching.current = false;
    }
  }, [isAuthenticated, workspace?.dataset_id]);

  useEffect(() => {
    setLoading(true);
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (workspace) {
      loadState();
    } else if (!isAuthenticated) {
      setState(null);
      setStateLoading(false);
    }
  }, [workspace, isAuthenticated, loadState]);

  const resetWorkspace = useCallback(async () => {
    try {
      const result = await workspaceService.reset();
      setWorkspace((prev) => ({
        ...prev,
        dataset_id: null,
        status: "empty",
      }));
      setState(null);
      storageUtils.clearDataset(null);
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateSection = useCallback(
    async (section, data, statusKey) => {
      setState((prev) => {
        const base = prev || {};
        const updated = { ...base, [section]: data };
        if (statusKey) {
          updated.status = { ...(base.status || {}), [statusKey]: true };
        }
        return updated;
      });
      try {
        await workspaceService.updateSection(section, data, statusKey);
      } catch {
        // silently fail — optimistic update
      }
    },
    [],
  );

  const hasDataset = !!workspace?.dataset_id;

  const value = {
    workspace,
    loading,
    hasDataset,

    state,
    stateLoading,

    eda: state?.eda || null,
    preprocessing: state?.preprocessing || null,
    training: state?.training || null,
    featureImportance: state?.feature_importance || null,
    aiInsights: state?.ai_insights || null,
    status: state?.status || null,
    datasetInfo: state?.dataset || null,

    refetch: fetchWorkspace,
    reloadState: loadState,
    resetWorkspace,
    updateSection,
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
