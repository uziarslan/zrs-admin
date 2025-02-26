import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "../services/axiosInstance"; // Adjust path as needed
import { AuthContext } from "../Context/AuthContext";
import arrowLeft from "../Assets/icons/arrow-left.svg"; // Adjust paths as needed
import arrowRight from "../Assets/icons/arrow-right.svg"; // Adjust paths as needed

const Users = () => {
  const { setIsLoading } = useContext(AuthContext);
  const [financeData, setFinanceData] = useState([]);
  const [sellCarData, setSellCarData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("sellCar");
  const [selectedImages, setSelectedImages] = useState(null); // For image modal
  const itemsPerPage = 5;

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const financeResponse = await axiosInstance.get("/api/v1/finance-eligibility");
        setFinanceData(financeResponse.data || []);

        const sellCarResponse = await axiosInstance.get("/api/v1/sell-car");
        setSellCarData(sellCarResponse.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setIsLoading]);

  // Get current items for pagination
  const totalItems = activeTab === "finance" ? financeData.length : sellCarData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData =
    activeTab === "finance"
      ? financeData.slice(indexOfFirstItem, indexOfLastItem)
      : sellCarData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pagination = [];
    const maxVisiblePages = 5;

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

    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    if (endPage - startPage < maxVisiblePages - 3) {
      if (startPage > 2) {
        startPage = Math.max(2, startPage - (maxVisiblePages - 3 - (endPage - startPage)));
      }
      if (endPage < totalPages - 1) {
        endPage = Math.min(totalPages - 1, endPage + (maxVisiblePages - 3 - (endPage - startPage)));
      }
    }

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
          className={`pagination-arrow ${currentPage === totalPages ? "disabled" : ""}`}
          aria-label="Next page"
        >
          <img src={arrowRight} alt="Next page" />
        </button>
      </div>
    );
  };

  // Handle download
  const handleDownload = () => {
    console.log("Download file clicked");
    // Add download logic here
  };

  // Image modal handlers
  const openImageModal = (images) => {
    setSelectedImages(images);
  };

  const closeImageModal = () => {
    setSelectedImages(null);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h1 className="screenHeading">Users</h1>
          <p className="screenSubHeading">We are glad to see you again!</p>
        </div>
        <button className="download-btn" onClick={handleDownload}>
          Download file
        </button>
      </div>
      <div className="adminRenderTable">
        <div className="admin-actions">
          <button
            className={`action-btn ${activeTab === "sellCar" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("sellCar");
              setCurrentPage(1);
            }}
          >
            Sell Car
          </button>
          <button
            className={`action-btn ${activeTab === "sell" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("sell");
              setCurrentPage(1);
            }}
          >
            Test Drive
          </button>
          <button
            className={`action-btn ${activeTab === "finance" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("finance");
              setCurrentPage(1);
            }}
          >
            Finance
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Mobile Number</th>
                {activeTab === "sellCar" ? <th>Description</th> : <th>Query</th>}
                {activeTab === "sellCar" && <th>Image</th>}
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item._id}>
                  <td>{item.fullName || "N/A"}</td>
                  <td>{item.email || "N/A"}</td>
                  <td>{item.mobileNumber || "N/A"}</td>
                  <td>
                    {activeTab === "finance"
                      ? `Finance query for ${item.manufacturer} ${item.vehicleType}`
                      : activeTab === "sell"
                      ? `Sell car query for ${item.manufacturer} ${item.vehicleType}`
                      : item.description || `Sell car query for ${item.manufacturer} ${item.vehicleType}`}
                  </td>
                  {activeTab === "sellCar" && (
                    <td className="image-cell">
                      {item.images && item.images.length > 0 ? (
                        <a href="#!" onClick={() => openImageModal(item.images)}>
                          Images({item.images.length})
                        </a>
                      ) : (
                        "No image"
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {renderPagination()}

      {/* Bootstrap Modal */}
      {selectedImages && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Car Images</h5>
                <button type="button" className="btn-close" onClick={closeImageModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {selectedImages.map((image, index) => (
                  <img
                    key={image._id}
                    src={image.path}
                    alt={`Car image ${index + 1}`}
                    className="img-fluid mb-3"
                  />
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeImageModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;