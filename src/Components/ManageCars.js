import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import mileage from "../Assets/icons/mileage.svg";
import color from "../Assets/icons/color.svg";
import calender from "../Assets/icons/calender.svg";
import carIcon from "../Assets/icons/car.svg";
import engine from "../Assets/icons/engine.svg";
import arrowLeft from "../Assets/icons/arrow-left.svg";
import arrowRight from "../Assets/icons/arrow-right.svg";
import arrow from "../Assets/icons/arrow.svg";

// Import EditCar component (ensure this path is correct)
import EditCar from "./EditCar";

export default function ManageCars() {
  const [cars, setCars] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCars, setFilteredCars] = useState([]); // State for filtered cars
  const [filters, setFilters] = useState({
    manufacturer: "",
    vehicleType: "",
    fuelType: "",
    bodyType: "",
    transmission: "",
  });
  const [searchKeyword, setSearchKeyword] = useState(""); // State for search keyword
  const [selectedCar, setSelectedCar] = useState(null); // State for the car being edited
  const itemsPerPage = 6; // Matches 2x3 grid in image

  // Fetch all cars from the backend (no pagination in backend)
  const fetchAllCars = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/cars"); // Fetch all cars without pagination
      if (response.status === 200) {
        setCars(response.data.data || []);
        setFilteredCars(response.data.data || []); // Initialize filtered cars
      }
    } catch (err) {
      console.error("Error fetching cars:", err);
    }
  };

  useEffect(() => {
    fetchAllCars();
  }, []); // Fetch only on mount, no page dependency

  // Apply filters and search when filters or searchKeyword change
  useEffect(() => {
    let filtered = [...cars];

    // Apply filters
    if (filters.manufacturer) {
      filtered = filtered.filter(
        (car) => car.manufacturerId?.brandName === filters.manufacturer
      );
    }
    if (filters.vehicleType) {
      filtered = filtered.filter(
        (car) => car.vehicleTypeId?.modelName === filters.vehicleType
      );
    }
    if (filters.fuelType) {
      filtered = filtered.filter((car) => car.fuelType === filters.fuelType);
    }
    if (filters.bodyType) {
      filtered = filtered.filter((car) => car.bodyType === filters.bodyType);
    }
    if (filters.transmission) {
      filtered = filtered.filter(
        (car) => car.transmission === filters.transmission
      );
    }

    // Apply keyword search (case-insensitive, support multiple words with spaces)
    if (searchKeyword.trim()) {
      const searchWords = searchKeyword
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0); // Split by whitespace, remove empty strings

      filtered = filtered.filter((car) => {
        const fields = [
          car.manufacturerId?.brandName,
          car.vehicleTypeId?.modelName,
          car.trimId?.trimName,
          car.title,
        ].filter(Boolean); // Filter out null/undefined fields

        return searchWords.every((word) =>
          fields.some((field) => field.toLowerCase().includes(word))
        );
      });
    }

    setFilteredCars(filtered);
    setCurrentPage(1); // Reset to first page when filters or search change
    setSelectedCar(null); // Close edit form when filters or search change
  }, [cars, filters, searchKeyword]);

  // Calculate total pages with safety checks (client-side, based on filtered cars)
  const totalItems = Array.isArray(filteredCars) ? filteredCars.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage)); // Ensure at least 1 page

  // Get current cars for the page, with safety checks
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCars = Array.isArray(filteredCars)
    ? filteredCars.slice(indexOfFirstItem, indexOfLastItem)
    : [];

  // Scroll to top of manageCarsSection when page changes
  useEffect(() => {
    const manageCarsSection = document.querySelector(".manageCarsSection");
    if (manageCarsSection) {
      manageCarsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentPage]);

  // Reset to first page when filteredCars data changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCar(null); // Close edit form when filtered cars change
  }, [filteredCars]);

  // Handle page change with bounds checking
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedCar(null); // Close edit form when changing pages
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  // Handle search keyword change
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // Handle car card click to show edit form
  const handleEditCar = (car) => {
    setSelectedCar(car);
  };

  // Handle closing the edit form
  const handleCloseEdit = () => {
    setSelectedCar(null);
  };

  // Render pagination matching the image (1, current ±2, ..., last, up to 5 buttons)
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pagination = [];
    const maxVisiblePages = 5; // Show up to 5 page numbers/buttons

    // Always show first page
    pagination.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={currentPage === 1 ? "active" : ""}
        aria-label={`Page 1`}
      >
        1
      </button>
    );

    // Determine the range of pages to show (up to 2 before and 2 after current page)
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    // Ensure we show at least maxVisiblePages - 2 pages (excluding first and last)
    if (endPage - startPage < maxVisiblePages - 3) {
      if (startPage > 2) {
        startPage = Math.max(
          2,
          startPage - (maxVisiblePages - 3 - (endPage - startPage))
        );
      }
      if (endPage < totalPages - 1) {
        endPage = Math.min(
          totalPages - 1,
          endPage + (maxVisiblePages - 3 - (endPage - startPage))
        );
      }
    }

    // Add ellipsis and middle pages
    if (startPage > 2) {
      pagination.push(<span key="start-ellipsis">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pagination.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={currentPage === i ? "active" : ""}
          aria-label={`Page ${i}`}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages - 1) {
      pagination.push(<span key="end-ellipsis">...</span>);
    }

    if (totalPages > 1) {
      pagination.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={currentPage === totalPages ? "active" : ""}
          aria-label={`Page ${totalPages}`}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`pagination-arrow ${currentPage === 1 ? "disabled" : ""}`}
          aria-label="Previous page"
        >
          <img src={arrowLeft} alt="Previous page" />
        </button>
        {pagination}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`pagination-arrow ${currentPage === totalPages ? "disabled" : ""
            }`}
          aria-label="Next page"
        >
          <img src={arrowRight} alt="Next page" />
        </button>
      </div>
    );
  };

  // Render either the car list or the EditCar component, not both
  return selectedCar ? (
    <EditCar
      car={selectedCar}
      onClose={handleCloseEdit}
      onUpdate={() => {
        setSelectedCar(null); // Close edit form after update
        fetchAllCars(); // Refresh car list
      }}
    />
  ) : (
    <section className="manageCarsSection">
      <div className="manageCarsHeader">
        <div className="mainSec">
          <h2 className="manageCarsHeading">Manage Cars</h2>
          <p className="manageCarsSubHeading">We are glad to see you again!</p>
        </div>
      </div>
      {/* Filters and Search in a scrollable container */}
      <div className="filtersContainer">
        <div className="scrollableFilters">
          <select
            value={filters.manufacturer}
            onChange={(e) => handleFilterChange("manufacturer", e.target.value)}
          >
            <option value="">All Manufacturers</option>
            {Array.from(
              new Set(cars.map((car) => car.manufacturerId?.brandName))
            ).map((brand, index) => (
              <option key={index} value={brand}>
                {brand || "Unknown Brand"}
              </option>
            ))}
          </select>
          <select
            value={filters.vehicleType}
            onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
          >
            <option value="">All Vehicle Types</option>
            {Array.from(
              new Set(cars.map((car) => car.vehicleTypeId?.modelName))
            ).map((model, index) => (
              <option key={index} value={model}>
                {model || "Unknown Model"}
              </option>
            ))}
          </select>
          <select
            value={filters.fuelType}
            onChange={(e) => handleFilterChange("fuelType", e.target.value)}
          >
            <option value="">All Fuel Types</option>
            {Array.from(new Set(cars.map((car) => car.fuelType))).map(
              (fuel, index) => (
                <option key={index} value={fuel}>
                  {fuel || "Unknown Fuel"}
                </option>
              )
            )}
          </select>
          <select
            value={filters.bodyType}
            onChange={(e) => handleFilterChange("bodyType", e.target.value)}
          >
            <option value="">All Body Types</option>
            {Array.from(new Set(cars.map((car) => car.bodyType))).map(
              (body, index) => (
                <option key={index} value={body}>
                  {body || "Unknown Body"}
                </option>
              )
            )}
          </select>
          <select
            value={filters.transmission}
            onChange={(e) => handleFilterChange("transmission", e.target.value)}
          >
            <option value="">All Transmissions</option>
            {Array.from(new Set(cars.map((car) => car.transmission))).map(
              (trans, index) => (
                <option key={index} value={trans}>
                  {trans || "Unknown Transmission"}
                </option>
              )
            )}
          </select>
        </div>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchKeyword}
          onChange={handleSearchChange}
        />
      </div>
      <section className="allCarsWrapper">
        <div className="carCardHolder">
          {currentCars.length > 0 ? (
            currentCars.map((car) => (
              <div
                key={car._id}
                className="cardLink" // Keep the same class for styling
                onClick={() => handleEditCar(car)} // Open edit form on click
                style={{ cursor: "pointer" }} // Indicate clickable
              >
                <div className="cardBody">
                  <div className="cardHeader">
                    <div className="carTitle">
                      <div className="manufacturerLogo">
                        <img
                          src={car.manufacturerId.logo.path}
                          alt="Manufacturer Logo"
                        />
                      </div>
                      <div className="manufacturerInfo">
                        <h4 className="manTypeTrim">
                          {car.manufacturerId?.brandName || "Unknown Brand"}{" "}
                          {car.vehicleTypeId?.modelName || "Unknown Model"}{" "}
                          {car.trimId?.trimName || "Unknown Trim"}
                          {car.title ? ` - ${car.title}` : ""}
                        </h4>
                        <p className="fuelType">{car.fuelType}</p>
                      </div>
                    </div>
                    <div className="pricingInfo">
                      <div className="priceContainer">
                        <p className="price">
                          AED {car.discountedPrice || car.originalPrice}
                        </p>
                        {car.discountedPrice && (
                          <span>AED {car.originalPrice}</span>
                        )}
                        <h5 className="monthlyLease">
                          AED{" "}
                          {Math.round(
                            (car.discountedPrice || car.originalPrice) / 12
                          )}
                          /MONTH
                        </h5>
                      </div>
                      <div className="arrowButton">
                        <img src={arrow} alt="Button" />
                      </div>
                    </div>
                  </div>
                  <div className="carThumbnailContainer">
                    <img src={car.images[0]?.path} alt="Car Thumbnail" />
                  </div>
                  <div className="cardDetailsContainer">
                    <div className="singleInfoBlock">
                      <img src={mileage} alt="Mileage Icon" />
                      <p className="singleInfoValue">{car.mileage || "N/A"}</p>
                    </div>
                    <div className="singleInfoBlock">
                      <img src={calender} alt="Year Icon" />
                      <p className="singleInfoValue">{car.year || "N/A"}</p>
                    </div>
                    <div className="singleInfoBlock">
                      <img src={color} alt="Color Icon" />
                      <p className="singleInfoValue">
                        {car.exteriorColor || "N/A"}
                      </p>
                    </div>
                    <div className="singleInfoBlock">
                      <img src={carIcon} alt="Body Type Icon" />
                      <p className="singleInfoValue">{car.bodyType || "N/A"}</p>
                    </div>
                    <div className="singleInfoBlock">
                      <img src={engine} alt="Engine Icon" />
                      <p className="singleInfoValue">{car.engine || "N/A"}</p>
                    </div>
                    <div className="singleInfoBlock">
                      <img src={carIcon} alt="Transmission Icon" />
                      <p className="singleInfoValue">
                        {car.transmission || "N/A"}
                      </p>
                    </div>
                    <div className="singleInfoBlock">
                      <img src={carIcon} alt="Doors Icon" />
                      <p className="singleInfoValue">{car.door || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No cars available</p>
          )}
        </div>
        {renderPagination()}
      </section>
    </section>
  );
}
