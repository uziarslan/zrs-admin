import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "../Components/Flash";
import { AuthContext } from "../Context/AuthContext";

const emptyForm = {
  vehicleTypeId: "",
  trimName: "",
  specifications: [""],
};

const AddTrim = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [trims, setTrims] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const { setIsLoading } = useContext(AuthContext);

  const fetchAll = async () => {
    try {
      const [mRes, vRes, tRes] = await Promise.all([
        axiosInstance.get("/api/v1/fetch-logos"),
        axiosInstance.get("/api/v1/fetch-vehicle-types"),
        axiosInstance.get("/api/v1/fetch-vehicle-trims"),
      ]);
      if (mRes.status === 200) {
        setManufacturers(
          mRes.data.logos.map((l) => ({ _id: l._id, brandName: l.brandName, logo: l.logo }))
        );
      }
      if (vRes.status === 200) setVehicleTypes(vRes.data.vehicleTypes || []);
      if (tRes.status === 200) setTrims(tRes.data.trims || []);
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to fetch data" });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAll().finally(() => setIsLoading(false));
  }, [setIsLoading]);

  // Find brand for a model — memoized so its identity is stable across renders
  const brandForModel = useCallback(
    (model) => {
      const brandId = model?.manufacturer?._id || model?.manufacturer;
      return manufacturers.find((m) => m._id === brandId);
    },
    [manufacturers]
  );

  // Group trims by model, then filter by search
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicleTypes
      .map((model) => {
        const brand = brandForModel(model);
        const modelTrims = trims.filter(
          (t) => (t.vehicleType?._id || t.vehicleType) === model._id
        );
        const filtered = q
          ? modelTrims.filter(
              (t) =>
                t.trimName?.toLowerCase().includes(q) ||
                model.modelName?.toLowerCase().includes(q) ||
                brand?.brandName?.toLowerCase().includes(q) ||
                t.specifications?.some((s) => s.toLowerCase().includes(q))
            )
          : modelTrims;
        return { model, brand, trims: filtered, total: modelTrims.length };
      })
      .filter((g) => (q ? g.trims.length > 0 : g.total > 0 || true));
  }, [vehicleTypes, trims, search, brandForModel]);

  const totalTrims = trims.length;
  const matchedCount = useMemo(
    () => grouped.reduce((sum, g) => sum + g.trims.length, 0),
    [grouped]
  );

  const openCreate = (modelId = "") => {
    setFormData({ ...emptyForm, vehicleTypeId: modelId });
    setEditMode(false);
    setEditId(null);
    setPanelOpen(true);
  };

  const openEdit = (trim) => {
    setFormData({
      vehicleTypeId: trim.vehicleType?._id || trim.vehicleType || "",
      trimName: trim.trimName || "",
      specifications: trim.specifications?.length ? [...trim.specifications] : [""],
    });
    setEditMode(true);
    setEditId(trim._id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => {
      setFormData(emptyForm);
      setEditMode(false);
      setEditId(null);
    }, 200);
  };

  const updateSpec = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.specifications];
      next[index] = value;
      return { ...prev, specifications: next };
    });
  };

  const addSpec = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, ""],
    }));
  };

  const removeSpec = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleTypeId || !formData.trimName.trim()) {
      setMessage({ error: "Model and trim name are required" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        vehicleType: formData.vehicleTypeId,
        trimName: formData.trimName.trim(),
        specifications: formData.specifications
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const url = editMode
        ? `/api/v1/update-vehicle-trim/${editId}`
        : "/api/v1/create-vehicle-trim";
      const method = editMode ? "put" : "post";
      const response = await axiosInstance[method](url, payload);

      if (response.status === 200 || response.status === 201) {
        setMessage({ success: editMode ? "Trim updated" : "Trim created" });
        await fetchAll();
        closePanel();
      }
    } catch (error) {
      console.error(error);
      setMessage({
        error: error.response?.data?.error || "Failed to save trim",
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    // Optimistic: remove immediately, revert if API fails
    const snapshot = trims;
    setTrims((prev) => prev.filter((t) => t._id !== id));
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/api/v1/delete-vehicle-trim/${id}`);
      setMessage({ success: "Trim deleted" });
    } catch (error) {
      console.error(error);
      setTrims(snapshot);
      setMessage({ error: "Failed to delete trim" });
    }
    setIsLoading(false);
  };

  const toggleCollapsed = (modelId) => {
    setCollapsed((prev) => ({ ...prev, [modelId]: !prev[modelId] }));
  };

  const selectedModel = vehicleTypes.find((vt) => vt._id === formData.vehicleTypeId);
  const selectedBrand = brandForModel(selectedModel);

  return (
    <div className="space-y-8">
      <Flash message={message} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Catalog · Trims
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Trim levels & specs</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Define the trim variants and the specifications that buyers see on each model's listing page.
          </p>
        </div>

        <button
          onClick={() => openCreate()}
          className="btn btn-primary py-3 px-5 self-start md:self-auto whitespace-nowrap"
          disabled={vehicleTypes.length === 0}
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Trim</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
            {totalTrims}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {totalTrims === 1 ? "1 trim" : `${totalTrims} trims`}
              <span className="text-gray-400 font-normal"> · {vehicleTypes.length} models</span>
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
            placeholder="Search by trim, model, brand, or spec..."
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

      {/* Empty / search states */}
      {vehicleTypes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            ⚙
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No models yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Trims attach to models. Add a model first, then come back here to define its trims.
          </p>
        </div>
      ) : search && matchedCount === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No matching trims</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Nothing matches "{search}". Try a different search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ model, brand, trims: modelTrims, total }) => {
            const isCollapsed = collapsed[model._id];
            return (
              <div
                key={model._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Model header */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50">
                  <button
                    onClick={() => toggleCollapsed(model._id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {brand?.logo?.path ? (
                        <img
                          src={brand.logo.path}
                          alt={brand.brandName}
                          className="max-w-full max-h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-gray-300 text-xl">—</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase">
                        {brand?.brandName || "Unknown brand"}
                      </p>
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {model.modelName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {total === 0
                          ? "No trims yet"
                          : total === 1
                          ? "1 trim"
                          : `${total} trims`}
                        {search && total !== modelTrims.length && ` · ${modelTrims.length} match`}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                        isCollapsed ? "" : "rotate-180"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => openCreate(model._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors whitespace-nowrap"
                  >
                    + Add Trim
                  </button>
                </div>

                {/* Trims grid */}
                {!isCollapsed && (
                  <div className="p-5">
                    {modelTrims.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">
                        No trims for {model.modelName} yet ·{" "}
                        <button
                          onClick={() => openCreate(model._id)}
                          className="text-primary-600 font-semibold hover:underline"
                        >
                          add the first one
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {modelTrims.map((trim, idx) => {
                          const specCount = trim.specifications?.length || 0;
                          const previewSpecs = trim.specifications?.slice(0, 3) || [];
                          const remaining = specCount - previewSpecs.length;
                          return (
                            <div
                              key={trim._id}
                              className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-accent-300 hover:shadow-accent transition-all overflow-hidden"
                            >
                              {/* Left accent bar */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-600 to-primary-600 opacity-60 group-hover:opacity-100 group-hover:w-1.5 transition-all" />

                              {/* Index watermark */}
                              <div className="absolute -right-2 -top-3 text-7xl font-black text-gray-100 group-hover:text-accent-50 transition-colors select-none pointer-events-none leading-none">
                                {String(idx + 1).padStart(2, "0")}
                              </div>

                              {/* Hover actions */}
                              <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                                <button
                                  onClick={() => openEdit(trim)}
                                  className="w-8 h-8 rounded-lg bg-primary-600 text-white shadow-md hover:bg-primary-700 flex items-center justify-center"
                                  title="Edit"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(trim._id, trim.trimName)}
                                  className="w-8 h-8 rounded-lg bg-white border border-red-100 text-red-600 shadow-sm hover:bg-red-50 flex items-center justify-center"
                                  title="Delete"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                  </svg>
                                </button>
                              </div>

                              {/* Content */}
                              <div className="relative px-5 py-4 pl-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase">
                                    Trim
                                  </p>
                                  <span className="badge badge-primary !py-0.5 text-[10px]">
                                    {specCount} {specCount === 1 ? "spec" : "specs"}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-gray-900 truncate pr-20 group-hover:text-primary-700 transition-colors">
                                  {trim.trimName}
                                </h4>

                                {/* Spec preview chips */}
                                {previewSpecs.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 mt-3">
                                    {previewSpecs.map((spec, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] text-gray-600 max-w-[180px] truncate"
                                        title={spec}
                                      >
                                        <span className="w-1 h-1 rounded-full bg-accent-600 shrink-0"></span>
                                        <span className="truncate">{spec}</span>
                                      </span>
                                    ))}
                                    {remaining > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-[11px] font-semibold text-primary-700">
                                        +{remaining} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic mt-3">
                                    No specifications yet
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed inset-0 z-50 ${panelOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!panelOpen}
      >
        <div
          onClick={closePanel}
          className={`absolute inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            panelOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-1">
                {editMode ? "Edit Trim" : "New Trim"}
              </p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {editMode
                  ? formData.trimName || "Trim"
                  : selectedModel
                  ? `Add to ${selectedModel.modelName}`
                  : "Add a trim"}
              </h2>
            </div>
            <button
              onClick={closePanel}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="label">Model</label>
              <select
                value={formData.vehicleTypeId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vehicleTypeId: e.target.value }))
                }
                className="input-base"
              >
                <option value="">Select a model</option>
                {vehicleTypes.map((vt) => {
                  const b = brandForModel(vt);
                  return (
                    <option key={vt._id} value={vt._id}>
                      {b?.brandName ? `${b.brandName} — ${vt.modelName}` : vt.modelName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="label">Trim Name</label>
              <input
                type="text"
                value={formData.trimName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, trimName: e.target.value }))
                }
                placeholder="e.g. Sport, Executive, M Performance"
                className="input-base"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">
                Customers see this on the listing.
              </p>
            </div>

            {selectedBrand && selectedModel && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                {selectedBrand.logo?.path && (
                  <img
                    src={selectedBrand.logo.path}
                    alt={selectedBrand.brandName}
                    className="w-10 h-10 object-contain"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase">
                    {selectedBrand.brandName}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedModel.modelName}
                  </p>
                </div>
              </div>
            )}

            {/* Specifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label !mb-0">Specifications</label>
                <span className="badge badge-primary">
                  {formData.specifications.filter((s) => s.trim()).length} added
                </span>
              </div>

              <div className="space-y-2">
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="group flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-accent-50 text-accent-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={spec}
                      onChange={(e) => updateSpec(index, e.target.value)}
                      placeholder={`Specification ${index + 1}`}
                      className="input-base !py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(index)}
                      disabled={formData.specifications.length === 1}
                      className="w-9 h-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSpec}
                className="mt-3 w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/40 transition-all"
              >
                + Add specification
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Empty rows are ignored on save. Examples: "Leather seats", "20-inch alloy wheels".
              </p>
            </div>
          </form>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={closePanel} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary flex-1"
              disabled={!formData.vehicleTypeId || !formData.trimName.trim()}
            >
              {editMode ? "Save Changes" : "Create Trim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrim;
