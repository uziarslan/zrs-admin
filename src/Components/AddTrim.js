import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "../Components/Flash";
import { AuthContext } from "../Context/AuthContext";

const AddTrim = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]); // State for vehicle types
  const [trims, setTrims] = useState([]); // State for vehicle trims
  const [formData, setFormData] = useState({
    vehicleTypeId: "", // Changed from manufacturerId to vehicleTypeId
    trimName: "", // Changed from modelName to trimName
    specifications: [""], // Array to hold specification inputs
  });
  const [message, setMessage] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null); // Track the ID of the trim being edited
  const [activeAccordion, setActiveAccordion] = useState(null); // Track which accordion is open

  const { setIsLoading } = useContext(AuthContext);

  // Fetch vehicle types and trims
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch vehicle types
        const vehicleTypesResponse = await axiosInstance.get(
          "/api/v1/fetch-vehicle-types"
        );
        if (vehicleTypesResponse.status === 200) {
          setVehicleTypes(vehicleTypesResponse.data.vehicleTypes);
        }

        // Fetch vehicle trims
        const trimsResponse = await axiosInstance.get(
          "/api/v1/fetch-vehicle-trims"
        );
        if (trimsResponse.status === 200) {
          setTrims(trimsResponse.data.trims);
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

  const handleSpecChange = (index, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index] = value;
    setFormData((prevState) => ({
      ...prevState,
      specifications: newSpecs,
    }));
  };

  const addSpecification = () => {
    setFormData((prevState) => ({
      ...prevState,
      specifications: [...prevState.specifications, ""],
    }));
  };

  const removeSpecification = (index) => {
    const newSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData((prevState) => ({
      ...prevState,
      specifications: newSpecs,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        vehicleType: formData.vehicleTypeId,
        trimName: formData.trimName,
        specifications: formData.specifications.filter((spec) => spec.trim()), // Remove empty specifications
      };

      let response;
      if (editMode) {
        // Update existing trim
        response = await axiosInstance.put(
          `/api/v1/update-vehicle-trim/${editId}`,
          payload
        );
        setMessage({ success: "Vehicle trim updated successfully" });
      } else {
        // Create new trim
        response = await axiosInstance.post(
          "/api/v1/create-vehicle-trim",
          payload
        );
        setMessage({ success: "Vehicle trim created successfully" });
      }

      if (response.status === 201 || response.status === 200) {
        setFormData({
          vehicleTypeId: "",
          trimName: "",
          specifications: [""],
        });
        setEditMode(false);
        setEditId(null);

        // Refresh trims after creation or update
        const trimsResponse = await axiosInstance.get(
          "/api/v1/fetch-vehicle-trims"
        );
        if (trimsResponse.status === 200) {
          setTrims(trimsResponse.data.trims);
        }
      }
    } catch (error) {
      console.error(error);
      setMessage({
        error: error.response?.data?.error || "Failed to process vehicle trim",
      });
    }
    setIsLoading(false);
  };

  // Handle editing a trim
  const handleEdit = (trim) => {
    setFormData({
      vehicleTypeId: trim.vehicleType._id || trim.vehicleType, // Handle both populated and ID format
      trimName: trim.trimName,
      specifications: trim.specifications || [""], // Default to empty array if no specs
    });
    setEditMode(true);
    setEditId(trim._id);
  };

  // Handle deleting a trim
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle trim?")) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.delete(
          `/api/v1/delete-vehicle-trim/${id}`
        );
        if (response.status === 200) {
          setMessage({ success: "Vehicle trim deleted successfully" });
          // Refresh trims after deletion
          const trimsResponse = await axiosInstance.get(
            "/api/v1/fetch-vehicle-trims"
          );
          if (trimsResponse.status === 200) {
            setTrims(trimsResponse.data.trims);
          }
        }
      } catch (error) {
        console.error(error);
        setMessage({ error: "Failed to delete vehicle trim" });
      }
      setIsLoading(false);
    }
  };

  // Handle canceling the edit
  const handleCancel = () => {
    setFormData({
      vehicleTypeId: "",
      trimName: "",
      specifications: [""],
    });
    setEditMode(false);
    setEditId(null);
    setMessage({}); // Clear any messages
  };

  // Toggle accordion
  const toggleAccordion = (vehicleTypeId) => {
    setActiveAccordion(
      activeAccordion === vehicleTypeId ? null : vehicleTypeId
    );
  };

  return (
    <div>
      <Flash message={message} />
      <h2 className="screenHeading">Add Vehicle Trim</h2>
      <p className="screenSubHeading">We are glad to see you again!</p>
      <form className="manufactureForm" onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="vehicleTypeId">Vehicle Type</label>
          <select
            id="vehicleTypeId"
            name="vehicleTypeId"
            value={formData.vehicleTypeId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Vehicle Type</option>
            {vehicleTypes.map(({ modelName, _id }) => (
              <option key={_id} value={_id}>
                {modelName}
              </option>
            ))}
          </select>
        </div>
        <div className="formGroup">
          <label htmlFor="trimName">Vehicle Trim</label>
          <input
            type="text"
            id="trimName"
            name="trimName"
            placeholder="Vehicle Trim"
            value={formData.trimName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="formGroup">
          <label>Specifications</label>
          {formData.specifications.map((spec, index) => (
            <div key={index} className="d-flex align-items-center mb-2">
              <input
                type="text"
                value={spec}
                onChange={(e) => handleSpecChange(index, e.target.value)}
                className="form-control me-2"
                placeholder={`Specification ${index + 1}`}
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeSpecification(index)}
                disabled={formData.specifications.length === 1}
              >
                <i className="bx bx-trash"></i>
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-success mt-2"
            onClick={addSpecification}
          >
            <i className="bx bx-plus-circle"></i>
          </button>
        </div>
        <button type="submit">{editMode ? "Update" : "Submit"}</button>
        {editMode && (
          <button type="button" className="cancelBtn" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </form>

      {/* Accordion for vehicle types and trims */}
      <div className="accordion mt-4" id="vehicleTypesAccordion">
        {vehicleTypes.length > 0 ? (
          vehicleTypes.map((vehicleType) => {
            const typeTrims = trims.filter(
              (trim) =>
                trim.vehicleType._id.toString() === vehicleType._id.toString()
            );
            if (typeTrims.length === 0) return null;

            return (
              <div className="accordion-item" key={vehicleType._id}>
                <h2
                  className="accordion-header"
                  id={`heading-${vehicleType._id}`}
                >
                  <button
                    className={`accordion-button ${
                      activeAccordion === vehicleType._id ? "" : "collapsed"
                    }`}
                    type="button"
                    onClick={() => toggleAccordion(vehicleType._id)}
                    aria-expanded={activeAccordion === vehicleType._id}
                    aria-controls={`collapse-${vehicleType._id}`}
                  >
                    {vehicleType.modelName}
                  </button>
                </h2>
                <div
                  id={`collapse-${vehicleType._id}`}
                  className={`accordion-collapse collapse ${
                    activeAccordion === vehicleType._id ? "show" : ""
                  }`}
                  aria-labelledby={`heading-${vehicleType._id}`}
                  data-bs-parent="#vehicleTypesAccordion"
                >
                  <div className="accordion-body">
                    <ul className="list-group">
                      {typeTrims.map((trim) => (
                        <li
                          key={trim._id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {trim.trimName}
                          <div>
                            <i
                              className="bx bx-edit bx-sm text-success me-2 cursor-pointer"
                              onClick={() => handleEdit(trim)}
                            ></i>
                            <i
                              className="bx bx-trash bx-sm text-danger cursor-pointer"
                              onClick={() => handleDelete(trim._id)}
                            ></i>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="mt-4">No vehicle types or trims found.</p>
        )}
      </div>
    </div>
  );
};

export default AddTrim;
