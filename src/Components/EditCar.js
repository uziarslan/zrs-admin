import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import { AuthContext } from "../Context/AuthContext";
import uploadIcon from "../Assets/icons/upload.svg";
import Flash from "./Flash";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function EditCar({ car, onClose, onUpdate }) {
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
  const [showCarInfo, setShowCarInfo] = useState(true);
  const [previewImages, setPreviewImages] = useState([]);
  const [deletedImageFilenames, setDeletedImageFilenames] = useState([]);
  const [dragIndex, setDragIndex] = useState(null); // Track the dragged item index

  // Pre-fill form with car data
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
        saleStatus: car.saleStatus || "",
        discountedPrice: car.discountedPrice || "",
        servicePackage: car.servicePackage || "Available",
        specifications: car.specifications || {},
        description: car.description || "",
        images: car.images || [],
      }));
      setPreviewImages(car.images.map((img) => img.path) || []);
      setDeletedImageFilenames([]);
    }
  }, [car]);

  // Fetch dropdown options
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const manufacturersResponse = await axiosInstance.get("/api/v1/fetch-logos");
        const vehicleTypesResponse = await axiosInstance.get("/api/v1/fetch-vehicle-types");
        const trimsResponse = await axiosInstance.get("/api/v1/fetch-vehicle-trims");

        if (manufacturersResponse.status === 200) {
          setManufacturers(
            manufacturersResponse.data.logos.map((logo) => ({
              _id: logo._id,
              brandName: logo.brandName,
            }))
          );
        }
        if (vehicleTypesResponse.status === 200) {
          setVehicleTypes(vehicleTypesResponse.data.vehicleTypes || []);
        }
        if (trimsResponse.status === 200) {
          setAllTrims(trimsResponse.data.trims || []);
        }
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setMessage({ error: "Failed to fetch data" });
      }
      setIsLoading(false);
    };

    fetchData();
  }, [setIsLoading]);

  // Sync specifications with trim and car data
  useEffect(() => {
    if (formData.trimId) {
      const selectedTrim = allTrims.find((t) => t._id === formData.trimId);
      if (selectedTrim) {
        const trimSpecs = selectedTrim.specifications.reduce((acc, spec) => {
          acc[spec] = true; // Default all trim specs to true
          return acc;
        }, {});
        setFormData((prev) => ({
          ...prev,
          specifications: {
            ...trimSpecs,
            ...car.specifications, // car.specifications takes precedence
          },
        }));
      }
    }
  }, [formData.trimId, allTrims, car.specifications]);

  // Handle input changes with enum validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let validatedValue = value;

    if (name === "fuelType") {
      const validFuelTypes = [
        "gasoline", "diesel", "electric", "hybrid", "plug-in-hybrid",
        "cng", "lpg", "ethanol", "hydrogen",
      ];
      validatedValue = validFuelTypes.includes(value) ? value : "gasoline";
    } else if (name === "warranty") {
      validatedValue = ["Available", "Not available"].includes(value) ? value : "Available";
    } else if (name === "origin") {
      validatedValue = ["gcc", "us", "eu", "cad", "korean", "others"].includes(value) ? value : "gcc";
    } else if (name === "transmission") {
      validatedValue = ["manual", "automatic", "cvt", "dual-clutch"].includes(value) ? value : "manual";
    } else if (name === "bodyType") {
      validatedValue = [
        "sedan", "hatchback", "suv", "coupe", "convertible", "sport", "crossover suv",
      ].includes(value) ? value : "sedan";
    } else if (name === "testDrive" || name === "featured") {
      validatedValue = ["yes", "no"].includes(value) ? value : "yes";
    } else if (name === "saleStatus") {
      validatedValue = ["for-sale", "sold"].includes(value) ? value : "";
    } else if (name === "servicePackage") {
      validatedValue = ["Available", "Not available"].includes(value) ? value : "Available";
    } else if (["originalPrice", "discountedPrice", "door"].includes(name)) {
      validatedValue = value === "" ? "" : parseFloat(value) || "";
    }

    setFormData((prev) => ({
      ...prev,
      [name]: validatedValue,
      ...(name === "manufacturerId" && { vehicleTypeId: "", trimId: "", specifications: {} }),
      ...(name === "vehicleTypeId" && { trimId: "", specifications: {} }),
    }));
  };

  // Handle specification checkbox changes
  const handleSpecChange = (spec, checked) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [spec]: checked },
    }));
  };

  // Handle image selection and preview (for new uploads)
  const handleImageUpload = (e) => {
    const files = e.type === "change" ? e.target.files : e.dataTransfer.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...fileArray], // Store File objects
    }));
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.setData("text/plain", index); // Required for Firefox
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDropImage = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newPreviewImages = [...previewImages];
    const newImages = [...formData.images];

    // Reorder both preview and actual file arrays
    const [draggedPreview] = newPreviewImages.splice(dragIndex, 1);
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newPreviewImages.splice(dropIndex, 0, draggedPreview);
    newImages.splice(dropIndex, 0, draggedImage);

    setPreviewImages(newPreviewImages);
    setFormData((prev) => ({ ...prev, images: newImages }));
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // Handle drop for upload area
  const handleDrop = (e) => {
    e.preventDefault();
    handleImageUpload(e);
  };

  // Remove an image (from preview and form data, and track for backend deletion)
  const removeImage = (indexToRemove) => {
    const imageToRemove = formData.images[indexToRemove];
    setPreviewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));

    if (typeof imageToRemove === "object" && imageToRemove.filename) {
      setDeletedImageFilenames((prev) => [...prev, imageToRemove.filename]);
    }
  };

  // Toggle between sections
  const handleToggleSection = (section) => {
    setShowCarInfo(section === "carInfo");
  };

  // Handle form submission (update car)
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();

      // Convert specifications Map to a plain object before stringifying
      const specificationsObj =
        formData.specifications instanceof Map
          ? Object.fromEntries(formData.specifications)
          : formData.specifications;

      // Append non-image fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "images" && key !== "specifications") {
          formDataToSend.append(key, value);
        }
      });

      // Append specifications separately as JSON string
      formDataToSend.append("specifications", JSON.stringify(specificationsObj));

      // Append existing images (Cloudinary URLs)
      const existingImages = formData.images
        .filter((image) => !(image instanceof File))
        .map((image) => ({ path: image.path, filename: image.filename }));
      if (existingImages.length > 0) {
        formDataToSend.append("existingImages", JSON.stringify(existingImages));
      }

      // Append new images (File objects)
      const newImages = formData.images.filter((image) => image instanceof File);
      newImages.forEach((file) => formDataToSend.append("images", file));

      // Append deleted image filenames
      if (deletedImageFilenames.length > 0) {
        formDataToSend.append("deletedImageFilenames", JSON.stringify(deletedImageFilenames));
      }

      const response = await axiosInstance.put(`/api/v1/${car._id}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setMessage({ success: "Car updated successfully!" });
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating car:", error);
      setMessage({
        error: error.response?.data?.error || error.message || "Failed to update car",
      });
    }
    setIsLoading(false);
  };

  // Handle car deletion
  const handleDeleteCar = async () => {
    if (window.confirm("Are you sure you want to permanently delete this car?")) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.delete(`/api/v1/${car._id}`);
        if (response.status === 200) {
          setMessage({ success: "Car deleted successfully!" });
          onUpdate();
        }
      } catch (error) {
        console.error(error);
        setMessage({ error: "Failed to delete car" });
      }
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  if (!car) return <p>Loading...</p>;

  return (
    <div className="editCarForm">
      <Flash message={message} />
      <h2 className="screenHeading">Edit Car</h2>
      <p className="screenSubHeading">We are glad to see you again!</p>
      <header className="addCarHeader">
        <button className="transparentBtn" onClick={handleCancel}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <p
          onClick={() => handleToggleSection("carInfo")}
          className={`${showCarInfo ? "active" : ""}`}
        >
          Car Info
        </p>
        <p
          onClick={() => handleToggleSection("carMedia")}
          className={`${!showCarInfo ? "active" : ""}`}
        >
          Car Media
        </p>
        <button className="btn btn-danger" onClick={handleDeleteCar}>
          Delete car
        </button>
      </header>
      <div className="allInputsWrapper">
        {showCarInfo ? (
          <div className="addCarForm">
            <div className="formGroup">
              <label htmlFor="manufacturerId">Manufacturer</label>
              <select
                id="manufacturerId"
                name="manufacturerId"
                value={formData.manufacturerId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(({ brandName, _id }) => (
                  <option key={_id} value={_id}>{brandName}</option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="vehicleTypeId">Vehicle Type</label>
              <select
                id="vehicleTypeId"
                name="vehicleTypeId"
                value={formData.vehicleTypeId}
                onChange={handleInputChange}
                required
                disabled={!formData.manufacturerId}
              >
                <option value="">Select Vehicle Type</option>
                {vehicleTypes
                  .filter((vt) => vt.manufacturer?._id === formData.manufacturerId)
                  .map((vt) => (
                    <option key={vt._id} value={vt._id}>{vt.modelName}</option>
                  ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="trimId">Trim</label>
              <select
                id="trimId"
                name="trimId"
                value={formData.trimId}
                onChange={handleInputChange}
                required
                disabled={!formData.vehicleTypeId}
              >
                <option value="">Select Trim</option>
                {allTrims
                  .filter((trim) => trim.vehicleType?._id === formData.vehicleTypeId)
                  .map((trim) => (
                    <option key={trim._id} value={trim._id}>{trim.trimName}</option>
                  ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="originalPrice">Original Price</label>
              <input
                type="number"
                id="originalPrice"
                name="originalPrice"
                placeholder="20000"
                value={formData.originalPrice}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="fuelType">Fuel Type</label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                required
              >
                <option value="gasoline">Gasoline (Petrol)</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric (EV)</option>
                <option value="hybrid">Hybrid (Petrol/Electric)</option>
                <option value="plug-in-hybrid">Plug-in Hybrid (PHEV)</option>
                <option value="cng">Compressed Natural Gas (CNG)</option>
                <option value="lpg">Liquefied Petroleum Gas (LPG)</option>
                <option value="ethanol">Ethanol (E85)</option>
                <option value="hydrogen">Hydrogen (Fuel Cells)</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="mileage">Mileage</label>
              <input
                type="text"
                id="mileage"
                name="mileage"
                placeholder="25000 Km"
                value={formData.mileage}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="year">Year</label>
              <input
                type="text"
                id="year"
                name="year"
                placeholder="2020"
                value={formData.year}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="exteriorColor">Exterior Color</label>
              <input
                type="text"
                id="exteriorColor"
                name="exteriorColor"
                placeholder="Color"
                value={formData.exteriorColor}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="warranty">Warranty</label>
              <select
                id="warranty"
                name="warranty"
                value={formData.warranty}
                onChange={handleInputChange}
              >
                <option value="Available">Available</option>
                <option value="Not available">Not available</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="door">Door</label>
              <select
                id="door"
                name="door"
                value={formData.door}
                onChange={handleInputChange}
              >
                <option value="">Select Door</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="origin">Origin</label>
              <select
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
              >
                <option value="gcc">GCC</option>
                <option value="us">US</option>
                <option value="eu">EU</option>
                <option value="cad">CAD</option>
                <option value="korean">Korean</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="transmission">Transmission</label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="cvt">CVT</option>
                <option value="dual-clutch">Dual-Clutch</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="bodyType">Body Type</label>
              <select
                id="bodyType"
                name="bodyType"
                value={formData.bodyType}
                onChange={handleInputChange}
              >
                <option value="sedan">Sedan</option>
                <option value="hatchback">Hatchback</option>
                <option value="suv">SUV</option>
                <option value="coupe">Coupe</option>
                <option value="convertible">Convertible</option>
                <option value="sport">Sport</option>
                <option value="crossover suv">Crossover SUV</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="engine">Engine</label>
              <input
                type="text"
                id="engine"
                name="engine"
                placeholder="1000cc"
                value={formData.engine}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="testDrive">Test Drive</label>
              <select
                id="testDrive"
                name="testDrive"
                value={formData.testDrive}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="featured">Featured</label>
              <select
                id="featured"
                name="featured"
                value={formData.featured}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="saleStatus">Sale Status</label>
              <select
                id="saleStatus"
                name="saleStatus"
                value={formData.saleStatus}
                onChange={handleInputChange}
              >
                <option value="for-sale">For Sale</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div className="formGroup">
              <label htmlFor="discountedPrice">Discounted Price</label>
              <input
                type="number"
                id="discountedPrice"
                name="discountedPrice"
                placeholder="12000"
                value={formData.discountedPrice}
                onChange={handleInputChange}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="servicePackage">Service Package</label>
              <select
                id="servicePackage"
                name="servicePackage"
                value={formData.servicePackage}
                onChange={handleInputChange}
              >
                <option value="Available">Available</option>
                <option value="Not available">Not available</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="carMediaSecHeading">Upload Photos of Your Car</h3>
            <div
              className="dropZone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("carImages")?.click()}
            >
              <img src={uploadIcon} alt="Upload" />
              <p className="dragDropText">Drag and drop images here</p>
              <button className="uploadCarMediaBtn">
                Browse Files
                <span><i className='bx bxs-arrow-from-bottom'></i></span>
              </button>
              <input
                type="file"
                id="carImages"
                name="carImages"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
            <div className="imageGrid">
              {previewImages.map((preview, index) => (
                <div
                  key={index}
                  className="imageCard"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropImage(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    opacity: dragIndex === index ? 0.5 : 1,
                    cursor: "grab"
                  }}
                >
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    onClick={() => removeImage(index)}
                    className="removeImageButton"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="addCarButtonWrapper">
              <button className="cancelFormBtn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="createBtn" onClick={handleSubmit}>
                Update
              </button>
            </div>
          </div>
        )}

        {showCarInfo && (
          <>
            <div className="checkboxesContainer">
              {allTrims.find((t) => t._id === formData.trimId)?.specifications?.map((spec, index) => (
                <div key={index} className="checkboxBLock">
                  <input
                    type="checkbox"
                    id={`spec-${index}`}
                    checked={formData.specifications[spec] ?? false}
                    onChange={(e) => handleSpecChange(spec, e.target.checked)}
                  />
                  <label htmlFor={`spec-${index}`}>{spec}</label>
                </div>
              )) || <p>Select a trim to see specifications.</p>}
            </div>

            <div style={{ height: "400px" }} className="formGroup">
              <label>Car Description</label>
              <div style={{ height: "100%" }} data-color-mode="light">
                <ReactQuill
                  value={formData.description}
                  onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                  theme="snow"
                  style={{ height: "70%", width: "100%" }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}