import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import axiosInstance from "../services/axiosInstance";
import { uploadManyToCloudinary } from "../services/cloudinaryUpload";
import { AuthContext } from "../Context/AuthContext";
import Flash from "./Flash";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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

export default function EditCar({ car, onClose, onUpdate, onDelete }) {
  const { setIsLoading } = useContext(AuthContext);
  const [manufacturers, setManufacturers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [allTrims, setAllTrims] = useState([]);
  const [formData, setFormData] = useState({
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
  });
  const [message, setMessage] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [deletedImageFilenames, setDeletedImageFilenames] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [activeSection, setActiveSection] = useState("identity");
  const [submitting, setSubmitting] = useState(false);
  const [imageProgress, setImageProgress] = useState({}); // keyed by previewImages index
  const sectionRefs = useRef({});

  // Pre-fill from car
  useEffect(() => {
    if (car) {
      setFormData((prev) => ({
        ...prev,
        manufacturerId: car.manufacturerId?._id || "",
        vehicleTypeId: car.vehicleTypeId?._id || "",
        trimId: car.trimId?._id || "",
        title: car.title || "",
        originalPrice: car.originalPrice || "",
        fuelType: car.fuelType || "gasoline",
        mileage: car.mileage || "",
        year: car.year || "",
        exteriorColor: car.exteriorColor || "",
        warranty: car.warranty || "Available",
        door: car.door || "",
        origin: car.origin || "gcc",
        transmission: car.transmission || "manual",
        bodyType: car.bodyType || "sedan",
        engine: car.engine || "",
        testDrive: car.testDrive || "yes",
        featured: car.featured || "no",
        saleStatus: car.saleStatus || "for-sale",
        discountedPrice: car.discountedPrice || "",
        servicePackage: car.servicePackage || "Available",
        specifications: car.specifications || {},
        description: car.description || "",
        images: car.images || [],
      }));
      setPreviewImages(car.images?.map((img) => img.path) || []);
      setDeletedImageFilenames([]);
    }
  }, [car]);

  // Fetch reference data
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
      } catch (err) {
        setMessage({ error: "Failed to fetch reference data" });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [setIsLoading]);

  // Sync trim specs (preserve already-saved values)
  useEffect(() => {
    if (formData.trimId) {
      const selectedTrim = allTrims.find((t) => t._id === formData.trimId);
      if (selectedTrim) {
        const trimSpecs = selectedTrim.specifications.reduce((acc, spec) => {
          acc[spec] = true;
          return acc;
        }, {});
        setFormData((prev) => ({
          ...prev,
          specifications: { ...trimSpecs, ...car?.specifications },
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        (t) =>
          (t.vehicleType?._id || t.vehicleType) === formData.vehicleTypeId
      ),
    [allTrims, formData.vehicleTypeId]
  );

  const selectedBrand = manufacturers.find((m) => m._id === formData.manufacturerId);
  const selectedModel = vehicleTypes.find((vt) => vt._id === formData.vehicleTypeId);
  const selectedTrim = allTrims.find((t) => t._id === formData.trimId);

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
    let validatedValue = value;
    if (["originalPrice", "discountedPrice", "door"].includes(name)) {
      validatedValue = value === "" ? "" : parseFloat(value) || "";
    }
    setFormData((prev) => ({
      ...prev,
      [name]: validatedValue,
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
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...fileArray] }));
  };

  const handleImgDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.setData("text/plain", index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleImgDragOver = (e) => e.preventDefault();

  const handleImgDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const newPreviews = [...previewImages];
    const newImages = [...formData.images];
    const [movedPreview] = newPreviews.splice(dragIndex, 1);
    const [movedImage] = newImages.splice(dragIndex, 1);
    newPreviews.splice(dropIndex, 0, movedPreview);
    newImages.splice(dropIndex, 0, movedImage);
    setPreviewImages(newPreviews);
    setFormData((prev) => ({ ...prev, images: newImages }));
    setDragIndex(null);
  };

  const removeImage = (idx) => {
    const imageToRemove = formData.images[idx];
    setPreviewImages((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    if (typeof imageToRemove === "object" && imageToRemove?.filename) {
      setDeletedImageFilenames((prev) => [...prev, imageToRemove.filename]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setImageProgress({});

    try {
      const specsObj =
        formData.specifications instanceof Map
          ? Object.fromEntries(formData.specifications)
          : formData.specifications;

      const existingImages = formData.images
        .filter((image) => !(image instanceof File))
        .map((image) => ({ path: image.path, filename: image.filename }));

      // 1) Upload only newly-added Files to Cloudinary, with progress
      const newFileEntries = formData.images
        .map((image, originalIndex) => ({ image, originalIndex }))
        .filter((x) => x.image instanceof File);

      let newImages = [];
      if (newFileEntries.length) {
        const results = await uploadManyToCloudinary(
          newFileEntries.map((x) => x.image),
          (idx, percent) => {
            const originalIndex = newFileEntries[idx].originalIndex;
            setImageProgress((prev) => ({ ...prev, [originalIndex]: percent }));
          }
        );
        const failed = results.filter((r) => r?.error);
        if (failed.length) {
          throw new Error(`${failed.length} image${failed.length > 1 ? "s" : ""} failed to upload`);
        }
        newImages = results.map((r) => ({ path: r.path, filename: r.filename }));
      }

      // 2) Send the JSON update
      const { images, specifications, ...rest } = formData;
      const response = await axiosInstance.put(`/api/v1/${car._id}`, {
        ...rest,
        specifications: specsObj,
        existingImages,
        newImages,
        deletedImageFilenames,
      });

      if (response.status === 200) {
        setMessage({ success: "Vehicle updated" });
        onUpdate();
      }
    } catch (error) {
      setMessage({
        error: error.response?.data?.error || error.message || "Failed to update vehicle",
      });
    }
    setSubmitting(false);
    setImageProgress({});
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete this vehicle? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/api/v1/${car._id}`);
      // Prefer the dedicated onDelete callback (optimistic) when provided
      if (typeof onDelete === "function") {
        onDelete(car._id);
      } else {
        onUpdate();
      }
    } catch (error) {
      setMessage({ error: "Failed to delete vehicle" });
      setIsLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

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

  if (!car) return null;

  const finalPrice = formData.discountedPrice || formData.originalPrice;
  const showSavings =
    formData.discountedPrice &&
    formData.originalPrice &&
    Number(formData.discountedPrice) < Number(formData.originalPrice);

  return (
    <div>
      <Flash message={message} />

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to inventory
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
              Catalog · Edit Listing
            </p>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight truncate">
              {selectedBrand?.brandName || car.manufacturerId?.brandName} {selectedModel?.modelName || car.vehicleTypeId?.modelName} {selectedTrim?.trimName || car.trimId?.trimName}
            </h1>
            <p className="text-gray-500 mt-2">
              {car.title || "Update the listing details below."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
                {completion.done}/{completion.total}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Progress</p>
                <p className="text-xs font-semibold text-gray-900">Sections complete</p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg border border-red-100 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
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
                  isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50"
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

          {/* Live preview — anchored at bottom of the aside */}
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
                {formData.year && <p className="text-xs text-primary-200 mt-1">{formData.year}</p>}
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
                  {formData.saleStatus === "sold" && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-ink-900 text-white text-[10px] font-bold tracking-wider uppercase">
                      Sold
                    </span>
                  )}
                  {formData.featured === "yes" && (
                    <span className="inline-block mt-2 ml-1 px-2 py-0.5 rounded bg-accent-600 text-white text-[10px] font-bold tracking-wider uppercase">
                      Featured
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-primary-200">Select a brand and model to see the preview.</p>
            )}
          </div>
        </aside>

        {/* Form sections */}
        <div className="space-y-6 pb-32">
          {/* Identity */}
          <Section id="identity" label="Vehicle Identity" description="Core information about which vehicle this is." sectionRefs={sectionRefs}>
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
                <input type="number" name="year" value={formData.year} onChange={handleInputChange} className="input-base" />
              </Field>
              <Field label="Listing Title" hint="Optional headline" className="md:col-span-2">
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-base" />
              </Field>
            </div>
          </Section>

          {/* Pricing */}
          <Section id="pricing" label="Pricing & Status" description="Update the price or change how the vehicle appears in the inventory." sectionRefs={sectionRefs}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Original Price (AED)" required>
                <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} className="input-base" />
              </Field>
              <Field label="Discounted Price (AED)" hint="Leave blank if not discounted">
                <input type="number" name="discountedPrice" value={formData.discountedPrice} onChange={handleInputChange} className="input-base" />
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
          <Section id="specs" label="Specifications" description="Mechanical and physical details." sectionRefs={sectionRefs}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Mileage"><input type="text" name="mileage" value={formData.mileage} onChange={handleInputChange} className="input-base" /></Field>
              <Field label="Engine"><input type="text" name="engine" value={formData.engine} onChange={handleInputChange} className="input-base" /></Field>
              <Field label="Exterior Color"><input type="text" name="exteriorColor" value={formData.exteriorColor} onChange={handleInputChange} className="input-base" /></Field>
              <Field label="Doors"><input type="number" name="door" value={formData.door} onChange={handleInputChange} className="input-base" /></Field>
              <Field label="Body Type">
                <select name="bodyType" value={formData.bodyType} onChange={handleInputChange} className="input-base">
                  <option value="sedan">Sedan</option><option value="hatchback">Hatchback</option><option value="suv">SUV</option><option value="coupe">Coupe</option><option value="convertible">Convertible</option><option value="sport">Sport</option><option value="crossover suv">Crossover SUV</option>
                </select>
              </Field>
              <Field label="Fuel Type">
                <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className="input-base">
                  <option value="gasoline">Gasoline</option><option value="diesel">Diesel</option><option value="electric">Electric</option><option value="hybrid">Hybrid</option><option value="plug-in-hybrid">Plug-in Hybrid</option><option value="cng">CNG</option><option value="lpg">LPG</option><option value="ethanol">Ethanol</option><option value="hydrogen">Hydrogen</option>
                </select>
              </Field>
              <Field label="Transmission">
                <select name="transmission" value={formData.transmission} onChange={handleInputChange} className="input-base">
                  <option value="manual">Manual</option><option value="automatic">Automatic</option><option value="cvt">CVT</option><option value="dual-clutch">Dual-Clutch</option>
                </select>
              </Field>
              <Field label="Origin">
                <select name="origin" value={formData.origin} onChange={handleInputChange} className="input-base">
                  <option value="gcc">GCC</option><option value="us">US</option><option value="eu">EU</option><option value="cad">Canadian</option><option value="korean">Korean</option><option value="others">Others</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Inclusions */}
          <Section id="inclusions" label="Inclusions" description="What's bundled with this vehicle." sectionRefs={sectionRefs}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Warranty">
                <ToggleGroup name="warranty" value={formData.warranty} options={[{ value: "Available", label: "Included" }, { value: "Not available", label: "None" }]} onChange={handleInputChange} />
              </Field>
              <Field label="Service Package">
                <ToggleGroup name="servicePackage" value={formData.servicePackage} options={[{ value: "Available", label: "Included" }, { value: "Not available", label: "None" }]} onChange={handleInputChange} />
              </Field>
              <Field label="Test Drive">
                <ToggleGroup name="testDrive" value={formData.testDrive} options={[{ value: "yes", label: "Allowed" }, { value: "no", label: "Not allowed" }]} onChange={handleInputChange} />
              </Field>
            </div>
          </Section>

          {/* Trim Specs */}
          {selectedTrim?.specifications?.length > 0 && (
            <Section id="trimSpecs" label="Trim Equipment" description={`From "${selectedTrim.trimName}" — toggle anything specific to this vehicle.`} sectionRefs={sectionRefs}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedTrim.specifications.map((spec) => {
                  const checked = !!formData.specifications[spec];
                  return (
                    <label
                      key={spec}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        checked ? "bg-primary-50 border-primary-200" : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input type="checkbox" checked={checked} onChange={(e) => handleSpecChange(spec, e.target.checked)} className="sr-only" />
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary-600 text-white" : "bg-gray-100 text-transparent"}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`text-sm ${checked ? "text-gray-900 font-semibold" : "text-gray-700"}`}>{spec}</span>
                    </label>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Description */}
          <Section id="description" label="Description" description="Tell the story of this vehicle." sectionRefs={sectionRefs}>
            <div className="quill-wrap" style={{ minHeight: "300px" }}>
              <ReactQuill
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                theme="snow"
                style={{ height: "240px", marginBottom: "40px" }}
              />
            </div>
          </Section>

          {/* Media */}
          <Section id="media" label="Media Gallery" description="Add new photos, drag to reorder, or remove old ones. The first image is the cover." sectionRefs={sectionRefs}>
            <div
              onDragOver={handleImgDragOver}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e); }}
              onClick={() => document.getElementById("edit-car-images")?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-all"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 text-2xl">
                📷
              </div>
              <p className="text-sm font-semibold text-gray-900">Drop new photos here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP</p>
              <input id="edit-car-images" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
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
                    const isExisting = !(formData.images[idx] instanceof File);
                    const progress = imageProgress[idx];
                    const uploading = submitting && !isExisting && typeof progress === "number" && progress < 100;
                    const uploaded = submitting && !isExisting && progress === 100;
                    return (
                      <div
                        key={idx}
                        draggable={!submitting}
                        onDragStart={(e) => handleImgDragStart(e, idx)}
                        onDragOver={handleImgDragOver}
                        onDrop={(e) => handleImgDrop(e, idx)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border transition-all border-gray-100 hover:border-primary-300 ${
                          dragIndex === idx ? "opacity-50" : ""
                        } ${submitting ? "cursor-default" : "cursor-move"}`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />

                        {idx === 0 && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                            Cover
                          </div>
                        )}

                        {!isExisting && (
                          <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded bg-primary-600 text-white text-[10px] font-bold tracking-wider uppercase shadow">
                            New
                          </div>
                        )}

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
                      </div>
                    );
                  })}
                </div>

                {deletedImageFilenames.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3">
                    {deletedImageFilenames.length} image{deletedImageFilenames.length === 1 ? "" : "s"} marked for removal · saved on update
                  </p>
                )}
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
            <button onClick={onClose} disabled={submitting} className="btn btn-ghost disabled:opacity-50">
              Cancel
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
                    : "Saving…"
                  : "Save Changes"}
              </span>
              {!submitting && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----- Sub-components (mirror AddCar's so the experiences feel identical) ----- */

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
      {description && <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">{description}</p>}
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
            active ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
