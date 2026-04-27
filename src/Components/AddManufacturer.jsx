import React, { useState, useEffect, useContext, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import { uploadToCloudinary } from "../services/cloudinaryUpload";
import Flash from "../Components/Flash";
import { AuthContext } from "../Context/AuthContext";
import useUploadStatus from "../hooks/useUploadStatus";

const emptyForm = {
  manufacturer: "",
  logo: null,
  logoText: "",
  currentLogo: null,
  currentLogoFilename: null,
};

const AddManufacturer = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState({});
  const [logos, setLogos] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { setIsLoading } = useContext(AuthContext);

  const fetchLogos = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/fetch-logos");
      if (response.data?.logos) setLogos(response.data.logos);
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to fetch brands" });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchLogos().finally(() => setIsLoading(false));
  }, [setIsLoading]);

  const filteredLogos = useMemo(() => {
    if (!search.trim()) return logos;
    const q = search.toLowerCase();
    return logos.filter((l) => l.brandName?.toLowerCase().includes(q));
  }, [logos, search]);

  const openCreate = () => {
    setFormData(emptyForm);
    setPreviewUrl(null);
    setEditMode(false);
    setEditId(null);
    setPanelOpen(true);
  };

  const openEdit = (logo) => {
    setFormData({
      manufacturer: logo.brandName,
      logo: null,
      logoText: "",
      currentLogo: logo.logo?.path || null,
      currentLogoFilename: logo.logo?.filename || null,
    });
    setPreviewUrl(null);
    setEditMode(true);
    setEditId(logo._id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setFormData(emptyForm);
      setPreviewUrl(null);
      setEditMode(false);
      setEditId(null);
    }, 200);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData((prev) => ({
      ...prev,
      logo: file,
      logoText: file.name,
      currentLogo: null,
      currentLogoFilename: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.manufacturer.trim()) {
      setMessage({ error: "Brand name is required" });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    let uploadedLogo = null;
    try {
      // 1) If a new file was picked, push it to Cloudinary first (with progress)
      if (formData.logo) {
        uploadedLogo = await uploadToCloudinary(formData.logo, setUploadProgress);
      }

      // 2) Then save the brand metadata
      const body = { brandName: formData.manufacturer };
      if (uploadedLogo) body.logo = uploadedLogo;

      const url = editMode
        ? `/api/v1/update-manufacturer/${editId}`
        : "/api/v1/create-manufacturer";
      const method = editMode ? "put" : "post";
      const response = await axiosInstance[method](url, body);

      if (response.status === 201 || response.status === 200) {
        setMessage(response.data || { success: editMode ? "Brand updated" : "Brand created" });
        const fresh = response.data?.manufacturer;
        if (fresh) {
          setLogos((prev) =>
            editMode
              ? prev.map((l) => (l._id === fresh._id ? { ...l, ...fresh } : l))
              : [fresh, ...prev]
          );
        } else {
          fetchLogos();
        }
        closePanel();
      }
    } catch (error) {
      console.error(error);
      // If the Cloudinary upload succeeded but the save failed, the orphan
      // gets cleaned up server-side via the controller's catch branch.
      setMessage({
        error: error.response?.data?.error || error.message || "Failed to save brand",
      });
    }
    setSubmitting(false);
    setUploadProgress(0);
  };

  const removeCurrentLogo = async () => {
    if (!editId || !formData.currentLogoFilename) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.delete("/api/v1/delete-logo", {
        params: { _id: editId, filename: formData.currentLogoFilename },
      });
      if (response.status === 200) {
        setFormData((prev) => ({
          ...prev,
          logo: null,
          logoText: "",
          currentLogo: null,
          currentLogoFilename: null,
        }));
        await fetchLogos();
      }
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to remove logo" });
    }
    setIsLoading(false);
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = logos.findIndex((l) => l._id === draggedId);
    const targetIndex = logos.findIndex((l) => l._id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLogos = [...logos];
    const [moved] = newLogos.splice(draggedIndex, 1);
    newLogos.splice(targetIndex, 0, moved);
    setLogos(newLogos);

    try {
      await axiosInstance.post("/api/v1/update-logo-order", {
        newOrder: newLogos.map((l) => l._id),
      });
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to update order" });
    }
  };

  const displayLogo = previewUrl || formData.currentLogo;

  return (
    <div className="space-y-8">
      <Flash message={message} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Catalog · Brands
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manufacturer brands</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Curate the brand line-up that appears across the storefront. Drag any card to reorder.
          </p>
        </div>

        <button onClick={openCreate} className="btn btn-primary py-3 px-5 self-start md:self-auto whitespace-nowrap">
          <span className="text-lg leading-none">+</span>
          <span>Add Brand</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
            {logos.length}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {logos.length === 1 ? "1 brand" : `${logos.length} brands`}
            </p>
          </div>
        </div>

        <div className="hidden md:block w-px h-10 bg-gray-100" />

        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands by name..."
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
      </div>

      {/* Brand grid */}
      {filteredLogos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            🏷
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {search ? "No matching brands" : "No brands yet"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {search
              ? `Nothing matches "${search}". Try a different search.`
              : "Add your first manufacturer to start building your inventory catalog."}
          </p>
          {!search && (
            <button onClick={openCreate} className="btn btn-primary">
              <span className="text-lg leading-none">+</span>
              <span>Add your first brand</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredLogos.map((logo) => (
            <BrandCard
              key={logo._id}
              logo={logo}
              isDragOver={dragOverId === logo._id}
              onDragStart={(e) => handleDragStart(e, logo._id)}
              onDragOver={(e) => handleDragOver(e, logo._id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, logo._id)}
              onEdit={() => openEdit(logo)}
              onResolved={(payload) => {
                setLogos((prev) =>
                  prev.map((l) =>
                    l._id === logo._id
                      ? { ...l, logo: payload.logo || l.logo, imageStatus: payload.imageStatus, imageError: payload.imageError }
                      : l
                  )
                );
              }}
            />
          ))}
        </div>
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed inset-0 z-50 ${panelOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!panelOpen}
      >
        {/* Backdrop */}
        <div
          onClick={closePanel}
          className={`absolute inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            panelOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-1">
                {editMode ? "Edit Brand" : "New Brand"}
              </p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {editMode ? formData.manufacturer || "Brand" : "Add a new brand"}
              </h2>
            </div>
            <button
              onClick={closePanel}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Panel form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="label">Brand Name</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))
                }
                placeholder="e.g. BMW, Mercedes-Benz, Porsche"
                className="input-base"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">
                Displayed under the logo across the storefront.
              </p>
            </div>

            <div>
              <label className="label">Brand Logo</label>

              {displayLogo ? (
                <div className="relative bg-gray-50 rounded-xl border border-gray-100 p-8 flex items-center justify-center">
                  <img
                    src={displayLogo}
                    alt="Brand logo"
                    className="max-h-32 max-w-full object-contain"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <label
                      htmlFor="logo-upload"
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Replace
                    </label>
                    {formData.currentLogo && editMode && !previewUrl && (
                      <button
                        type="button"
                        onClick={removeCurrentLogo}
                        className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-md text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3 text-xl">
                    ⬆
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Upload logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, SVG, or JPG · transparent preferred</p>
                </label>
              )}

              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                className="hidden"
              />

              {formData.logoText && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {formData.logoText}
                </p>
              )}
            </div>
          </form>

          {/* Panel footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            {submitting && formData.logo && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
                  <span>Uploading logo</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closePanel}
                disabled={submitting}
                className="btn btn-secondary flex-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.manufacturer.trim() || submitting}
              >
                {submitting
                  ? formData.logo && uploadProgress < 100
                    ? "Uploading…"
                    : "Saving…"
                  : editMode
                  ? "Save Changes"
                  : "Create Brand"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----- Brand card (with live upload polling) ----- */

const BrandCard = ({
  logo,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onEdit,
  onResolved,
}) => {
  const isPending = logo.imageStatus === "pending";
  const isFailed = logo.imageStatus === "failed";

  useUploadStatus("manufacturer", isPending ? logo._id : null, {
    enabled: isPending,
    onDone: onResolved,
    onFailed: onResolved,
  });

  return (
    <div
      draggable={!isPending}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 ${
        isDragOver
          ? "border-primary-600 shadow-brand scale-[1.02]"
          : "border-gray-100 hover:border-primary-200 hover:shadow-md"
      } ${isPending ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
    >
      {/* Drag handle */}
      {!isPending && (
        <div className="absolute top-2 left-2 z-20 w-7 h-7 rounded-md bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="6" cy="5" r="1.5" /><circle cx="6" cy="10" r="1.5" /><circle cx="6" cy="15" r="1.5" />
            <circle cx="14" cy="5" r="1.5" /><circle cx="14" cy="10" r="1.5" /><circle cx="14" cy="15" r="1.5" />
          </svg>
        </div>
      )}

      {/* Edit overlay */}
      <button
        onClick={onEdit}
        className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-md bg-primary-600 text-white text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-700"
      >
        Edit
      </button>

      {/* Status pill */}
      {isPending && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-full bg-accent-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Uploading
        </div>
      )}
      {isFailed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
          Upload failed
        </div>
      )}

      {/* Logo */}
      <div className={`h-28 flex items-center justify-center px-6 pt-6 ${isPending ? "animate-pulse" : ""}`}>
        {logo.logo?.path ? (
          <img
            src={logo.logo.path}
            alt={logo.brandName}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              isPending ? "" : "group-hover:scale-105"
            }`}
            draggable={false}
          />
        ) : isPending ? (
          <div className="w-16 h-16 rounded-lg bg-gray-100" />
        ) : (
          <div className="text-gray-300 text-3xl">—</div>
        )}
      </div>

      {/* Name */}
      <div className="px-4 py-3 border-t border-gray-50 mt-3">
        <p className="text-sm font-semibold text-gray-900 truncate text-center">
          {logo.brandName}
        </p>
      </div>
    </div>
  );
};

export default AddManufacturer;
