import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "../Components/Flash";
import { AuthContext } from "../Context/AuthContext";

// Assuming BoxIcons are included via CDN or npm (e.g., <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">)
// or installed via npm: `npm install boxicons`

const AddVehicleType = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]); // State for vehicle types
  const [formData, setFormData] = useState({
    manufacturerId: "",
    modelName: "",
  });
  const [message, setMessage] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null); // Track the ID of the vehicle type being edited
  const [activeAccordion, setActiveAccordion] = useState(null); // Track which accordion is open

  const { setIsLoading } = useContext(AuthContext);

  // Fetch manufacturers and vehicle types
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch manufacturers
        const manufacturersResponse = await axiosInstance.get(
          "/api/v1/fetch-logos"
        );
        if (manufacturersResponse.status === 200) {
          setManufacturers(() =>
            manufacturersResponse.data.logos.map((logo) => ({
              _id: logo._id,
              brandName: logo.brandName,
            }))
          );
        }

        // Fetch vehicle types
        const vehicleTypesResponse = await axiosInstance.get(
          "/api/v1/fetch-vehicle-types"
        );
        if (vehicleTypesResponse.status === 200) {
          setVehicleTypes(vehicleTypesResponse.data.vehicleTypes);
        }
      } catch (error) {
        console.error(error);
        setMessage({ error: "Failed to fetch data" });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [setIsLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        manufacturer: formData.manufacturerId,
        modelName: formData.modelName,
      };

      let response;
      if (editMode) {
        // Update existing vehicle type
        response = await axiosInstance.put(
          `/api/v1/update-vehicle-type/${editId}`,
          payload
        );
        setMessage({ success: "Vehicle type updated successfully" });
      } else {
        // Create new vehicle type
        response = await axiosInstance.post(
          "/api/v1/create-vehicle-type",
          payload
        );
        setMessage({ success: "Vehicle type created successfully" });
      }

      if (response.status === 201 || response.status === 200) {
        setFormData({
          manufacturerId: "",
          modelName: "",
        });
        setEditMode(false);
        setEditId(null);

        // Refresh vehicle types
        const vehicleTypesResponse = await axiosInstance.get(
          "/api/v1/fetch-vehicle-types"
        );
        if (vehicleTypesResponse.status === 200) {
          setVehicleTypes(vehicleTypesResponse.data.vehicleTypes);
        }
      }
    } catch (error) {
      console.error(error);
      setMessage({
        error: error.response?.data?.error || "Failed to process vehicle type",
      });
    }
    setIsLoading(false);
  };

  // Handle editing a vehicle type
  const handleEdit = (vehicleType) => {
    setFormData({
      manufacturerId: vehicleType.manufacturer._id || vehicleType.manufacturer, // Handle both populated and ID format
      modelName: vehicleType.modelName,
    });
    setEditMode(true);
    setEditId(vehicleType._id);
  };

  // Handle deleting a vehicle type
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle type?")) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.delete(
          `/api/v1/delete-vehicle-type/${id}`
        );
        if (response.status === 200) {
          setMessage({ success: "Vehicle type deleted successfully" });
          // Refresh vehicle types
          const vehicleTypesResponse = await axiosInstance.get(
            "/api/v1/fetch-vehicle-types"
          );
          if (vehicleTypesResponse.status === 200) {
            setVehicleTypes(vehicleTypesResponse.data.vehicleTypes);
          }
        }
      } catch (error) {
        console.error(error);
        setMessage({ error: "Failed to delete vehicle type" });
      }
      setIsLoading(false);
    }
  };

  // Handle canceling the edit
  const handleCancel = () => {
    setFormData({
      manufacturerId: "",
      modelName: "",
    });
    setEditMode(false);
    setEditId(null);
    setMessage({}); // Clear any messages
  };

  // Handle accordion toggle
  const handleAccordionToggle = (manufacturerId) => {
    setActiveAccordion(
      activeAccordion === manufacturerId ? null : manufacturerId
    );
  };

  return (
    <div>
      <Flash message={message} />
      <h2 className="screenHeading">Add Vehicle Type</h2>
      <p className="screenSubHeading">We are glad to see you again!</p>
      <form className="manufactureForm" onSubmit={handleSubmit}>
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
              <option key={_id} value={_id}>
                {brandName}
              </option>
            ))}
          </select>
        </div>
        <div className="formGroup">
          <label htmlFor="modelName">Vehicle Type</label>
          <input
            type="text"
            id="modelName"
            name="modelName"
            placeholder="Vehicle Type"
            value={formData.modelName}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">{editMode ? "Update" : "Submit"}</button>
        {editMode && (
          <button type="button" className="cancelBtn" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>

      {/* Accordion for Manufacturers and Vehicle Types */}
      <div className="accordion mt-4" id="vehicleTypesAccordion">
        {manufacturers.map((manufacturer) => {
          const manufacturerVehicleTypes = vehicleTypes
            .filter(
              (vehicleType) =>
                vehicleType.manufacturer._id.toString() ===
                  manufacturer._id.toString() ||
                vehicleType.manufacturer === manufacturer._id // Handle both populated and ID format
            )
            .filter((vehicleType) => !editMode || vehicleType._id !== editId); // Hide the card being edited

          if (manufacturerVehicleTypes.length === 0) return null; // Skip if no vehicle types for this manufacturer

          return (
            <div className="accordion-item" key={manufacturer._id}>
              <h2
                className="accordion-header"
                id={`heading-${manufacturer._id}`}
              >
                <button
                  className={`accordion-button ${
                    activeAccordion === manufacturer._id ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() => handleAccordionToggle(manufacturer._id)}
                  aria-expanded={activeAccordion === manufacturer._id}
                  aria-controls={`collapse-${manufacturer._id}`}
                >
                  {manufacturer.brandName}
                </button>
              </h2>
              <div
                id={`collapse-${manufacturer._id}`}
                className={`accordion-collapse collapse ${
                  activeAccordion === manufacturer._id ? "show" : ""
                }`}
                aria-labelledby={`heading-${manufacturer._id}`}
                data-bs-parent="#vehicleTypesAccordion"
              >
                <div className="accordion-body">
                  <ul className="list-group">
                    {manufacturerVehicleTypes.map((vehicleType) => (
                      <li
                        key={vehicleType._id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {vehicleType.modelName}
                        <div>
                          <i
                            className="bx bx-edit bx-sm text-success me-2 cursor-pointer"
                            onClick={() => handleEdit(vehicleType)}
                          ></i>
                          <i
                            className="bx bx-trash bx-sm text-danger cursor-pointer"
                            onClick={() => handleDelete(vehicleType._id)}
                          ></i>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {manufacturers.length > 0 && vehicleTypes.length === 0 && !editMode && (
        <p className="mt-4">No vehicle types found.</p>
      )}
    </div>
  );
};

export default AddVehicleType;
