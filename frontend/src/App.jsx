import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import UploadDatasetPage from "./pages/UploadDatasetPage";
import DashboardPage from "./pages/DashboardPage";
import DataInsights from "./pages/DataInsights";
import MlPlayground from "./pages/MlPlayground";
import ModelComparison from "./pages/ModelComparison";
import Settings from "./pages/Settings";
import PreprocessingPage from "./pages/PreProcessingPage";
import DocumentationPage from "./pages/DocumentationPage";
import SupportPage from "./pages/SupportPage";

import AppLayout from "./components/AppLayout";
import ToastContainer from "./components/common/ToastContainer";
import { useNotification } from "./contexts/NotificationContext";
import { useSession } from "./contexts/SessionContext";
import { notificationService } from "./services/notificationService";
import { storageUtils } from "./utils/storageUtils";

function RootRedirect() {
  const landing = storageUtils.getUiPref("landingPage", "/dashboard");
  return <Navigate to={landing} replace />;
}

const App = () => {
  const { notify } = useNotification();
  const { loading } = useSession();

  useEffect(() => {
    notificationService.init(notify);
  }, [notify]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Restoring session...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/upload" element={<UploadDatasetPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/insights/:dataset_id" element={<DataInsights />} />
          <Route path="/preprocess/:dataset_id" element={<PreprocessingPage />} />
          <Route path="/playground/:dataset_id" element={<MlPlayground />} />
          <Route path="/comparison/:dataset_id" element={<ModelComparison />} />
          <Route path="/preprocess" element={<Navigate to="/upload" replace />} />
          <Route path="/playground" element={<Navigate to="/upload" replace />} />
          <Route path="/insights" element={<Navigate to="/upload" replace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/new-experiment" element={<Navigate to="/upload" replace />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </AppLayout>
      <ToastContainer />
    </>
  );
};

export default App;
