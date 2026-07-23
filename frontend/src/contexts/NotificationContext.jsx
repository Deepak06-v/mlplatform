import { createContext, useContext, useState, useCallback, useMemo } from "react";

const NotificationContext = createContext(null);

let nextId = 0;

function getNotifPrefs() {
  try {
    const raw = localStorage.getItem("ui_prefs");
    if (!raw) return {};
    return JSON.parse(raw).notifications || {};
  } catch {
    return {};
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const add = useCallback((type, title, message, duration = 4000) => {
    const prefs = getNotifPrefs();
    if (prefs[type] === false) return -1;

    const id = ++nextId;

    setNotifications((prev) => {
      const next = [...prev, { id, type, title, message, duration }];
      return next.length > 4 ? next.slice(1) : next;
    });

    return id;
  }, []);

  const notify = useMemo(() => ({
    success: (title, message) => add("success", title, message),
    error: (title, message) => add("error", title, message, 6000),
    warning: (title, message) => add("warning", title, message, 5000),
    info: (title, message) => add("info", title, message),
  }), [add]);

  const value = useMemo(() => ({ notifications, remove, notify }), [notifications, remove, notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
}

export default NotificationContext;
