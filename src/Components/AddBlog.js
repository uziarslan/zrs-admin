import React, { useState, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "./Flash";
import { AuthContext } from "../Context/AuthContext";
import uploadIcon from "../Assets/icons/upload.svg";
import arrowIcon from "../Assets/icons/arrow.svg";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const AddBlog = () => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: null, // Changed from `images: []`
    });
    const [message, setMessage] = useState({});
    const [showContentSection, setShowContentSection] = useState(true);
    const [previewImage, setPreviewImage] = useState(null); // Changed from `previewImages: []`
    const { setIsLoading } = useContext(AuthContext);

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
        setPreviewImage(preview); // Replace the existing preview
        setFormData((prev) => ({
            ...prev,
            image: file, // Replace the existing image
        }));
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        handleImageUpload(e);
    };

    const removeImage = () => {
        setPreviewImage(null); // Clear the preview
        setFormData((prev) => ({
            ...prev,
            image: null, // Clear the image
        }));
    };

    const handleToggleSection = (section) => {
        setShowContentSection(section === "blogContent");
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== "image") {
                    formDataToSend.append(key, value);
                }
            });
            if (formData.image) {
                formDataToSend.append("image", formData.image); // Append single image
            }
            const { status, data } = await axiosInstance.post("/api/v1/blogs", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            if (status === 200 || status === 201) {
                setMessage(data);
                setFormData({ title: "", description: "", image: null });
                setPreviewImage(null);
            }
        } catch (error) {
            console.error(error);
            setMessage(error.response.data);
        }
        setIsLoading(false);
    };

    const handleCancel = () => {
        setFormData({ title: "", description: "", image: null });
        setPreviewImage(null);
        setShowContentSection(true);
    };

    return (
        <div>
            <Flash message={message} />
            <h2 className="screenHeading">Add Blog</h2>
            <p className="screenSubHeading">We are glad to see you again!</p>
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
                                        setFormData((prev) => ({ ...prev, description: value }))
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
                            onClick={() => document.getElementById("blogImages")?.click()}
                        >
                            <img src={uploadIcon} alt="Upload" />
                            <p className="dragDropText">Drag and drop image here</p> {/* Updated text */}
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
                                accept="image/*" // Removed `multiple`
                                onChange={handleImageUpload}
                                style={{ display: "none" }}
                            />
                        </div>
                        <div className="imageGrid">
                            {previewImage && ( // Render single image instead of mapping
                                <div className="imageCard">
                                    <img src={previewImage} alt="Thumbnail Preview" />
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
                            <button className="cancelFormBtn" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="createBtn" onClick={handleSubmit}>
                                Create
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddBlog;