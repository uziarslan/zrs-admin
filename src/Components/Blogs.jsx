import React, { useState, useEffect, useContext, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import { uploadToCloudinary } from "../services/cloudinaryUpload";
import Flash from "./Flash";
import { AuthContext } from "../Context/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import useUploadStatus from "../hooks/useUploadStatus";

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

const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [message, setMessage] = useState({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [editingBlog, setEditingBlog] = useState(null);
  const { setIsLoading } = useContext(AuthContext);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/v1/blogs");
      if (response.status === 200) setBlogs(response.data.blogs || []);
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to fetch articles" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBlogs = useMemo(() => {
    let list = [...blogs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          stripHtml(b.description).toLowerCase().includes(q)
      );
    }
    if (sort === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sort === "alpha") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return list;
  }, [blogs, search, sort]);

  const handleDelete = async (blogId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    // Optimistic: remove from UI immediately
    const snapshot = blogs;
    setBlogs((prev) => prev.filter((b) => b._id !== blogId));
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/api/v1/blogs/${blogId}`);
      setMessage({ success: "Article deleted" });
    } catch (error) {
      console.error(error);
      // Revert on failure
      setBlogs(snapshot);
      setMessage({ error: "Failed to delete article" });
    }
    setIsLoading(false);
  };

  if (editingBlog) {
    return (
      <BlogEditor
        blog={editingBlog}
        onClose={() => setEditingBlog(null)}
        onUpdate={(updated) => {
          setBlogs((prev) =>
            prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
          );
          setEditingBlog(null);
          setMessage({ success: "Article updated" });
        }}
        onDelete={(id) => {
          setBlogs((prev) => prev.filter((b) => b._id !== id));
          setEditingBlog(null);
          setMessage({ success: "Article deleted" });
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Flash message={message} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
            Content · Library
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Published articles</h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Every story currently live on the storefront. Click any article to edit or remove it.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
            {blogs.length}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {blogs.length === 1 ? "1 article" : `${blogs.length} articles`}
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
            placeholder="Search by title or content..."
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

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="alpha">A → Z</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Empty / no results */}
      {blogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            ✍
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No articles yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Compose your first blog post in the Create Blog tab — it'll appear here once published.
          </p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-600 text-2xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No matching articles</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Nothing matches "{search}". Try a different search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog._id}
              blog={blog}
              onEdit={() => setEditingBlog(blog)}
              onDelete={() => handleDelete(blog._id, blog.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ----- Card component ----- */

const BlogCard = ({ blog: initialBlog, onEdit, onDelete }) => {
  const [blog, setBlog] = useState(initialBlog);
  useEffect(() => setBlog(initialBlog), [initialBlog]);

  const isPending = blog.imageStatus === "pending";
  const isFailed = blog.imageStatus === "failed";

  useUploadStatus("blog", isPending ? blog._id : null, {
    enabled: isPending,
    onDone: (payload) =>
      setBlog((prev) => ({
        ...prev,
        image: payload.image || prev.image,
        imageStatus: payload.imageStatus,
        imageError: payload.imageError,
      })),
    onFailed: (payload) =>
      setBlog((prev) => ({ ...prev, imageStatus: payload.imageStatus, imageError: payload.imageError })),
  });

  const text = stripHtml(blog.description);
  const wordCount = text ? text.split(/\s+/).length : 0;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      onClick={onEdit}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary-300 hover:shadow-brand transition-all cursor-pointer flex flex-col"
    >
      {/* Image */}
      <div className={`relative aspect-[16/10] bg-gray-50 overflow-hidden ${isPending ? "animate-pulse" : ""}`}>
        {blog.image?.path ? (
          <img
            src={blog.image.path}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : isPending ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📰</div>
        )}

        {isPending ? (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-accent-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Uploading
          </div>
        ) : isFailed ? (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold tracking-widest uppercase shadow-md">
            Upload failed
          </div>
        ) : (
          <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-white text-[10px] font-bold tracking-wider uppercase">
            {readMin} min read
          </div>
        )}

        <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-8 h-8 rounded-lg bg-primary-600 text-white shadow-md hover:bg-primary-700 flex items-center justify-center"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 rounded-lg bg-white border border-red-100 text-red-600 shadow-sm hover:bg-red-50 flex items-center justify-center"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-2">
          {formatDate(blog.createdAt)}
        </p>
        <h3 className="text-base font-bold text-gray-900 tracking-tight leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
          {blog.title}
        </h3>
        {text && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">{text}</p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-[11px] text-gray-400">
          <span className="font-semibold uppercase tracking-wider">{wordCount.toLocaleString()} words</span>
          <span className="text-primary-600 font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Open →
          </span>
        </div>
      </div>
    </div>
  );
};

/* ----- Inline editor (mirrors AddBlog UX) ----- */

const BlogEditor = ({ blog, onClose, onUpdate, onDelete }) => {
  const { setIsLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: blog.title || "",
    description: blog.description || "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(blog.image?.path || null);
  const [imageReplaced, setImageReplaced] = useState(false);
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
      cover: !!previewImage,
      body: stripHtml(formData.description).length >= 30,
    }),
    [formData, previewImage]
  );
  const completion = useMemo(() => {
    const done = Object.values(checks).filter(Boolean).length;
    return { done, total: Object.keys(checks).length };
  }, [checks]);
  const canPublish = checks.title && checks.cover && checks.body;

  const handleImageFile = (file) => {
    if (!file) return;
    if (imageReplaced && previewImage) {
      try { URL.revokeObjectURL(previewImage); } catch {}
    }
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setImageReplaced(true);
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const handleImageInput = (e) => {
    const file = e.type === "change" ? e.target.files?.[0] : e.dataTransfer?.files?.[0];
    handleImageFile(file);
  };

  const removeImage = () => {
    if (imageReplaced && previewImage) {
      try { URL.revokeObjectURL(previewImage); } catch {}
    }
    setPreviewImage(null);
    setImageReplaced(true);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async () => {
    if (!canPublish) {
      setMessage({ error: "Add a title, cover, and body before saving" });
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    try {
      const body = {
        title: formData.title,
        description: formData.description,
      };

      // Only upload to Cloudinary if the user picked a brand-new file.
      if (formData.image) {
        const uploaded = await uploadToCloudinary(formData.image, setUploadProgress);
        body.image = uploaded;
      }

      const response = await axiosInstance.put(`/api/v1/blogs/${blog._id}`, body);

      if (response.status === 200) {
        onUpdate({
          ...blog,
          title: formData.title,
          description: formData.description,
          image: body.image || blog.image,
        });
      }
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data || { error: error.message || "Failed to save changes" }
      );
    }
    setSubmitting(false);
    setUploadProgress(0);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete "${blog.title}"? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/api/v1/blogs/${blog._id}`);
      onDelete(blog._id);
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to delete article" });
      setIsLoading(false);
    }
  };

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
          Back to articles
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-accent-700 tracking-widest uppercase mb-2">
              Content · Edit Article
            </p>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight truncate">
              {formData.title || "Untitled article"}
            </h1>
            <p className="text-gray-500 mt-2">
              Originally published {formatDate(blog.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
                {completion.done}/{completion.total}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Status</p>
                <p className="text-xs font-semibold text-gray-900">
                  {canPublish ? "Ready to save" : "Incomplete"}
                </p>
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
                    htmlFor="edit-blog-cover"
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
                htmlFor="edit-blog-cover"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleImageInput(e); }}
                className="flex flex-col items-center justify-center aspect-[16/9] cursor-pointer border-2 border-dashed border-gray-200 m-3 rounded-xl text-center hover:border-primary-400 hover:bg-primary-50/40 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3 text-2xl">
                  🖼
                </div>
                <p className="text-sm font-semibold text-gray-900">Add a cover image</p>
                <p className="text-xs text-gray-400 mt-1">Drop a file here or click to browse</p>
              </label>
            )}
            <input
              id="edit-blog-cover"
              type="file"
              accept="image/*"
              onChange={handleImageInput}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <p className="text-[10px] font-bold text-accent-700 tracking-[0.2em] uppercase mb-3">Title</p>
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

        {/* Right rail */}
        <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-13rem)] lg:flex lg:flex-col lg:gap-4 space-y-4 lg:space-y-0">
          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">
                Save Checklist
              </p>
              <div className="space-y-3">
                <ChecklistItem done={checks.title} label="Headline" hint="At least 3 characters" />
                <ChecklistItem done={checks.cover} label="Cover image" hint="16:9 hero recommended" />
                <ChecklistItem done={checks.body} label="Body content" hint="At least 30 characters" />
              </div>
            </div>

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
              {submitting && formData.image
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
                    submitting && formData.image
                      ? uploadProgress
                      : (completion.done / completion.total) * 100
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} disabled={submitting} className="btn btn-ghost disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canPublish || submitting}
              className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {submitting
                  ? formData.image && uploadProgress < 100
                    ? `Uploading… ${uploadProgress}%`
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

export default Blogs;
