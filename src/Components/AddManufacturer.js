import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance";
import Flash from "../Components/Flash";
import { AuthContext } from "../Context/AuthContext";

const AddManufacturer = () => {
  const [formData, setFormData] = useState({
    manufacturer: "",
    logo: null,
    logoText: "Upload Logo",
    currentLogo: null,
    currentLogoFilename: null,
  });
  const [message, setMessage] = useState({});
  const [logos, setLogos] = useState([]); // State to hold fetched logos
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const { setIsLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchLogos = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/api/v1/fetch-logos");
        if (response.data && response.data.logos) {
          setLogos(response.data.logos);
        }
      } catch (error) {
        console.error("Error fetching logos:", error);
        setMessage({ error: "Failed to fetch logos" });
      }
      setIsLoading(false);
    };

    fetchLogos();
  }, [setIsLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prevState) => ({
        ...prevState,
        logo: e.target.files[0],
        logoText: e.target.files[0].name,
        currentLogo: null,
        currentLogoFilename: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const form = new FormData();
    form.append("brandName", formData.manufacturer);
    if (formData.logo) {
      form.append("logo", formData.logo);
    }

    try {
      let response;
      if (editMode) {
        response = await axiosInstance.put(
          `/api/v1/update-manufacturer/${editId}`,
          form,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axiosInstance.post(
          "/api/v1/create-manufacturer",
          form,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (response.status === 201 || response.status === 200) {
        setMessage(response.data);
        setFormData({
          manufacturer: "",
          logo: null,
          logoText: "Upload Logo",
          currentLogo: null,
          currentLogoFilename: null,
        });
        setEditMode(false);
        setEditId(null);
        const fetchResponse = await axiosInstance.get("/api/v1/fetch-logos");
        if (fetchResponse.data && fetchResponse.data.logos) {
          setLogos(fetchResponse.data.logos);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        error:
          error.response?.data?.error ||
          "An error occurred while processing your request",
      });
    }
    setIsLoading(false);
  };

  // Function to start editing a manufacturer
  const handleEdit = (logo) => {
    setFormData({
      manufacturer: logo.brandName,
      logo: null,
      logoText: "Current Logo: " + logo.logo.filename,
      currentLogo: logo.logo.path,
      currentLogoFilename: logo.logo.filename,
    });
    setEditMode(true);
    setEditId(logo._id);
  };

  // Function to remove the current logo and send a request to the backend
  const removeCurrentLogo = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/v1/delete-logo`, {
        params: {
          _id: editId,
          filename: formData.currentLogoFilename,
        },
      });
      if (response.status === 200) {
        setFormData((prevState) => ({
          ...prevState,
          logo: null,
          logoText: "Upload Logo",
          currentLogo: null,
          currentLogoFilename: null,
        }));
        // Fetch logos again to reflect the deletion
        const fetchResponse = await axiosInstance.get("/api/v1/fetch-logos");
        if (fetchResponse.data && fetchResponse.data.logos) {
          setLogos(fetchResponse.data.logos);
        }
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      setMessage({ error: "Failed to delete logo" });
    }
    setIsLoading(false);
  };

  return (
    <div>
      <Flash message={message} />
      <h2 className="screenHeading">Add Manufacturer</h2>
      <p className="screenSubHeading">We are glad to see you again!</p>
      <form className="manufactureForm" onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="manufacturer">Manufacturer</label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            placeholder="BMW"
            value={formData.manufacturer}
            onChange={handleInputChange}
          />
        </div>
        <div className="formGroup">
          <label htmlFor="logo">Logo</label>
          {formData.currentLogo ? (
            <div className="currentLogoContainer">
              <img
                src={formData.currentLogo}
                alt="Current Logo"
                className="currentLogo"
              />
              <div className="position-absolute" onClick={removeCurrentLogo}>
                <i className="bx bx-trash"></i>
              </div>
            </div>
          ) : (
            <>
              <input
                type="file"
                id="logo"
                name="logo"
                onChange={handleFileChange}
                className="d-none"
              />
              <div
                onClick={() => document.getElementById("logo").click()}
                className="fileUploadButton"
              >
                {formData.logoText}
              </div>
            </>
          )}
        </div>
        <button type="submit">{editMode ? "Update" : "Create"}</button>
        {editMode && formData.currentLogo && !formData.logo && (
          <button
            type="button"
            className="cancelBtn"
            onClick={() => {
              setEditMode(false);
              setEditId(null);
              setFormData({
                manufacturer: "",
                logo: null,
                logoText: "Upload Logo",
                currentLogo: null,
                currentLogoFilename: null,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <div className="row">
        {logos
          .filter((logo) => logo._id !== editId)
          .map((logo, index) => (
            <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <div className="card">
                {logo.logo && logo.logo.path ? (
                  <img
                    src={logo.logo.path}
                    className="card-img-top"
                    alt={logo.logo.filename}
                  />
                ) : (
                  // Placeholder or default image
                  <div className="noLogoPlaceholder">No Logo</div>
                )}
                <div className="card-body">
                  <h5 className="card-title">{logo.brandName}</h5>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(logo)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default AddManufacturer;
