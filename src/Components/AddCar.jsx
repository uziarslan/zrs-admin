import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import axiosInstance from "../services/axiosInstance";
import { uploadManyToCloudinary } from "../services/cloudinaryUpload";
import Flash from "./Flash";
import { AuthContext } from "../Context/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const initialForm = {
  manufacturerId: "",
  vehicleTypeId: "",
  trimId: "",
  title: "",
  originalPrice: "",
  fuelType: "gasoline",
  mileage: "",
  year: "",
  exteriorColor: "",
  warranty: "Available",
  door: "",
  origin: "gcc",
  transmission: "manual",
  bodyType: "sedan",
  engine: "",
  testDrive: "yes",
  featured: "no",
  saleStatus: "for-sale",
  discountedPrice: "",
  servicePackage: "Available",
  specifications: {},
  description: "",
  images: [],
};

const SECTIONS = [
  { id: "identity", label: "Vehicle", hint: "Brand · Model · Trim" },
  { id: "pricing", label: "Pricing", hint: "Price · Status" },
  { id: "specs", label: "Specifications", hint: "Engine · Body · Color" },
  { id: "inclusions", label: "Inclusions", hint: "Warranty · Service" },
  { id: "trimSpecs", label: "Trim Specs", hint: "Equipment list" },
  { id: "description", label: "Description", hint: "Sales copy" },
  { id: "media", label: "Media", hint: "Photos & gallery" },
];

