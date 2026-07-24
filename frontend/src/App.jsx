import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
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
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { useNotification } from "./contexts/NotificationContext";
import { useSession } from "./contexts/SessionContext";
import { useAuth } from "./contexts/AuthContext";
import { useWorkspace } from "./contexts/WorkspaceContext";
import { notificationService } from "./services/notificationService";
import { storageUtils } from "./utils/storageUtils";

function RootRedirect() {
  const landing = storageUtils.getUiPref("landingPage", "/dashboard");
  return <Navigate to={landing} replace />;
}

function AppRoutes() {
  const { loading: sessionLoading } = useSession();
  const { loading: authLoading } = useAuth();
  const { loading: workspaceLoading } = useWorkspace();

  if (sessionLoading || authLoading || workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
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
  );
}

const App = () => {
  const { notify } = useNotification();

  useEffect(() => {
    notificationService.init(notify);
  }, [notify]);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </>
  );
};

export default App;
