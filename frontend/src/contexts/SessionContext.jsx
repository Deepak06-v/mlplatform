import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { datasetAPI, sessionAPI } from "../../services/api";
import { storageUtils } from "../utils/storageUtils";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [dataset, setDataset] = useState(null);

  const datasetId = storageUtils.getDatasetId();

  const reload = useCallback(async () => {
    if (!datasetId) {
      setLoading(false);
      return;
    }

    try {
      const [dsRes, sessRes] = await Promise.allSettled([
        datasetAPI.get(datasetId),
        sessionAPI.get(datasetId),
      ]);

      if (dsRes.status === "fulfilled" && dsRes.value?.data) {
        const d = dsRes.value.data;
        setDataset({ ...d });

        storageUtils.setColumnTypes(d.column_types || []);
        if (d.filename) storageUtils.setFileName(d.filename);
        if (d.preview) storageUtils.setPreviewData(d.preview);
      }

      if (sessRes.status === "fulfilled" && sessRes.value?.data) {
        const s = sessRes.value.data;

        const merged = {
          target_column: s.target_column || "",
          problem_type: s.problem_type || "",
          preprocess_config: s.preprocess_config || {},
          current_pipeline_stage: s.current_pipeline_stage || "",
        };

        const cache = storageUtils._getSession(datasetId);
        cache.target_column = merged.target_column;
        cache.problem_type = merged.problem_type;
        cache.preprocess_config = merged.preprocess_config;

        setSession(merged);
      } else {
        setSession({
          target_column: "",
          problem_type: "",
          preprocess_config: {},
          current_pipeline_stage: "",
        });
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const clearSession = useCallback(() => {
    setSession(null);
    setDataset(null);
  }, []);

  const updateSession = useCallback(
    (updates) => {
      const currentId = storageUtils.getDatasetId();
      if (!currentId || Object.keys(updates).length === 0) return;
      setSession((prev) => {
        const next = { ...prev, ...updates };
        const cache = storageUtils._getSession(currentId);
        Object.assign(cache, updates);
        return next;
      });
      sessionAPI.patch(currentId, updates).catch(() => {});
    },
    []
  );

  return (
    <SessionContext.Provider
      value={{ loading, session, dataset, datasetId, updateSession, reload, clearSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