const formatCurrency = (value) => {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const AddCar = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [allTrims, setAllTrims] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [activeSection, setActiveSection] = useState("identity");
  const [dragIndex, setDragIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageProgress, setImageProgress] = useState({}); // { [index]: percent }
  const sectionRefs = useRef({});
  const { setIsLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [m, v, t] = await Promise.all([
          axiosInstance.get("/api/v1/fetch-logos"),
          axiosInstance.get("/api/v1/fetch-vehicle-types"),
          axiosInstance.get("/api/v1/fetch-vehicle-trims"),
        ]);
        setManufacturers(m.data.logos || []);
        setVehicleTypes(v.data.vehicleTypes || []);
        setAllTrims(t.data.trims || []);
      } catch (error) {
        setMessage({ error: "Failed to fetch reference data" });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [setIsLoading]);

  // Sync trim specs when trim changes
  useEffect(() => {
    if (formData.trimId) {
      const selectedTrim = allTrims.find((t) => t._id === formData.trimId);
      if (selectedTrim) {
        const initialSpecs = {};
        selectedTrim.specifications.forEach((spec) => {
          initialSpecs[spec] = true;
        });
        setFormData((prev) => ({ ...prev, specifications: initialSpecs }));
      }
    }
  }, [formData.trimId, allTrims]);

  const filteredModels = useMemo(
    () =>
      vehicleTypes.filter(
        (vt) =>
          (vt.manufacturer?._id || vt.manufacturer) === formData.manufacturerId
      ),
    [vehicleTypes, formData.manufacturerId]
  );

  const filteredTrims = useMemo(
    () =>
      allTrims.filter(
        (t) => (t.vehicleType?._id || t.vehicleType) === formData.vehicleTypeId
      ),
    [allTrims, formData.vehicleTypeId]
  );

  const selectedBrand = manufacturers.find((m) => m._id === formData.manufacturerId);
  const selectedModel = vehicleTypes.find((vt) => vt._id === formData.vehicleTypeId);
  const selectedTrim = allTrims.find((t) => t._id === formData.trimId);

  // Progress calculation — only counts sections that are actually visible
  const completion = useMemo(() => {
    const trimSpecsVisible = !!(selectedTrim && selectedTrim.specifications?.length);
    const checks = {
      identity: !!(formData.manufacturerId && formData.vehicleTypeId && formData.trimId && formData.year),
      pricing: !!formData.originalPrice,
      specs: !!(formData.mileage && formData.engine && formData.exteriorColor),
      inclusions: true,
      trimSpecs: trimSpecsVisible
        ? Object.values(formData.specifications).some(Boolean)
        : null,
      description: !!formData.description?.replace(/<[^>]*>/g, "").trim(),
      media: previewImages.length > 0,
    };
    const visibleEntries = Object.entries(checks).filter(([, v]) => v !== null);
    const done = visibleEntries.filter(([, v]) => v).length;
    return { checks, done, total: visibleEntries.length };
  }, [formData, previewImages, selectedTrim]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "manufacturerId" && { vehicleTypeId: "", trimId: "", specifications: {} }),
      ...(name === "vehicleTypeId" && { trimId: "", specifications: {} }),
    }));
  };

  const handleSpecChange = (spec, checked) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [spec]: checked },
    }));
  };

  const handleImageUpload = (e) => {
    const files = e.type === "change" ? e.target.files : e.dataTransfer.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const MAX_SIZE = 10 * 1024 * 1024;

    const newPreviews = [];
    const allFiles = [];
    const newErrors = {};
    const startIndex = previewImages.length;

    fileArray.forEach((file, i) => {
      newPreviews.push(URL.createObjectURL(file));
      allFiles.push(file);
      if (file.size > MAX_SIZE) {
        newErrors[startIndex + i] = "File exceeds 10MB limit";
      }
    });

    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...allFiles] }));
    setImageErrors((prev) => ({ ...prev, ...newErrors }));

    if (Object.keys(newErrors).length > 0) {
      setMessage({ error: `${Object.keys(newErrors).length} file(s) exceed the 10MB limit` });
    }
  };

  const removeImage = (idx) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
    setImageErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleImgDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.setData("text/plain", idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleImgDragOver = (e) => e.preventDefault();

  const handleImgDrop = (e, dropIdx) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIdx) return;
    const newPreviews = [...previewImages];
    const newImages = [...formData.images];
    const [movedPreview] = newPreviews.splice(dragIndex, 1);
    const [movedImage] = newImages.splice(dragIndex, 1);
    newPreviews.splice(dropIdx, 0, movedPreview);
    newImages.splice(dropIdx, 0, movedImage);
    setPreviewImages(newPreviews);
    setFormData((prev) => ({ ...prev, images: newImages }));
    setDragIndex(null);
  };

  const handleSubmit = async () => {
    if (!formData.manufacturerId || !formData.vehicleTypeId || !formData.trimId) {
      setMessage({ error: "Brand, model, and trim are required" });
      return;
    }
    if (Object.keys(imageErrors).length > 0) {
      setMessage({ error: "Please remove oversized images" });
      return;
    }

    setSubmitting(true);
    setImageProgress({});

    try {
      // 1) Upload every selected image to Cloudinary directly, in parallel.
      //    Skip ones that already failed validation client-side.
      const filesToUpload = formData.images
        .map((file, originalIndex) => ({ file, originalIndex }))
        .filter(({ originalIndex }) => !imageErrors[originalIndex]);

      const uploadedResults = await uploadManyToCloudinary(
        filesToUpload.map((x) => x.file),
        (idx, percent) => {
          const originalIndex = filesToUpload[idx].originalIndex;
          setImageProgress((prev) => ({ ...prev, [originalIndex]: percent }));
        }
      );

      const failed = uploadedResults.filter((r) => r?.error);
      if (failed.length) {
        throw new Error(`${failed.length} image${failed.length > 1 ? "s" : ""} failed to upload`);
      }

      // Preserve the visible drag-reorder order
      const images = uploadedResults.map((r) => ({ path: r.path, filename: r.filename }));

      // 2) Save the car metadata + Cloudinary refs
      const { specifications, ...rest } = formData;
      const response = await axiosInstance.post("/api/v1/cars", {
        ...rest,
        specifications,
        images,
      });

      if (response.status === 200 || response.status === 201) {
        setMessage({ success: "Vehicle added to inventory" });
        resetForm();
      }
    } catch (error) {
      console.error(error);
      setMessage({
        error: error.response?.data?.error || error.message || "Failed to add vehicle",
      });
    }
    setSubmitting(false);
    setImageProgress({});
  };

  const resetForm = () => {
    previewImages.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    setFormData(initialForm);
    setPreviewImages([]);
    setImageErrors({});
    setActiveSection("identity");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.dataset?.section) {
          setActiveSection(visible[0].target.dataset.section);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [completion.checks.trimSpecs]);

  const finalPrice = formData.discountedPrice || formData.originalPrice;
  const showSavings = formData.discountedPrice && formData.originalPrice && Number(formData.discountedPrice) < Number(formData.originalPrice);

  return (
    <div>
      <Flash message={message} />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Catalog · New Listing
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Add a vehicle</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Fill in the details across each section. Customers will see this on the storefront once published.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
              {completion.done}/{completion.total}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Progress</p>
              <p className="text-xs font-semibold text-gray-900">
                {completion.done === completion.total ? "Ready to publish" : "Sections complete"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Sticky section nav */}
        <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-13rem)] lg:flex lg:flex-col lg:gap-4">
          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-3 px-3">
            Sections
          </p>
          {SECTIONS
            .filter((s) => !(s.id === "trimSpecs" && (!selectedTrim || !selectedTrim.specifications?.length)))
            .map((s, idx) => {
            const isActive = activeSection === s.id;
            const isDone = completion.checks[s.id];
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isDone
                      ? "bg-primary-600 text-white"
                      : isActive
                      ? "bg-white border-2 border-primary-600 text-primary-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? "text-primary-700" : "text-gray-900"}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{s.hint}</p>
                </div>
              </button>
            );
          })}

          </div>

          {/* Live preview card — stays anchored at bottom of the aside */}
          <div className="shrink-0 p-4 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white">
            <p className="text-[10px] font-bold text-accent-300 tracking-[0.2em] uppercase mb-2">Preview</p>
            {selectedBrand && selectedModel ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {selectedBrand.logo?.path && (
                    <img
                      src={selectedBrand.logo.path}
                      alt=""
                      className="w-8 h-8 object-contain bg-white/10 rounded-md p-1"
                    />
                  )}
                  <p className="text-xs text-primary-100 truncate">{selectedBrand.brandName}</p>
                </div>
                <h4 className="text-sm font-bold leading-tight">
                  {selectedModel.modelName}
                  {selectedTrim && ` · ${selectedTrim.trimName}`}
                </h4>
                {formData.year && (
                  <p className="text-xs text-primary-200 mt-1">{formData.year}</p>
                )}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-primary-200">Listed at</p>
                  <p className="text-lg font-bold text-accent-300">
                    {finalPrice ? formatCurrency(finalPrice) : "—"}
                  </p>
                  {showSavings && (
                    <p className="text-[11px] text-primary-200 line-through">
                      {formatCurrency(formData.originalPrice)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-primary-200">
                Select a brand and model to see the preview.
              </p>
            )}
          </div>
        </aside>

        {/* Form sections */}
        <div className="space-y-6 pb-32">
          {/* Identity */}
          <Section
            id="identity"
            label="Vehicle Identity"
            description="Choose the manufacturer, model, and trim, then give the listing a clear title."
            sectionRefs={sectionRefs}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Brand" required>
                <select name="manufacturerId" value={formData.manufacturerId} onChange={handleInputChange} className="input-base">
                  <option value="">Select brand</option>
                  {manufacturers.map((m) => (
                    <option key={m._id} value={m._id}>{m.brandName}</option>
                  ))}
                </select>
              </Field>

              <Field label="Model" required>
                <select
                  name="vehicleTypeId"
                  value={formData.vehicleTypeId}
                  onChange={handleInputChange}
                  disabled={!formData.manufacturerId}
                  className="input-base disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.manufacturerId ? "Select model" : "Pick a brand first"}</option>
                  {filteredModels.map((vt) => (
                    <option key={vt._id} value={vt._id}>{vt.modelName}</option>
                  ))}
                </select>
              </Field>

              <Field label="Trim" required>
                <select
                  name="trimId"
                  value={formData.trimId}
                  onChange={handleInputChange}
                  disabled={!formData.vehicleTypeId}
                  className="input-base disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.vehicleTypeId ? "Select trim" : "Pick a model first"}</option>
                  {filteredTrims.map((t) => (
                    <option key={t._id} value={t._id}>{t.trimName}</option>
                  ))}
                </select>
              </Field>

              <Field label="Year" required>
                <input type="number" name="year" value={formData.year} onChange={handleInputChange} placeholder="e.g. 2024" className="input-base" />
              </Field>

              <Field label="Listing Title" hint="Optional — overrides the auto-generated title" className="md:col-span-2">
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Loaded Performance Package · Single Owner" className="input-base" />
              </Field>
            </div>
          </Section>

          {/* Pricing */}
          <Section
            id="pricing"
            label="Pricing & Status"
            description="Set the asking price and how this vehicle should appear in the inventory."
            sectionRefs={sectionRefs}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Original Price (AED)" required>
                <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} placeholder="0" className="input-base" />
              </Field>

              <Field label="Discounted Price (AED)" hint="Leave blank if not discounted">
                <input type="number" name="discountedPrice" value={formData.discountedPrice} onChange={handleInputChange} placeholder="0" className="input-base" />
              </Field>

              <Field label="Sale Status">
                <select name="saleStatus" value={formData.saleStatus} onChange={handleInputChange} className="input-base">
                  <option value="for-sale">For Sale</option>
                  <option value="sold">Sold</option>
                </select>
              </Field>

              <Field label="Featured listing">
                <ToggleGroup
                  name="featured"
                  value={formData.featured}
                  options={[{ value: "yes", label: "Featured" }, { value: "no", label: "Standard" }]}
                  onChange={handleInputChange}
                />
              </Field>
            </div>
          </Section>

          {/* Specs */}
          <Section
            id="specs"
            label="Specifications"
            description="Mechanical and physical details shown on the listing page."
            sectionRefs={sectionRefs}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Mileage">
                <input type="text" name="mileage" value={formData.mileage} onChange={handleInputChange} placeholder="e.g. 25,000 km" className="input-base" />
              </Field>
              <Field label="Engine">
                <input type="text" name="engine" value={formData.engine} onChange={handleInputChange} placeholder="e.g. 3.0L Twin-Turbo I6" className="input-base" />
              </Field>
              <Field label="Exterior Color">
                <input type="text" name="exteriorColor" value={formData.exteriorColor} onChange={handleInputChange} placeholder="e.g. Alpine White" className="input-base" />
              </Field>
              <Field label="Doors">
                <input type="number" name="door" value={formData.door} onChange={handleInputChange} placeholder="e.g. 4" className="input-base" />
              </Field>
              <Field label="Body Type">
                <select name="bodyType" value={formData.bodyType} onChange={handleInputChange} className="input-base">
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="sport">Sport</option>
                  <option value="crossover suv">Crossover SUV</option>
                </select>
              </Field>
              <Field label="Fuel Type">
                <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className="input-base">
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="plug-in-hybrid">Plug-in Hybrid</option>
                  <option value="cng">CNG</option>
                  <option value="lpg">LPG</option>
                  <option value="ethanol">Ethanol</option>
                  <option value="hydrogen">Hydrogen</option>
                </select>
              </Field>
              <Field label="Transmission">
                <select name="transmission" value={formData.transmission} onChange={handleInputChange} className="input-base">
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="dual-clutch">Dual-Clutch</option>
                </select>
              </Field>
              <Field label="Origin">
                <select name="origin" value={formData.origin} onChange={handleInputChange} className="input-base">
                  <option value="gcc">GCC</option>
                  <option value="us">US</option>
                  <option value="eu">EU</option>
                  <option value="cad">Canadian</option>
                  <option value="korean">Korean</option>
                  <option value="others">Others</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Inclusions */}
          <Section
            id="inclusions"
            label="Inclusions"
            description="What's bundled with the vehicle."
            sectionRefs={sectionRefs}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Warranty">
                <ToggleGroup
                  name="warranty"
                  value={formData.warranty}
                  options={[{ value: "Available", label: "Included" }, { value: "Not available", label: "None" }]}
                  onChange={handleInputChange}
                />
              </Field>
              <Field label="Service Package">
                <ToggleGroup
                  name="servicePackage"
                  value={formData.servicePackage}
                  options={[{ value: "Available", label: "Included" }, { value: "Not available", label: "None" }]}
                  onChange={handleInputChange}
                />
              </Field>
              <Field label="Test Drive">
                <ToggleGroup
                  name="testDrive"
                  value={formData.testDrive}
                  options={[{ value: "yes", label: "Allowed" }, { value: "no", label: "Not allowed" }]}
                  onChange={handleInputChange}
                />
              </Field>
            </div>
          </Section>

          {/* Trim Specs */}
          {selectedTrim?.specifications?.length > 0 && (
            <Section
              id="trimSpecs"
              label="Trim Equipment"
              description={`Defaults from "${selectedTrim.trimName}" — uncheck anything that doesn't apply to this specific vehicle.`}
              sectionRefs={sectionRefs}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedTrim.specifications.map((spec) => {
                  const checked = !!formData.specifications[spec];
                  return (
                    <label
                      key={spec}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? "bg-primary-50 border-primary-200"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => handleSpecChange(spec, e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-primary-600 text-white" : "bg-gray-100 text-transparent"
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`text-sm ${checked ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                        {spec}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Description */}
          <Section
            id="description"
            label="Description"
            description="Tell the story of this vehicle. Highlight history, condition, and unique selling points."
            sectionRefs={sectionRefs}
          >
            <div className="quill-wrap" style={{ minHeight: "300px" }}>
              <ReactQuill
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                theme="snow"
                placeholder="Write a compelling description..."
                style={{ height: "240px", marginBottom: "40px" }}
              />
            </div>
          </Section>

          {/* Media */}
          <Section
            id="media"
            label="Media Gallery"
            description="Upload high-quality photos. The first image becomes the cover. Drag to reorder."
            sectionRefs={sectionRefs}
          >
            <div
              onDragOver={handleImgDragOver}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e); }}
              onClick={() => document.getElementById("car-images")?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-all"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 text-2xl">
                📷
              </div>
              <p className="text-sm font-semibold text-gray-900">Drag photos here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP · up to 10MB each</p>
              <input
                id="car-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {previewImages.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                    {previewImages.length} {previewImages.length === 1 ? "image" : "images"}
                  </p>
                  <p className="text-[11px] text-gray-400">Drag tiles to reorder</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {previewImages.map((src, idx) => {
                    const hasError = imageErrors[idx];
                    const progress = imageProgress[idx];
                    const uploading = submitting && typeof progress === "number" && progress < 100;
                    const uploaded = submitting && progress === 100;
                    return (
                      <div
                        key={idx}
                        draggable={!submitting}
                        onDragStart={(e) => handleImgDragStart(e, idx)}
                        onDragOver={handleImgDragOver}
                        onDrop={(e) => handleImgDrop(e, idx)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${
                          hasError ? "border-red-300" : "border-gray-100 hover:border-primary-300"
                        } ${dragIndex === idx ? "opacity-50" : ""} ${submitting ? "cursor-default" : "cursor-move"}`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />

                        {idx === 0 && !hasError && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                            Cover
                          </div>
                        )}

                        {hasError && (
                          <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center text-white text-xs font-semibold p-3 text-center">
                            {hasError}
                          </div>
                        )}

                        {/* Upload progress overlay */}
                        {(uploading || uploaded) && (
                          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                            {uploaded ? (
                              <>
                                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center mb-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Uploaded</p>
                              </>
                            ) : (
                              <>
                                <p className="text-2xl font-bold tracking-tight">{progress ?? 0}%</p>
                                <div className="w-3/4 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className="h-full bg-accent-400 transition-all duration-200"
                                    style={{ width: `${progress ?? 0}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!submitting && (
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-white/90 backdrop-blur text-gray-700 hover:bg-red-600 hover:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}

                        <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          #{idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              {completion.done}/{completion.total} sections
            </p>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all duration-500"
                style={{ width: `${(completion.done / completion.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={resetForm} disabled={submitting} className="btn btn-ghost disabled:opacity-50">
              Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {submitting
                  ? Object.values(imageProgress).some((p) => p < 100)
                    ? "Uploading images…"
                    : "Saving vehicle…"
                  : "Publish Vehicle"}
              </span>
              {!submitting && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----- Sub-components ----- */

const Section = ({ id, label, description, sectionRefs, children }) => (
  <section
    ref={(el) => { sectionRefs.current[id] = el; }}
    data-section={id}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm scroll-mt-24"
  >
    <div className="px-6 md:px-8 pt-6 md:pt-8 pb-2">
      <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-2">
        {label}
      </p>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">{label}</h2>
      {description && (
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{description}</p>
      )}
    </div>
    <div className="px-6 md:px-8 py-6">{children}</div>
  </section>
);

const Field = ({ label, hint, required, className = "", children }) => (
  <div className={`form-group ${className}`}>
    <div className="flex items-center justify-between mb-2">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
        {label} {required && <span className="text-accent-600 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-[11px] text-gray-400 font-normal normal-case">{hint}</span>}
    </div>
    {children}
  </div>
);

const ToggleGroup = ({ name, value, options, onChange }) => (
  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange({ target: { name, value: opt.value } })}
          className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
            active
              ? "bg-white text-primary-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default AddCar;
