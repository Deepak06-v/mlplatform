import { Routes, Route, Navigate } from "react-router-dom";

import UploadDatasetPage from "./pages/UploadDatasetPage";
import DashboardPage from "./pages/DashboardPage";
import DataInsights from "./pages/DataInsights";
import MlPlayground from "./pages/MlPlayground";
import ModelComparison from "./pages/ModelComparison";
import Settings from "./pages/Settings";
import PreprocessingPage from "./pages/PreProcessingPage";

import AppLayout from "./components/AppLayout";
import ToastContainer from "./components/common/ToastContainer";
import { useNotification } from "./contexts/NotificationContext";
import { notificationService } from "./services/notificationService";
import { useEffect } from "react";

const App = () => {
  const { notify } = useNotification();

  useEffect(() => {
    notificationService.init(notify);
  }, [notify]);

  return (
    <>
      <AppLayout>
        <Routes>

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Core Pages */}
        <Route path="/upload" element={<UploadDatasetPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Dataset-based routes */}
        <Route path="/insights/:dataset_id" element={<DataInsights />} />
        <Route path="/preprocess/:dataset_id" element={<PreprocessingPage />} />
        <Route path="/playground/:dataset_id" element={<MlPlayground />} />
        <Route path="/comparison/:dataset_id" element={<ModelComparison />} />

        {/* Safety fallback (IMPORTANT) */}
        <Route path="/preprocess" element={<Navigate to="/upload" replace />} />
        <Route path="/playground" element={<Navigate to="/upload" replace />} />
        <Route path="/insights" element={<Navigate to="/upload" replace />} />

        {/* Other */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/new-experiment" element={<h1>new-experiment</h1>} />
        <Route path="/documentation" element={<h1>documentation</h1>} />
        <Route path="/support" element={<h1>support</h1>} />

      </Routes>
    </AppLayout>
    <ToastContainer />
  </>
  );
};

export default App;