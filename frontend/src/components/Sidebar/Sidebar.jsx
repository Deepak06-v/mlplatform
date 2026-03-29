import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import Logo from "../../assets/Logo";

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

// ─── NEW EXPERIMENT BUTTON ────────────────────────────────────────────────────
const NEW_EXPERIMENT_PATH = "/new-experiment"; // ← EDIT: your route here

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (item) => {
    if (item.external) {
      window.open(item.path, "_blank", "noopener,noreferrer");
    } else {
      const datasetId = localStorage.getItem("dataset_id");

if (
  ["insights", "playground", "comparison"].includes(item.id)
) {
  if (!datasetId) {
    alert("Please upload a dataset first");
    navigate("/upload");
    return;
  }

  navigate(`${item.path}/${datasetId}`);
} else {
  navigate(item.path);
}
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
          onClick={() => navigate(NEW_EXPERIMENT_PATH)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white text-[13px] font-semibold rounded-[10px] shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.38)] transition-all duration-150 cursor-pointer border-none"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Experiment
        </button>
      </div>

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
