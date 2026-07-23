import { storageUtils } from "./storageUtils";

export function resetCurrentSession() {
  const datasetId = storageUtils.getDatasetId();

  if (datasetId) {
    storageUtils.clearDataset(datasetId);
  }

  storageUtils.clearDatasetCache(datasetId || "");
  storageUtils.setDatasetId("");
  storageUtils._sessionCache = {};
  storageUtils._edaCache = {};
  storageUtils._fiCache = {};
  storageUtils._aiCache = {};
  storageUtils._experimentsCache = {};
  storageUtils._comparisonCache = {};
  storageUtils._activitiesCache = {};
  storageUtils._columnTypes = null;
  storageUtils._fileName = null;
  storageUtils._previewData = null;
}
