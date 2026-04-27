import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const ROUTE_META = {
  "/brands":        { eyebrow: "Catalog",  title: "Brands" },
  "/models":        { eyebrow: "Catalog",  title: "Models" },
  "/trims":         { eyebrow: "Catalog",  title: "Trims" },
  "/inventory":     { eyebrow: "Catalog",  title: "Inventory" },
  "/inventory/new": { eyebrow: "Catalog",  title: "Add Vehicle" },
  "/blog/new":      { eyebrow: "Content",  title: "Compose Article" },
  "/blogs":         { eyebrow: "Content",  title: "All Articles" },
  "/customers":     { eyebrow: "Customers", title: "Submissions" },
};

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || { eyebrow: "Dashboard", title: "Admin" };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        closeSidebar={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                {meta.eyebrow}
              </p>
              <h2 className="text-base font-bold text-gray-900 leading-tight tracking-tight">
                {meta.title}
              </h2>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
              Premium Cars · Dubai
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;
