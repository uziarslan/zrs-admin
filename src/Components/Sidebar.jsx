import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const NAV_GROUPS = [
  {
    label: "Catalog",
    items: [
      { to: "/brands", label: "Brands", icon: BrandIcon },
      { to: "/models", label: "Models", icon: ModelIcon },
      { to: "/trims", label: "Trims", icon: TrimIcon },
      { to: "/inventory", label: "Inventory", icon: InventoryIcon, badge: "Hot" },
      { to: "/inventory/new", label: "Add Vehicle", icon: PlusIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/blog/new", label: "Compose", icon: PencilIcon },
      { to: "/blogs", label: "Articles", icon: ArticleIcon },
    ],
  },
  {
    label: "Customers",
    items: [{ to: "/customers", label: "Submissions", icon: UsersIcon }],
  },
];

function Sidebar({ isOpen, toggleSidebar, closeSidebar }) {
  const { logout, admin } = useContext(AuthContext);

  return (
    <>
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative w-72 h-full bg-primary-700 text-white flex flex-col transition-transform duration-300 z-50`}
      >
        {/* Subtle gradient accent */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 0% 0%, #bd925c 0%, transparent 40%), radial-gradient(circle at 100% 100%, #295860 0%, transparent 50%)",
          }}
        />

        {/* Logo */}
        <div className="relative px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <NavLink to="/brands" onClick={closeSidebar} className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-accent-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-accent group-hover:scale-105 transition-transform">
              Z
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none">ZRS Trading</h1>
              <p className="text-[10px] text-primary-200/80 mt-1 tracking-[0.2em] uppercase">Admin Portal</p>
            </div>
          </NavLink>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-4 mb-2 text-[10px] font-bold text-primary-200/60 tracking-[0.25em] uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/inventory"}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-primary-100/90 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 bg-accent-500 rounded-r-full" />
                        )}
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent-400" : "text-primary-200/80"}`} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-600 text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / user */}
        <div className="relative px-3 py-4 border-t border-white/10 space-y-2">
          {admin && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-xl">
              <div className="w-9 h-9 bg-accent-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {admin.username?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{admin.username || "Admin"}</p>
                <p className="text-[10px] text-primary-200/70 uppercase tracking-wider mt-0.5">Administrator</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-100 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---- Inline SVG icons (no emoji clutter, brand-consistent) ---- */

function BrandIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}
function ModelIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1h2.05a2.5 2.5 0 014.9 0H20a1 1 0 011 1m-8 0V9a1 1 0 011-1h3.05a2 2 0 011.789 1.106l1.057 2.114A1 1 0 0019 12h2" />
    </svg>
  );
}
function TrimIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function InventoryIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6a2 2 0 012-2h2l1 2h9a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6M9 16h6" />
    </svg>
  );
}
function PlusIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14M5 12h14" />
    </svg>
  );
}
function PencilIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function ArticleIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}
function UsersIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a3 3 0 015.356-1.857M17 8a3 3 0 11-6 0 3 3 0 016 0zM7 8a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default Sidebar;
