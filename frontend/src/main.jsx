import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SessionProvider } from "./contexts/SessionContext";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NotificationProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </NotificationProvider>
  </BrowserRouter>
);
