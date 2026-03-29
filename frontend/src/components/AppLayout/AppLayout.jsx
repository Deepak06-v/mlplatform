// src/components/AppLayout/AppLayout.jsx
// This wraps every page: sidebar on the left, page content on the right.
import React from "react";
import Sidebar from "../Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* ml-[220px] must match the sidebar w-[220px] */}
      <main className="ml-[220px] flex-1 bg-white p-8">
        {children}
      </main>
    </div>
  );
}
