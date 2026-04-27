import React, { useState, useEffect, useContext, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import { AuthContext } from "../Context/AuthContext";

const ITEMS_PER_PAGE = 10;

const TABS = [
  { id: "sellCar", label: "Sell requests", short: "Sell", icon: "💰", description: "Customers offering their vehicle" },
  { id: "buyNow", label: "Buy now", short: "Buy", icon: "🛒", description: "Direct purchase inquiries" },
  { id: "testDrive", label: "Test drives", short: "Test", icon: "🏁", description: "Booked test-drive sessions" },
  { id: "finance", label: "Finance", short: "Finance", icon: "📊", description: "Finance eligibility submissions" },
  { id: "contactUs", label: "Contact", short: "Contact", icon: "✉", description: "General messages and queries" },
];

const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
};

const formatRelative = (timestamp) => {
  if (!timestamp) return "—";
  const diff = Date.now() - new Date(timestamp).getTime();
  const day = 1000 * 60 * 60 * 24;
  if (diff < 1000 * 60) return "Just now";
  if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
  if (diff < day) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)}d ago`;
  return formatDate(timestamp);
};

const initialsOf = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || parts[0]?.[0]?.toUpperCase() || "?";
};

const avatarPalette = [
  "bg-primary-50 text-primary-700",
  "bg-accent-50 text-accent-800",
  "bg-emerald-50 text-emerald-700",
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
  "bg-rose-50 text-rose-700",
];

const colorFor = (str) => {
  const s = String(str || "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return avatarPalette[hash % avatarPalette.length];
};

const Users = () => {
  const { setIsLoading } = useContext(AuthContext);
  const [data, setData] = useState({
    finance: [],
    sellCar: [],
    contactUs: [],
    testDrive: [],
    buyNow: [],
  });
  const [activeTab, setActiveTab] = useState("sellCar");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [f, s, c, t, b] = await Promise.all([
          axiosInstance.get("/api/v1/finance-eligibility"),
          axiosInstance.get("/api/v1/sell-car"),
          axiosInstance.get("/api/v1/contact-us"),
          axiosInstance.get("/api/v1/test-drives"),
          axiosInstance.get("/api/v1/buy-car"),
        ]);
        setData({
          finance: f.data?.data || f.data || [],
          sellCar: s.data?.data || s.data || [],
          contactUs: c.data?.data || c.data || [],
          testDrive: t.data?.data || t.data || [],
          buyNow: b.data?.data || b.data || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const totalAcrossTabs = useMemo(
    () => Object.values(data).reduce((sum, arr) => sum + arr.length, 0),
    [data]
  );

  const filteredItems = useMemo(() => {
    const list = data[activeTab] || [];
    let result = [...list];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const haystack = [
          item.fullName,
          item.firstName,
          item.lastName,
          item.email,
          item.phone,
          item.phoneNumber,
          item.message,
          item.query,
          item.description,
          item.carId?.manufacturerId?.brandName,
          item.carId?.vehicleTypeId?.modelName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    result.sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return sort === "newest" ? bd - ad : ad - bd;
    });

    return result;
  }, [data, activeTab, search, sort]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const indexFirst = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredItems.slice(indexFirst, indexFirst + ITEMS_PER_PAGE);

  const handlePageChange = (n) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
  };

  const todayCount = useMemo(() => {
    const list = data[activeTab] || [];
    const oneDay = 1000 * 60 * 60 * 24;
    return list.filter((item) => Date.now() - new Date(item.createdAt || 0).getTime() < oneDay).length;
  }, [data, activeTab]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
          Customers · Submissions
        </p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customer inquiries</h1>
        <p className="text-gray-500 mt-2 max-w-xl">
          Every lead, request, and message from the storefront in one feed. Click any row for the full details.
        </p>
      </div>

      {/* Tab strip with counts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map((tab) => {
            const count = data[tab.id]?.length || 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-600 text-white shadow-brand"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={`text-lg ${isActive ? "" : "opacity-70 group-hover:opacity-100"}`}>{tab.icon}</span>
                <div className="text-left">
                  <p className={`text-sm font-bold tracking-tight leading-none ${isActive ? "text-white" : "text-gray-900"}`}>
                    {tab.label}
                  </p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold mt-1 ${isActive ? "text-primary-200" : "text-gray-400"}`}>
                    {count} {count === 1 ? "entry" : "entries"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats summary for active tab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Total" value={(data[activeTab] || []).length} subtle />
        <StatTile label="Today" value={todayCount} accent="primary" />
        <StatTile label="All Submissions" value={totalAcrossTabs} subtle />
        <StatTile label="Active Channel" value={TABS.find((t) => t.id === activeTab)?.short} subtle />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or message..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm">
              Clear
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* List */}
      {pageItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            👥
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {search ? "No matching submissions" : "No entries yet"}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {search
              ? `Nothing matches "${search}". Try a different search.`
              : "Customer submissions to this channel will show up here as they come in."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pageItems.map((item) => (
            <SubmissionRow
              key={item._id}
              item={item}
              tab={activeTab}
              onClick={() => setSelected({ item, tab: activeTab })}
            />
          ))}
        </div>
      )}

      {/* Results meta + pagination */}
      {filteredItems.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{indexFirst + 1}-{Math.min(indexFirst + ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="font-semibold text-gray-900">{filteredItems.length}</span>
          </p>
          {totalPages > 1 && (
            <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
          )}
        </div>
      )}

      {/* Detail drawer */}
      <DetailDrawer
        open={!!selected}
        item={selected?.item}
        tab={selected?.tab}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

/* ----- Submission row ----- */

const SubmissionRow = ({ item, tab, onClick }) => {
  const fullName = item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Unnamed";
  const phone = item.phone || item.phoneNumber || "";
  const email = item.email || "";
  const car = item.carId
    ? `${item.carId.manufacturerId?.brandName || ""} ${item.carId.vehicleTypeId?.modelName || ""}`.trim()
    : null;
  const detail = item.message || item.query || item.description || (tab === "testDrive" && item.date ? new Date(item.date).toLocaleString() : null);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colorFor(fullName)}`}>
          {initialsOf(fullName)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
              {fullName}
            </h3>
            {tab === "testDrive" && item.date && (
              <span className="badge badge-primary text-[10px]">📅 {new Date(item.date).toLocaleDateString()}</span>
            )}
            {tab === "sellCar" && item.images?.length > 0 && (
              <span className="badge badge-accent text-[10px]">📷 {item.images.length}</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
            {email && (
              <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{email}</span>
              </span>
            )}
            {phone && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {phone}
              </span>
            )}
          </div>

          {car && (
            <p className="text-xs text-primary-700 font-semibold mt-1 truncate">🚗 {car}</p>
          )}
          {detail && !car && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{detail}</p>
          )}
        </div>

        {/* Right side: time + quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-700">{formatRelative(item.createdAt)}</p>
            <p className="text-[10px] text-gray-400">{formatDate(item.createdAt)}</p>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {email && (
              <a
                href={`mailto:${email}`}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 flex items-center justify-center"
                title={`Email ${email}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-lg bg-accent-50 text-accent-800 hover:bg-accent-100 flex items-center justify-center"
                title={`Call ${phone}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----- Stat tile ----- */

const StatTile = ({ label, value, accent, subtle }) => {
  const isPrimary = accent === "primary" && !subtle;
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isPrimary ? "bg-primary-600 border-primary-600 text-white" : "bg-white border-gray-100"
      }`}
    >
      <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isPrimary ? "text-primary-200" : "text-gray-400"}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${isPrimary ? "text-white" : "text-gray-900"}`}>{value}</p>
    </div>
  );
};

/* ----- Detail drawer ----- */

const DetailDrawer = ({ open, item, tab, onClose }) => {
  const fullName = item ? (item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Unnamed") : "";
  const phone = item?.phone || item?.phoneNumber || "";
  const email = item?.email || "";

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {item && (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${colorFor(fullName)}`}>
                  {initialsOf(fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase">
                    {TABS.find((t) => t.id === tab)?.label || "Submission"}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight truncate">{fullName}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick actions */}
            <div className="px-6 py-4 grid grid-cols-2 gap-2 border-b border-gray-50">
              {email ? (
                <a href={`mailto:${email}`} className="btn btn-primary text-xs py-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </a>
              ) : (
                <span className="btn btn-secondary text-xs py-2.5 opacity-50 cursor-not-allowed">No email</span>
              )}
              {phone ? (
                <a href={`tel:${phone}`} className="btn btn-accent text-xs py-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
              ) : (
                <span className="btn btn-secondary text-xs py-2.5 opacity-50 cursor-not-allowed">No phone</span>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <DetailField label="Email">
                {email ? (
                  <a href={`mailto:${email}`} className="text-primary-700 font-semibold hover:underline break-all">
                    {email}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </DetailField>

              <DetailField label="Phone">
                {phone ? (
                  <a href={`tel:${phone}`} className="text-primary-700 font-semibold hover:underline">
                    {phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </DetailField>

              {item.carId && (
                <DetailField label="Vehicle of Interest">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {item.carId.images?.[0]?.path && (
                      <img src={item.carId.images[0].path} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {item.carId.manufacturerId?.brandName} {item.carId.vehicleTypeId?.modelName}
                      </p>
                      {item.carId.trimId?.trimName && (
                        <p className="text-xs text-gray-500 truncate">{item.carId.trimId.trimName}</p>
                      )}
                    </div>
                  </div>
                </DetailField>
              )}

              {tab === "testDrive" && item.date && (
                <DetailField label="Test Drive Date">
                  <p className="text-sm font-semibold text-gray-900">{new Date(item.date).toLocaleString()}</p>
                </DetailField>
              )}

              {(item.message || item.query || item.description) && (
                <DetailField label="Message">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {item.message || item.query || item.description}
                  </p>
                </DetailField>
              )}

              {item.images?.length > 0 && (
                <DetailField label={`Photos (${item.images.length})`}>
                  <div className="grid grid-cols-3 gap-2">
                    {item.images.map((img, i) => (
                      <a
                        key={i}
                        href={img.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-gray-100 hover:border-primary-400 transition-all"
                      >
                        <img src={img.path} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </DetailField>
              )}

              <DetailField label="Submitted">
                <p className="text-sm font-semibold text-gray-900">
                  {formatRelative(item.createdAt)}
                  <span className="ml-2 text-xs font-normal text-gray-400">{formatDate(item.createdAt)}</span>
                </p>
              </DetailField>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DetailField = ({ label, children }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-1.5">{label}</p>
    {children}
  </div>
);

/* ----- Pagination ----- */

const Pagination = ({ current, total, onChange }) => {
  const buildPages = () => {
    const pages = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("…");
    if (total > 1) pages.push(total);
    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>
      {buildPages().map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
              p === current ? "bg-primary-600 text-white shadow-brand" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  );
};

export default Users;
