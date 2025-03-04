import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "./Flash";
import { AuthContext } from "../Context/AuthContext";
import uploadIcon from "../Assets/icons/upload.svg";
import arrowIcon from "../Assets/icons/arrow.svg";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const Blogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [message, setMessage] = useState({});
    const [editingBlog, setEditingBlog] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: null,
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [showContentSection, setShowContentSection] = useState(true);
    const { setIsLoading } = useContext(AuthContext);

    useEffect(() => {
        const fetchBlogs = async () => {
            setIsLoading(true);
            try {
                const response = await axiosInstance.get("/api/v1/blogs");
                if (response.status === 200) {
                    setBlogs(response.data.blogs || []);
                }
            } catch (error) {
                console.error(error);
                setMessage({ error: "Failed to fetch blogs" });
            }
            setIsLoading(false);
        };
        fetchBlogs();
    }, [setIsLoading]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, "0");
        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month}, ${year}`;
    };

    const handleEdit = (blog) => {
        setEditingBlog(blog);
        setFormData({
            title: blog.title,
            description: blog.description,
            image: null,
        });
        setPreviewImage(blog.image.path);
    };

    const handleDelete = async (blogId) => {
        if (!window.confirm("Are you sure you want to delete this blog?")) return;
        setIsLoading(true);
        try {
            const response = await axiosInstance.delete(`/api/v1/blogs/${blogId}`);
            if (response.status === 200) {
                setBlogs(blogs.filter((blog) => blog._id !== blogId));
                setMessage({ success: "Blog deleted successfully" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ error: "Failed to delete blog" });
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.type === "change" ? e.target.files[0] : e.dataTransfer.files[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPreviewImage(preview);
        setFormData((prev) => ({
            ...prev,
            image: file,
        }));
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        handleImageUpload(e);
    };

    const removeImage = () => {
        setPreviewImage(null);
        setFormData((prev) => ({
            ...prev,
            image: null,
        }));
    };

    const handleToggleSection = (section) => {
        setShowContentSection(section === "blogContent");
    };

    const handleSubmit = async () => {
        if (!editingBlog) return;
        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("description", formData.description);
            if (formData.image) {
                formDataToSend.append("image", formData.image);
            }

            const response = await axiosInstance.put(
                `/api/v1/blogs/${editingBlog._id}`,
                formDataToSend,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (response.status === 200) {
                setBlogs(
                    blogs.map((blog) =>
                        blog._id === editingBlog._id ? response.data.blog : blog
                    )
                );
                setMessage({ success: "Blog updated successfully" });
                handleCancelEdit();
            }
        } catch (error) {
            console.error(error);
            setMessage({ error: "Failed to update blog" });
        }
        setIsLoading(false);
    };

    const handleCancelEdit = () => {
        setEditingBlog(null);
        setFormData({ title: "", description: "", image: null });
        setPreviewImage(null);
        setShowContentSection(true);
    };

    return (
        <div>
            <Flash message={message} />

            {/* Edit Form */}
            {editingBlog ? (
                <div>
                    <h3><span onClick={() => setEditingBlog(null)}><i className='bx bx-left-arrow-alt'></i></span> Edit Blog</h3>
                    <header className="addCarHeader">
                        <p
                            onClick={() => handleToggleSection("blogContent")}
                            className={`${showContentSection ? "active" : ""}`}
                        >
                            Blog Content
                        </p>
                        <p
                            onClick={() => handleToggleSection("thumbnail")}
                            className={`${!showContentSection ? "active" : ""}`}
                        >
                            Thumbnail
                        </p>
                    </header>
                    <div className="allInputsWrapper">
                        {showContentSection ? (
                            <div>
                                <div className="formGroup">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div style={{ height: "400px" }} className="formGroup">
                                    <label>Blog Text</label>
                                    <div style={{ height: "100%" }} data-color-mode="light">
                                        <ReactQuill
                                            value={formData.description}
                                            onChange={(value) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    description: value,
                                                }))
                                            }
                                            theme="snow"
                                            style={{ height: "70%", width: "100%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="carMediaSecHeading">Upload Thumbnail</h3>
                                <div
                                    className="dropZone"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        document.getElementById("blogImages")?.click()
                                    }
                                >
                                    <img src={uploadIcon} alt="Upload" />
                                    <p className="dragDropText">Drag and drop image here</p>
                                    <button className="uploadCarMediaBtn">
                                        Browse Files
                                        <span>
                                            <img src={arrowIcon} alt="Arrow" />
                                        </span>
                                    </button>
                                    <input
                                        type="file"
                                        id="blogImages"
                                        name="blogImages"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: "none" }}
                                    />
                                </div>
                                <div className="imageGrid">
                                    {previewImage && (
                                        <div className="imageCard">
                                            <img
                                                src={previewImage}
                                                alt="Thumbnail Preview"
                                            />
                                            <button
                                                onClick={removeImage}
                                                className="removeImageButton"
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="addCarButtonWrapper">
                                    <button
                                        className="cancelFormBtn"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </button>
                                    <button className="createBtn" onClick={handleSubmit}>
                                        Update
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Blog List View
                <div>
                    <h2 className="screenHeading">All Blogs</h2>
                    <p className="screenSubHeading">We are glad to see you again!</p>
                    <div className="blogContainer">
                        {blogs.length === 0 ? (
                            <p>No blog posted yet</p>
                        ) : (
                            blogs.map((blog) => (
                                <div className="blogCard" key={blog._id}>
                                    <div className="blogCardImage">
                                        <img alt="Blog Thumbnail" src={blog.image.path} />
                                    </div>
                                    <div className="blogAuthorContainer">
                                        <p className="blogAuthor">{blog.postedBy.name || "Unknown"}</p>
                                        <p className="blogDate">{formatDate(blog.createdAt)}</p>
                                    </div>
                                    <div className="blogContentContainer">
                                        <h3 className="blogTitle">{blog.title}</h3>
                                        <div
                                            className="blogContent"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    blog.description
                                            }}
                                        />
                                        <div>
                                            <i onClick={() => handleEdit(blog)} className="bx bx-edit bx-sm text-success me-2 cursor-pointer"></i>
                                            <i onClick={() => handleDelete(blog._id)} className="bx bx-trash bx-sm text-danger cursor-pointer"></i>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blogs;