import React, { useState, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import { uploadToCloudinary } from "../services/cloudinaryUpload";
import Flash from "./Flash";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, "").trim();

const AddBlog = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = useMemo(() => {
    const text = stripHtml(formData.description);
    if (!text) return 0;
    return text.split(/\s+/).length;
  }, [formData.description]);

  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const checks = useMemo(
    () => ({
      title: formData.title.trim().length >= 3,
      cover: !!formData.image,
      body: stripHtml(formData.description).length >= 30,
    }),
    [formData]
  );

  const completion = useMemo(() => {
    const done = Object.values(checks).filter(Boolean).length;
    return { done, total: Object.keys(checks).length };
  }, [checks]);

  const canPublish = checks.title && checks.cover && checks.body;

  const handleImageFile = (file) => {
    if (!file) return;
    if (previewImage) {
      try { URL.revokeObjectURL(previewImage); } catch {}
    }
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const handleImageInput = (e) => {
    const file = e.type === "change" ? e.target.files?.[0] : e.dataTransfer?.files?.[0];
    handleImageFile(file);
  };

  const removeImage = () => {
    if (previewImage) {
      try { URL.revokeObjectURL(previewImage); } catch {}
    }
    setPreviewImage(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async () => {
    if (!canPublish) {
      setMessage({ error: "Add a title, cover, and body before publishing" });
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    try {
      // Step 1: upload the cover image directly to Cloudinary with live progress
      const uploaded = await uploadToCloudinary(formData.image, setUploadProgress);

      // Step 2: send the article metadata + Cloudinary refs
      const { status, data } = await axiosInstance.post("/api/v1/blogs", {
        title: formData.title,
        description: formData.description,
        image: uploaded,
      });

      if (status === 200 || status === 201) {
        setMessage(data?.success ? data : { success: "Article published" });
        resetForm();
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data || { error: error.message || "Failed to publish article" }
      );
    }
    setSubmitting(false);
    setUploadProgress(0);
  };

  const resetForm = () => {
    if (previewImage) {
      try { URL.revokeObjectURL(previewImage); } catch {}
    }
    setFormData({ title: "", description: "", image: null });
    setPreviewImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <Flash message={message} />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Content · New Article
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Compose a blog post</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Tell stories that move premium buyers. Add a title, a cover image, and your body — preview updates as you write.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm self-start md:self-auto">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
            {completion.done}/{completion.total}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Status</p>
            <p className="text-xs font-semibold text-gray-900">
              {canPublish ? "Ready to publish" : "Draft"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 pb-32">
        {/* Main editor */}
        <div className="space-y-6 min-w-0">
          {/* Cover */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {previewImage ? (
              <div className="relative group">
                <img src={previewImage} alt="" className="w-full aspect-[16/9] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label
                    htmlFor="blog-cover"
                    className="px-3 py-1.5 rounded-lg bg-white text-primary-700 text-xs font-semibold shadow-md cursor-pointer hover:bg-primary-50"
                  >
                    Replace
                  </label>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-3 py-1.5 rounded-lg bg-white text-red-600 text-xs font-semibold shadow-md hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 z-20 px-2.5 py-1 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md opacity-90">
                  Cover Image
                </div>
              </div>
            ) : (
              <label
                htmlFor="blog-cover"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleImageInput(e); }}
                className="flex flex-col items-center justify-center aspect-[16/9] cursor-pointer border-2 border-dashed border-gray-200 m-3 rounded-xl text-center hover:border-primary-400 hover:bg-primary-50/40 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3 text-2xl">
                  🖼
                </div>
                <p className="text-sm font-semibold text-gray-900">Add a cover image</p>
                <p className="text-xs text-gray-400 mt-1">Drop a file here or click to browse · 16:9 recommended</p>
              </label>
            )}
            <input
              id="blog-cover"
              type="file"
              accept="image/*"
              onChange={handleImageInput}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-3">
              Title
            </p>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Write a headline that commands attention…"
              className="w-full bg-transparent border-0 px-0 text-2xl md:text-3xl font-bold text-gray-900 tracking-tight placeholder:text-gray-300 focus:outline-none focus:ring-0"
              maxLength={140}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Headlines under 70 characters perform best in search results.
              </p>
              <p className={`text-xs font-semibold ${formData.title.length > 120 ? "text-accent-700" : "text-gray-400"}`}>
                {formData.title.length}/140
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 pt-6 md:pt-8">
              <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-2">Body</p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Article content</h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Use the toolbar for formatting, lists, links, and inline images.
              </p>
            </div>
            <div className="px-3 md:px-5 pt-4 pb-3">
              <div className="quill-blog-editor">
                <ReactQuill
                  value={formData.description}
                  onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                  modules={QUILL_MODULES}
                  theme="snow"
                  placeholder="Start writing…"
                />
              </div>
            </div>
            <div className="px-6 md:px-8 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{wordCount.toLocaleString()} words</span>
              <span>·</span>
              <span>{readMinutes} min read</span>
            </div>
          </div>
        </div>

        {/* Sticky right rail */}
        <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-13rem)] lg:flex lg:flex-col lg:gap-4 space-y-4 lg:space-y-0">
          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 space-y-4">
            {/* Checklist */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">
                Publish Checklist
              </p>
              <div className="space-y-3">
                <ChecklistItem done={checks.title} label="Headline" hint="At least 3 characters" />
                <ChecklistItem done={checks.cover} label="Cover image" hint="16:9 hero recommended" />
                <ChecklistItem done={checks.body} label="Body content" hint="At least 30 characters" />
              </div>
            </div>

            {/* Reading stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-3">
                Reading Stats
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Stat value={wordCount.toLocaleString()} label="Words" />
                <Stat value={`${readMinutes}m`} label="Read time" />
              </div>
            </div>
          </div>

          {/* Live preview tile */}
          <div className="shrink-0 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white overflow-hidden">
            <p className="px-5 pt-4 text-[10px] font-bold text-accent-300 tracking-[0.2em] uppercase">
              Storefront Preview
            </p>
            <div className="p-3">
              <div className="bg-white rounded-xl overflow-hidden">
                {previewImage ? (
                  <img src={previewImage} alt="" className="w-full aspect-[16/9] object-cover" />
                ) : (
                  <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
                    🖼
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-1.5">
                    ZRS Journal
                  </p>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 tracking-tight">
                    {formData.title.trim() || "Your article title will appear here"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {stripHtml(formData.description).slice(0, 120) || "A short preview of the body content will show below the title."}
                  </p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    <span>{readMinutes}m read</span>
                    <span>·</span>
                    <span>{wordCount > 0 ? `${wordCount} words` : "Draft"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              {submitting
                ? uploadProgress < 100
                  ? `Uploading cover · ${uploadProgress}%`
                  : "Saving article"
                : `${completion.done}/${completion.total} ready`}
            </p>
            <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all duration-300"
                style={{
                  width: `${
                    submitting
                      ? uploadProgress
                      : (completion.done / completion.total) * 100
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={resetForm} disabled={submitting} className="btn btn-ghost disabled:opacity-50">Reset</button>
            <button
              onClick={handleSubmit}
              disabled={!canPublish || submitting}
              className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {submitting
                  ? uploadProgress < 100
                    ? `Uploading… ${uploadProgress}%`
                    : "Publishing…"
                  : "Publish Article"}
              </span>
              {!submitting && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChecklistItem = ({ done, label, hint }) => (
  <div className="flex items-start gap-3">
    <div
      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
        done ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-400"
      }`}
    >
      {done ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
    </div>
    <div className="min-w-0">
      <p className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-700"}`}>{label}</p>
      <p className="text-[11px] text-gray-400">{hint}</p>
    </div>
  </div>
);

const Stat = ({ value, label }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-lg font-bold text-gray-900 tracking-tight">{value}</p>
    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
  </div>
);

export default AddBlog;
