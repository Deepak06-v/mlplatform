import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SessionProvider } from "./contexts/SessionContext";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <WorkspaceProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </WorkspaceProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);
