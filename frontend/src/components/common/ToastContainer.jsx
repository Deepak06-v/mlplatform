import { useState, useEffect, useRef } from "react";
import { useNotification } from "../../contexts/NotificationContext";

const ICONS = {
  success: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const BORDER_COLORS = {
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500"
};

function ToastItem({ notification, onClose, staggerIndex }) {
  const [phase, setPhase] = useState("pending");
  const dismissTimer = useRef(null);
  const stableStagger = useRef(staggerIndex).current;

  useEffect(() => {
    const t = setTimeout(() => setPhase("entering"), stableStagger * 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "entering") return;
    const t = setTimeout(() => setPhase("stable"), 450);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "stable") return;
    if (notification.duration <= 0) return;

    const timer = setTimeout(() => setPhase("exiting"), notification.duration);
    dismissTimer.current = timer;
    return () => {
      clearTimeout(timer);
    };
  }, [phase, notification.duration]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const t = setTimeout(() => onClose(notification.id), 300);
    return () => clearTimeout(t);
  }, [phase, notification.id, onClose]);

  const handleClose = () => {
    if (phase === "exiting") return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setPhase("exiting");
  };

  const isHidden = phase === "pending";
  const isEntering = phase === "entering";

  return (
    <div className={`mb-3 transition-all duration-200 ${isHidden ? "opacity-0 pointer-events-none" : ""}`}>
      <div
        className={`flex items-start gap-3 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 border-l-4 ${BORDER_COLORS[notification.type]} p-4 ${
          phase === "exiting" ? "animate-toast-out" : isEntering ? "animate-toast-in" : ""
        }`}
        role="alert"
      >
        <div className="flex-shrink-0 mt-0.5">{ICONS[notification.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {notification.title}
          </p>
          {notification.message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const { notifications, remove } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col pointer-events-none">
      {notifications.map((n, i) => {
        const stagger = notifications.length - 1 - i;
        return (
          <div key={n.id} className="pointer-events-auto">
            <ToastItem notification={n} onClose={remove} staggerIndex={stagger} />
          </div>
        );
      })}
    </div>
  );
}