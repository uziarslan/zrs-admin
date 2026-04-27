import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import EditCar from "./EditCar";
import useUploadStatus from "../hooks/useUploadStatus";

const ITEMS_PER_PAGE = 9;

const formatAED = (value) => {
  if (!value && value !== 0) return null;
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatCompact = (value) => {
  if (!value && value !== 0) return null;
  return new Intl.NumberFormat("en-AE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
};

export default function ManageCars() {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({
    manufacturer: "",
    vehicleType: "",
    fuelType: "",
    bodyType: "",
    transmission: "",
    saleStatus: "",
  });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCar, setSelectedCar] = useState(null);

  const fetchAllCars = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/cars");
      if (response.status === 200) setCars(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllCars();
  }, []);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      manufacturer: "",
      vehicleType: "",
      fuelType: "",
      bodyType: "",
      transmission: "",
      saleStatus: "",
    });
    setSearch("");
    setCurrentPage(1);
  };

  const activeFilterEntries = Object.entries(filters).filter(([, v]) => v);
  const hasActiveFilters = activeFilterEntries.length > 0 || !!search.trim();

  // Filter + search + sort
  const filteredCars = useMemo(() => {
    let list = [...cars];

    if (filters.manufacturer)
      list = list.filter((c) => c.manufacturerId?.brandName === filters.manufacturer);
    if (filters.vehicleType)
      list = list.filter((c) => c.vehicleTypeId?.modelName === filters.vehicleType);
    if (filters.fuelType) list = list.filter((c) => c.fuelType === filters.fuelType);
    if (filters.bodyType) list = list.filter((c) => c.bodyType === filters.bodyType);
    if (filters.transmission)
      list = list.filter((c) => c.transmission === filters.transmission);
    if (filters.saleStatus)
      list = list.filter((c) => c.saleStatus === filters.saleStatus);

    if (search.trim()) {
      const words = search.toLowerCase().trim().split(/\s+/);
      list = list.filter((car) => {
        const fields = [
          car.manufacturerId?.brandName,
          car.vehicleTypeId?.modelName,
          car.trimId?.trimName,
          car.title,
          car.year?.toString(),
          car.exteriorColor,
        ].filter(Boolean).map((s) => String(s).toLowerCase());
        return words.every((w) => fields.some((f) => f.includes(w)));
      });
    }

    switch (sort) {
      case "price-high":
        list.sort((a, b) => (b.discountedPrice || b.originalPrice || 0) - (a.discountedPrice || a.originalPrice || 0));
        break;
      case "price-low":
        list.sort((a, b) => (a.discountedPrice || a.originalPrice || 0) - (b.discountedPrice || b.originalPrice || 0));
        break;
      case "year-new":
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "year-old":
        list.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case "newest":
      default:
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [cars, filters, search, sort]);

  const totalItems = filteredCars.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const indexFirst = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCars = filteredCars.slice(indexFirst, indexFirst + ITEMS_PER_PAGE);

  // Stats
  const stats = useMemo(() => {
    const total = cars.length;
    const forSale = cars.filter((c) => c.saleStatus === "for-sale").length;
    const sold = cars.filter((c) => c.saleStatus === "sold").length;
    const featured = cars.filter((c) => c.featured === "yes").length;
    const inventoryValue = cars.reduce(
      (sum, c) => sum + Number(c.discountedPrice || c.originalPrice || 0),
      0
    );
    return { total, forSale, sold, featured, inventoryValue };
  }, [cars]);

  const goToPage = (n) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedCar) {
    return (
      <EditCar
        car={selectedCar}
        onClose={() => setSelectedCar(null)}
        onUpdate={() => {
          setSelectedCar(null);
          fetchAllCars();
        }}
        onDelete={(id) => {
          // Optimistic remove from inventory list
          setCars((prev) => prev.filter((c) => c._id !== id));
          setSelectedCar(null);
        }}
      />
    );
  }

  // Unique values for filters
  const uniq = (key, accessor) => {
    const set = new Set(cars.map(accessor).filter(Boolean));
    return Array.from(set);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Catalog · Inventory
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Premium inventory</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Every vehicle currently listed on the storefront. Click any card to edit its details.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} accent="primary" />
        <StatCard label="Available" value={stats.forSale} accent="primary" subtle />
        <StatCard label="Sold" value={stats.sold} accent="ink" subtle />
        <StatCard
          label="Inventory Value"
          value={formatCompact(stats.inventoryValue) || "—"}
          accent="accent"
          prefix="AED"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by brand, model, trim, title, year, or color..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="price-high">Price: high to low</option>
              <option value="price-low">Price: low to high</option>
              <option value="year-new">Year: newest</option>
              <option value="year-old">Year: oldest</option>
            </select>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* View toggle */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === "grid" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" />
                <rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === "list" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="3" y="4" width="14" height="3" rx="0.5" />
                <rect x="3" y="9" width="14" height="3" rx="0.5" />
                <rect x="3" y="14" width="14" height="3" rx="0.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            label="Brand"
            value={filters.manufacturer}
            options={uniq("brand", (c) => c.manufacturerId?.brandName)}
            onChange={(v) => setFilter("manufacturer", v)}
          />
          <FilterDropdown
            label="Model"
            value={filters.vehicleType}
            options={uniq("model", (c) => c.vehicleTypeId?.modelName)}
            onChange={(v) => setFilter("vehicleType", v)}
          />
          <FilterDropdown
            label="Body"
            value={filters.bodyType}
            options={uniq("body", (c) => c.bodyType)}
            onChange={(v) => setFilter("bodyType", v)}
          />
          <FilterDropdown
            label="Fuel"
            value={filters.fuelType}
            options={uniq("fuel", (c) => c.fuelType)}
            onChange={(v) => setFilter("fuelType", v)}
          />
          <FilterDropdown
            label="Transmission"
            value={filters.transmission}
            options={uniq("trans", (c) => c.transmission)}
            onChange={(v) => setFilter("transmission", v)}
          />
          <FilterDropdown
            label="Status"
            value={filters.saleStatus}
            options={["for-sale", "sold"]}
            onChange={(v) => setFilter("saleStatus", v)}
            displayValue={(v) => (v === "for-sale" ? "For Sale" : v === "sold" ? "Sold" : v)}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results meta */}
      {cars.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Showing <span className="font-semibold text-gray-900">{Math.min(indexFirst + 1, totalItems)}-{Math.min(indexFirst + ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-semibold text-gray-900">{totalItems}</span>
            {hasActiveFilters && totalItems !== cars.length && (
              <span className="text-gray-400"> · {cars.length - totalItems} filtered out</span>
            )}
          </p>
        </div>
      )}

      {/* Listings */}
      {currentCars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            🚗
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {hasActiveFilters ? "No vehicles match these filters" : "No vehicles in inventory"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting or clearing the filters to see more results."
              : "Once you add a vehicle, it'll appear here for management."}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-primary">
              Clear filters
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentCars.map((car) => (
            <CarCard key={car._id} car={car} onEdit={() => setSelectedCar(car)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {currentCars.map((car) => (
            <CarRow key={car._id} car={car} onEdit={() => setSelectedCar(car)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination current={currentPage} total={totalPages} onChange={goToPage} />
      )}
    </div>
  );
}

/* ----- Sub-components ----- */

const StatCard = ({ label, value, accent, prefix, subtle }) => {
  const accentMap = {
    primary: subtle ? "bg-white border-gray-100" : "bg-primary-600 text-white border-primary-600",
    accent: "bg-accent-600 text-white border-accent-600",
    ink: "bg-white border-gray-100",
  };
  const labelColor = accent === "primary" && !subtle
    ? "text-primary-200"
    : accent === "accent"
    ? "text-accent-100"
    : "text-gray-400";
  const valueColor = (accent === "primary" && !subtle) || accent === "accent" ? "text-white" : "text-gray-900";

  return (
    <div className={`rounded-2xl border p-4 ${accentMap[accent]}`}>
      <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${labelColor}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${valueColor}`}>
        {prefix && <span className="text-sm font-semibold opacity-70 mr-1">{prefix}</span>}
        {value}
      </p>
    </div>
  );
};

const FilterDropdown = ({ label, value, options, onChange, displayValue = (v) => v }) => {
  const isActive = !!value;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-9 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-100 ${
          isActive
            ? "bg-primary-50 text-primary-700 border-primary-200"
            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300"
        }`}
      >
        <option value="">{label} · All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {label} · {displayValue(opt)}
          </option>
        ))}
      </select>
      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-current pointer-events-none opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};

const CarCard = ({ car: initialCar, onEdit }) => {
  const [car, setCar] = useState(initialCar);
  useEffect(() => setCar(initialCar), [initialCar]);

  const isPending = car.imageStatus === "pending";
  const isFailed = car.imageStatus === "failed";

  useUploadStatus("car", isPending ? car._id : null, {
    enabled: isPending,
    onDone: (payload) =>
      setCar((prev) => ({
        ...prev,
        images: payload.images || prev.images,
        imageStatus: payload.imageStatus,
        imageError: payload.imageError,
      })),
    onFailed: (payload) =>
      setCar((prev) => ({ ...prev, imageStatus: payload.imageStatus, imageError: payload.imageError })),
  });

  const finalPrice = car.discountedPrice || car.originalPrice;
  const hasDiscount = car.discountedPrice && car.originalPrice && Number(car.discountedPrice) < Number(car.originalPrice);
  const isSold = car.saleStatus === "sold";
  const isFeatured = car.featured === "yes";
  const monthly = finalPrice ? Math.round(Number(finalPrice) / 12) : null;

  return (
    <div
      onClick={onEdit}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary-300 hover:shadow-brand transition-all cursor-pointer"
    >
      {/* Image */}
      <div className={`relative aspect-[4/3] bg-gray-50 overflow-hidden ${isPending ? "animate-pulse" : ""}`}>
        {car.images?.[0]?.path ? (
          <img
            src={car.images[0].path}
            alt={car.title || car.vehicleTypeId?.modelName}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isSold ? "grayscale-[40%]" : ""}`}
          />
        ) : isPending ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🚗</div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {isPending && (
            <span className="px-2.5 py-1 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Uploading
            </span>
          )}
          {isFailed && (
            <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md">
              Upload failed
            </span>
          )}
          {isFeatured && !isPending && (
            <span className="px-2.5 py-1 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md">
              Featured
            </span>
          )}
          {isSold && (
            <span className="px-2.5 py-1 rounded-md bg-ink-900 text-white text-[10px] font-bold tracking-widest uppercase shadow-md">
              Sold
            </span>
          )}
        </div>

        {/* Edit button (top-right, hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-md bg-white text-primary-700 text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 hover:bg-primary-600 hover:text-white transition-all"
        >
          Edit ✎
        </button>

        {/* Brand logo (bottom-left of image) */}
        {car.manufacturerId?.logo?.path && (
          <div className="absolute bottom-3 left-3 z-10 w-11 h-11 rounded-xl bg-white/95 backdrop-blur shadow-md flex items-center justify-center p-1.5">
            <img src={car.manufacturerId.logo.path} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        )}

        {/* Image count */}
        {car.images?.length > 1 && (
          <span className="absolute bottom-3 right-3 z-10 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
            {car.images.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase truncate">
              {car.manufacturerId?.brandName || "—"}
            </p>
            <h3 className="text-base font-bold text-gray-900 leading-tight tracking-tight truncate">
              {car.vehicleTypeId?.modelName} {car.trimId?.trimName}
            </h3>
            {car.title && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{car.title}</p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between border-t border-gray-50 pt-4">
          <div>
            <p className={`text-xl font-bold tracking-tight ${isSold ? "text-gray-400 line-through" : "text-primary-700"}`}>
              {finalPrice ? formatAED(finalPrice) : "—"}
            </p>
            {hasDiscount && (
              <p className="text-[11px] text-gray-400 line-through">
                {formatAED(car.originalPrice)}
              </p>
            )}
            {monthly && !isSold && (
              <p className="text-[11px] text-gray-500 mt-0.5">
                or {formatAED(monthly)}/mo
              </p>
            )}
          </div>
        </div>

        {/* Spec pills */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-50">
          {car.year && (
            <SpecPill icon="📅" value={car.year} />
          )}
          {car.mileage && (
            <SpecPill icon="🛣" value={car.mileage} />
          )}
          {car.fuelType && (
            <SpecPill icon="⛽" value={car.fuelType} />
          )}
          {car.transmission && (
            <SpecPill icon="⚙" value={car.transmission} />
          )}
          {car.exteriorColor && (
            <SpecPill icon="🎨" value={car.exteriorColor} />
          )}
        </div>
      </div>
    </div>
  );
};

const SpecPill = ({ icon, value }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-[11px] text-gray-700 max-w-[140px] truncate">
    <span className="opacity-70">{icon}</span>
    <span className="truncate capitalize">{value}</span>
  </span>
);

const CarRow = ({ car, onEdit }) => {
  const finalPrice = car.discountedPrice || car.originalPrice;
  const isSold = car.saleStatus === "sold";
  const isFeatured = car.featured === "yes";

  return (
    <div
      onClick={onEdit}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image */}
        <div className="relative w-full sm:w-48 h-40 sm:h-32 bg-gray-50 shrink-0">
          {car.images?.[0]?.path ? (
            <img
              src={car.images[0].path}
              alt=""
              className={`w-full h-full object-cover ${isSold ? "grayscale-[40%]" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🚗</div>
          )}
          {isFeatured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-widest uppercase">
              Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 sm:py-4 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {car.manufacturerId?.logo?.path && (
                <img src={car.manufacturerId.logo.path} alt="" className="w-5 h-5 object-contain" />
              )}
              <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase truncate">
                {car.manufacturerId?.brandName}
              </p>
              {isSold && (
                <span className="px-1.5 py-0.5 rounded bg-gray-900 text-white text-[9px] font-bold tracking-wider uppercase">Sold</span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {car.vehicleTypeId?.modelName} {car.trimId?.trimName}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {car.year && <SpecPill icon="📅" value={car.year} />}
              {car.mileage && <SpecPill icon="🛣" value={car.mileage} />}
              {car.fuelType && <SpecPill icon="⛽" value={car.fuelType} />}
              {car.transmission && <SpecPill icon="⚙" value={car.transmission} />}
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className={`text-lg font-bold tracking-tight ${isSold ? "text-gray-400 line-through" : "text-primary-700"}`}>
              {finalPrice ? formatAED(finalPrice) : "—"}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 mt-1 inline-flex items-center gap-1"
            >
              Edit listing →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="flex items-center justify-center gap-1 pt-4">
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
              p === current
                ? "bg-primary-600 text-white shadow-brand"
                : "text-gray-600 hover:bg-gray-100"
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
