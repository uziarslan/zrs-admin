import React, { useState, useEffect, useContext, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "../Components/Flash";
import { AuthContext } from "../Context/AuthContext";

const emptyForm = {
  manufacturerId: "",
  modelName: "",
};

const AddVehicleType = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
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
      const [mRes, vRes] = await Promise.all([
        axiosInstance.get("/api/v1/fetch-logos"),
        axiosInstance.get("/api/v1/fetch-vehicle-types"),
      ]);
      if (mRes.status === 200) {
        setManufacturers(
          mRes.data.logos.map((l) => ({ _id: l._id, brandName: l.brandName, logo: l.logo }))
        );
      }
      if (vRes.status === 200) {
        setVehicleTypes(vRes.data.vehicleTypes || []);
      }
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to fetch data" });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAll().finally(() => setIsLoading(false));
  }, [setIsLoading]);

  // Group models under each brand, then filter by search
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return manufacturers
      .map((m) => {
        const models = vehicleTypes.filter(
          (vt) => (vt.manufacturer?._id || vt.manufacturer) === m._id
        );
        const filtered = q
          ? models.filter(
              (vt) =>
                vt.modelName?.toLowerCase().includes(q) ||
                m.brandName?.toLowerCase().includes(q)
            )
          : models;
        return { brand: m, models: filtered, total: models.length };
      })
      .filter((g) => (q ? g.models.length > 0 : true));
  }, [manufacturers, vehicleTypes, search]);

  const totalModels = vehicleTypes.length;
  const matchedCount = useMemo(
    () => grouped.reduce((sum, g) => sum + g.models.length, 0),
    [grouped]
  );

  const openCreate = (brandId = "") => {
    setFormData({ ...emptyForm, manufacturerId: brandId });
    setEditMode(false);
    setEditId(null);
    setPanelOpen(true);
  };

  const openEdit = (vt) => {
    setFormData({
      manufacturerId: vt.manufacturer?._id || vt.manufacturer || "",
      modelName: vt.modelName || "",
    });
    setEditMode(true);
    setEditId(vt._id);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.manufacturerId || !formData.modelName.trim()) {
      setMessage({ error: "Brand and model name are required" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        manufacturer: formData.manufacturerId,
        modelName: formData.modelName.trim(),
      };
      const url = editMode
        ? `/api/v1/update-vehicle-type/${editId}`
        : "/api/v1/create-vehicle-type";
      const method = editMode ? "put" : "post";
      const response = await axiosInstance[method](url, payload);

      if (response.status === 200 || response.status === 201) {
        setMessage({ success: editMode ? "Model updated" : "Model created" });
        await fetchAll();
        closePanel();
      }
    } catch (error) {
      console.error(error);
      setMessage({
        error: error.response?.data?.error || "Failed to save model",
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    // Optimistic: remove immediately, revert if API fails
    const snapshot = vehicleTypes;
    setVehicleTypes((prev) => prev.filter((vt) => vt._id !== id));
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/api/v1/delete-vehicle-type/${id}`);
      setMessage({ success: "Model deleted" });
    } catch (error) {
      console.error(error);
      setVehicleTypes(snapshot);
      setMessage({ error: "Failed to delete model" });
    }
    setIsLoading(false);
  };

  const toggleCollapsed = (brandId) => {
    setCollapsed((prev) => ({ ...prev, [brandId]: !prev[brandId] }));
  };

  const selectedBrand = manufacturers.find((m) => m._id === formData.manufacturerId);

  return (
    <div className="space-y-8">
      <Flash message={message} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Catalog · Models
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Vehicle models</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Organize the models available under each manufacturer. Customers filter the storefront by these.
          </p>
        </div>

        <button
          onClick={() => openCreate()}
          className="btn btn-primary py-3 px-5 self-start md:self-auto whitespace-nowrap"
          disabled={manufacturers.length === 0}
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Model</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
            {totalModels}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {totalModels === 1 ? "1 model" : `${totalModels} models`}
              <span className="text-gray-400 font-normal"> · {manufacturers.length} brands</span>
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
            placeholder="Search by brand or model name..."
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

      {/* Brand groups */}
      {manufacturers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            🚘
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No brands yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            You need at least one brand before adding models. Head over to the Brands tab first.
          </p>
        </div>
      ) : search && matchedCount === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No matching models</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Nothing matches "{search}". Try a different search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ brand, models, total }) => {
            const isCollapsed = collapsed[brand._id];
            return (
              <div
                key={brand._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Brand header */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50">
                  <button
                    onClick={() => toggleCollapsed(brand._id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {brand.logo?.path ? (
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
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {brand.brandName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {total === 0
                          ? "No models yet"
                          : total === 1
                          ? "1 model"
                          : `${total} models`}
                        {search && total !== models.length && ` · ${models.length} match`}
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
                    onClick={() => openCreate(brand._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors whitespace-nowrap"
                  >
                    + Add to {brand.brandName}
                  </button>
                </div>

                {/* Models grid */}
                {!isCollapsed && (
                  <div className="p-5">
                    {models.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">
                        No models for {brand.brandName} yet ·{" "}
                        <button
                          onClick={() => openCreate(brand._id)}
                          className="text-primary-600 font-semibold hover:underline"
                        >
                          add the first one
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {models.map((vt, idx) => (
                          <div
                            key={vt._id}
                            className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-brand transition-all overflow-hidden"
                          >
                            {/* Left accent bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-600 to-accent-600 opacity-60 group-hover:opacity-100 group-hover:w-1.5 transition-all" />

                            {/* Index number watermark */}
                            <div className="absolute -right-2 -top-3 text-7xl font-black text-gray-100 group-hover:text-primary-50 transition-colors select-none pointer-events-none leading-none">
                              {String(idx + 1).padStart(2, "0")}
                            </div>

                            {/* Hover actions */}
                            <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                              <button
                                onClick={() => openEdit(vt)}
                                className="w-8 h-8 rounded-lg bg-primary-600 text-white shadow-md hover:bg-primary-700 flex items-center justify-center"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(vt._id, vt.modelName)}
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
                              <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-1">
                                Model
                              </p>
                              <h4 className="text-base font-bold text-gray-900 truncate pr-20 group-hover:text-primary-700 transition-colors">
                                {vt.modelName}
                              </h4>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                                  {brand.brandName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
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
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-1">
                {editMode ? "Edit Model" : "New Model"}
              </p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {editMode
                  ? formData.modelName || "Model"
                  : selectedBrand
                  ? `Add to ${selectedBrand.brandName}`
                  : "Add a model"}
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
              <label className="label">Brand</label>
              <select
                value={formData.manufacturerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manufacturerId: e.target.value }))
                }
                className="input-base"
              >
                <option value="">Select a brand</option>
                {manufacturers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.brandName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                The manufacturer this model belongs to.
              </p>
            </div>

            <div>
              <label className="label">Model Name</label>
              <input
                type="text"
                value={formData.modelName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, modelName: e.target.value }))
                }
                placeholder="e.g. 3 Series, A4, C-Class"
                className="input-base"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">
                Use the manufacturer's official naming for consistency.
              </p>
            </div>

            {selectedBrand && selectedBrand.logo?.path && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <img
                  src={selectedBrand.logo.path}
                  alt={selectedBrand.brandName}
                  className="w-10 h-10 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Brand
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedBrand.brandName}
                  </p>
                </div>
              </div>
            )}
          </form>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={closePanel} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary flex-1"
              disabled={!formData.manufacturerId || !formData.modelName.trim()}
            >
              {editMode ? "Save Changes" : "Create Model"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleType;
