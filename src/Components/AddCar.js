import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "./Flash";
import { AuthContext } from "../Context/AuthContext";
import uploadIcon from "../Assets/icons/upload.svg";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const AddCar = () => {
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
  const { setIsLoading } = useContext(AuthContext);
  const [dragIndex, setDragIndex] = useState(null); // Track the dragged item index
  const [imageErrors, setImageErrors] = useState({}); // Track which images have errors (index -> error message)
  const [imageSizes, setImageSizes] = useState({}); // Track file sizes (index -> size in MB)

  // Fetch manufacturers, vehicle types, and trims
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const manufacturersResponse = await axiosInstance.get("/api/v1/fetch-logos");
        if (manufacturersResponse.status === 200) {
          setManufacturers(
            manufacturersResponse.data.logos.map((logo) => ({
              _id: logo._id,
              brandName: logo.brandName,
            }))
          );
        }

        const vehicleTypesResponse = await axiosInstance.get("/api/v1/fetch-vehicle-types");
        if (vehicleTypesResponse.status === 200) {
          setVehicleTypes(vehicleTypesResponse.data.vehicleTypes || []);
        }

        const trimsResponse = await axiosInstance.get("/api/v1/fetch-vehicle-trims");
        if (trimsResponse.status === 200) {
          setAllTrims(trimsResponse.data.trims || []);
        }
      } catch (error) {
        console.error(error);
        setMessage({ error: "Failed to fetch data" });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [setIsLoading]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  // Initialize specifications when a trim is selected
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

  // Format file size to readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Handle image selection and preview
  const handleImageUpload = (e) => {
    const files = e.type === "change" ? e.target.files : e.dataTransfer.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    const newPreviews = [];
    const allFiles = [];
    const newErrors = {};
    const newSizes = {};
    const startIndex = previewImages.length;

    fileArray.forEach((file, fileIndex) => {
      const currentIndex = startIndex + fileIndex;
      const fileSize = file.size;
      const fileSizeMB = fileSize / (1024 * 1024);

      // Always add preview and track size
      newPreviews.push(URL.createObjectURL(file));
      allFiles.push(file);
      newSizes[currentIndex] = fileSizeMB;

      // Mark as error if exceeds limit
      if (fileSize > MAX_SIZE) {
        newErrors[currentIndex] = `File size (${formatFileSize(fileSize)}) exceeds 10MB limit`;
      }
    });

    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...allFiles],
    }));
    setImageErrors((prev) => ({ ...prev, ...newErrors }));
    setImageSizes((prev) => ({ ...prev, ...newSizes }));

    // Show error message if any files exceed limit
    if (Object.keys(newErrors).length > 0) {
      const errorCount = Object.keys(newErrors).length;
      setMessage({
        error: `${errorCount} file(s) exceed the 10MB limit. Please remove them before uploading.`
      });
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.setData("text/plain", index); // Required for Firefox
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  // Helper function to reorder object keys based on drag and drop
  const reorderObjectKeys = (obj, fromIndex, toIndex) => {
    const entries = Object.entries(obj).map(([key, value]) => [parseInt(key), value]);
    const sortedEntries = entries.sort((a, b) => a[0] - b[0]);

    if (fromIndex === toIndex) return obj;

    const reordered = {};
    sortedEntries.forEach(([key, value]) => {
      let newKey = key;
      if (key === fromIndex) {
        newKey = toIndex;
      } else if (fromIndex < toIndex) {
        // Moving down
        if (key > fromIndex && key <= toIndex) {
          newKey = key - 1;
        }
      } else {
        // Moving up
        if (key >= toIndex && key < fromIndex) {
          newKey = key + 1;
        }
      }
      reordered[newKey] = value;
    });

    return reordered;
  };

  const handleDropImage = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newPreviewImages = [...previewImages];
    const newImages = [...formData.images];

    // Reorder preview images
    const [draggedPreview] = newPreviewImages.splice(dragIndex, 1);
    newPreviewImages.splice(dropIndex, 0, draggedPreview);

    // Reorder actual file arrays
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Reorder errors and sizes using helper function
    const reorderedErrors = reorderObjectKeys(imageErrors, dragIndex, dropIndex);
    const reorderedSizes = reorderObjectKeys(imageSizes, dragIndex, dropIndex);

    setPreviewImages(newPreviewImages);
    setFormData((prev) => ({ ...prev, images: newImages }));
    setImageErrors(reorderedErrors);
    setImageSizes(reorderedSizes);
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

  // Remove an image
  const removeImage = (indexToRemove) => {
    setPreviewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));

    // Clean up errors and sizes for removed image
    setImageErrors((prev) => {
      const newErrors = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum < indexToRemove) {
          newErrors[keyNum] = prev[key];
        } else if (keyNum > indexToRemove) {
          newErrors[keyNum - 1] = prev[key];
        }
      });
      return newErrors;
    });

    setImageSizes((prev) => {
      const newSizes = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum < indexToRemove) {
          newSizes[keyNum] = prev[key];
        } else if (keyNum > indexToRemove) {
          newSizes[keyNum - 1] = prev[key];
        }
      });
      return newSizes;
    });
  };

  // Toggle between sections
  const handleToggleSection = (section) => {
    setShowCarInfo(section === "carInfo");
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Check if there are any image errors before submitting
    if (Object.keys(imageErrors).length > 0) {
      setMessage({
        error: "Please remove images that exceed 10MB before submitting."
      });
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "images") {
          formDataToSend.append(
            key,
            key === "specifications" ? JSON.stringify(value) : value
          );
        }
      });

      // Append only valid images (those without errors) in the order they appear
      formData.images.forEach((file, index) => {
        if (!imageErrors[index]) {
          formDataToSend.append("images", file);
        }
      });

      const response = await axiosInstance.post("/api/v1/cars", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        setMessage({ success: "Car added successfully" });
        setFormData({
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
        setPreviewImages([]);
        setImageErrors({});
        setImageSizes({});
      }
    } catch (error) {
      console.error(error);
      setMessage({ error: "Failed to add car" });
    }
    setIsLoading(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
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
    setPreviewImages([]);
    setImageErrors({});
    setImageSizes({});
    setShowCarInfo(true);
  };

  return (
    <div>
      <Flash message={message} />
      <h2 className="screenHeading">Add New Car</h2>
      <p className="screenSubHeading">We are glad to see you again!</p>
      <header className="addCarHeader">
        <p onClick={() => handleToggleSection("carInfo")} className={`${showCarInfo ? "active" : ""}`}>
          Car Info
        </p>
        <p onClick={() => handleToggleSection("carMedia")} className={`${!showCarInfo ? "active" : ""}`}>
          Car Media
        </p>
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
                type="text"
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
                <option value="no">No</option>
                <option value="yes">Yes</option>
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
                type="text"
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
              {previewImages.map((preview, index) => {
                const hasError = imageErrors[index];
                const fileSize = imageSizes[index];
                return (
                  <div
                    key={index}
                    className={`imageCard ${hasError ? "imageCardError" : ""}`}
                    draggable={!hasError}
                    onDragStart={(e) => !hasError && handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => !hasError && handleDropImage(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: dragIndex === index ? 0.5 : 1,
                      cursor: hasError ? "not-allowed" : "grab"
                    }}
                  >
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <div className="imageInfo">
                      {fileSize !== undefined && (
                        <span className={`imageSize ${hasError ? "imageSizeError" : ""}`}>
                          {fileSize.toFixed(2)} MB
                        </span>
                      )}
                      {hasError && (
                        <span className="imageErrorText">
                          <i className="bx bx-error-circle"></i> Too large
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="removeImageButton"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                );
              })}
            </div>
            {Object.keys(imageErrors).length > 0 && (
              <div className="imageErrorSummary">
                <i className="bx bx-error-circle"></i>
                <span>
                  {Object.keys(imageErrors).length} image(s) exceed the 10MB limit.
                  Please remove them before submitting.
                </span>
              </div>
            )}
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

        {showCarInfo && (
          <>
            <div className="checkboxesContainer">
              {allTrims.find((t) => t._id === formData.trimId)?.specifications?.map((spec, index) => (
                <div key={index} className="checkboxBLock">
                  <input
                    type="checkbox"
                    id={`spec-${index}`}
                    checked={formData.specifications[spec] || false}
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
};

export default AddCar;