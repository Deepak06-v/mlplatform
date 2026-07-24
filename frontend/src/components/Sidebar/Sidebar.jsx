import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import {
  LayoutDashboard,
  UploadCloud,
  BarChart2,
  FlaskConical,
  GitCompare,
  Settings,
  BookOpen,
  HelpCircle,
  Plus,
  Wand2,
  X,
  LogOut,
  LogIn,
  UserPlus,
  User,
} from "lucide-react";
import Logo from "../../assets/Logo";
import { storageUtils } from "../../utils/storageUtils";
import { resetCurrentSession } from "../../utils/sessionReset";
import { useSession } from "../../contexts/SessionContext";

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
// To change a route, edit the `path` field below.
// To change a label, edit the `label` field.
// To swap an icon, replace the lucide-react component in the `icon` field.
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",           // ← EDIT: your route here
  },
  {
    id: "upload",
    label: "Upload Dataset",
    icon: UploadCloud,
    path: "/upload",      // ← EDIT: your route here
  },
  {
    id: "insights",
    label: "Data Insights",
    icon: BarChart2,
    path: "/insights",       // ← EDIT: your route here
  },
  {
    id: "preprocess",
    label: "PreProcessing",
    icon: Wand2,
    path: "/preprocess",            // ← EDIT: your route here
  },
  {
    id: "playground",
    label: "ML Playground",
    icon: FlaskConical,
    path: "/playground",       // ← EDIT: your route here
  },
  {
    id: "comparison",
    label: "Model Comparison",
    icon: GitCompare,
    path: "/comparison",    // ← EDIT: your route here
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",            // ← EDIT: your route here
  },
];

// ─── BOTTOM LINKS ─────────────────────────────────────────────────────────────
const BOTTOM_LINKS = [
  {
    id: "docs",
    label: "Documentation",
    icon: BookOpen,
    path: "/documentation",       // ← EDIT: your route or external URL here
    // external: true,            // ← UNCOMMENT for external link (opens new tab)
  },
  {
    id: "support",
    label: "Support",
    icon: HelpCircle,
    path: "/support",             // ← EDIT: your route or external URL here
    // external: true,            // ← UNCOMMENT for external link (opens new tab)
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { clearSession } = useSession();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { resetWorkspace } = useWorkspace();
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleNav = (item) => {
  if (item.external) {
    window.open(item.path, "_blank", "noopener,noreferrer");
    return;
  }

  const datasetId = storageUtils.getDatasetId();

  // Routes that REQUIRE dataset_id
  const datasetRoutes = ["insights", "playground", "comparison", "preprocess"];

  if (datasetRoutes.includes(item.id)) {
    if (!datasetId) {
      notify.warning("No dataset", "Upload a dataset first");
      navigate("/upload");
      return;
    }

    const fullPath = `${item.path}/${datasetId}`;
    navigate(fullPath);
  } else {
    navigate(item.path);
  }
};

  return (
    <aside className="fixed top-0 left-0 w-[220px] h-screen bg-[#eef2fc] border-r border-[#dde4f5] flex flex-col px-3 py-5">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-1.5 mb-7">
        <div className="w-[34px] h-[34px] bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Logo />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13.5px] font-bold text-blue-600 tracking-tight">
            PrecisionEngine
          </span>
          <span className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
            V2.4.0-STABLE
          </span>
        </div>
      </div>

      {/* ── Main Nav ── */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[10px] text-left transition-all duration-150 cursor-pointer border-none
                ${isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "bg-transparent text-slate-500 hover:bg-blue-100/60 hover:text-slate-800"
                }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.8} className="flex-shrink-0" />
              <span className="text-[13.5px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── New Experiment CTA ── */}
      <div className="px-0.5 mb-2.5">
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white text-[13px] font-semibold rounded-[10px] shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:shadow-[0_4px_14px rgba(37,99,235,0.38)] transition-all duration-150 cursor-pointer border-none"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Experiment
        </button>
      </div>

      {/* ── Confirmation Dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Start New Experiment</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              This will clear your current working session and return you to the Upload page. Unsaved experiment progress will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setResetting(true);
                  try {
                    await resetWorkspace();
                    resetCurrentSession();
                    clearSession();
                    notify.success("Workspace reset", "All data has been cleared.");
                    navigate("/upload", { replace: true });
                  } catch {
                    notify.error("Reset failed", "Could not reset workspace.");
                  } finally {
                    setResetting(false);
                    setShowConfirm(false);
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer border-none disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Start New Experiment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Section ── */}
      {isAuthenticated ? (
        <div className="px-0.5 mb-2.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-blue-50">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[12.5px] font-semibold text-gray-800 truncate">
                {currentUser?.username}
              </span>
              <span className="text-[9.5px] text-gray-400 truncate">
                {currentUser?.subscription_plan}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-0.5 mb-2.5">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-[10px] transition-all duration-150 cursor-pointer border-none"
          >
            <LogIn size={14} strokeWidth={2.5} />
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="w-full flex items-center justify-center gap-1.5 py-2 mt-1.5 bg-transparent text-blue-600 hover:bg-blue-50 text-[13px] font-semibold rounded-[10px] transition-all duration-150 cursor-pointer border border-blue-200"
          >
            <UserPlus size={14} strokeWidth={2.5} />
            Sign Up
          </button>
        </div>
      )}

      {/* ── Logout Button ── */}
      {isAuthenticated && (
        <div className="px-0.5 mb-2.5">
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
              notify.success("Logged out", "You have been logged out successfully.");
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-transparent text-slate-500 hover:bg-red-50 hover:text-red-600 text-[13px] font-medium rounded-[10px] transition-all duration-150 cursor-pointer border border-slate-200 hover:border-red-200"
          >
            <LogOut size={14} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      )}

      {/* ── Bottom Links ── */}
      <div className="flex flex-col gap-0.5 pt-2 border-t border-[#dde4f5]">
        {BOTTOM_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[10px] text-left bg-transparent text-slate-500 hover:bg-blue-100/60 hover:text-slate-800 transition-all duration-150 cursor-pointer border-none"
            >
              <Icon size={16} strokeWidth={1.7} className="flex-shrink-0" />
              <span className="text-[13px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

    </aside>
  );
}
