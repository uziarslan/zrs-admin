import React, { useState, useEffect, useContext, useMemo } from "react";
import axiosInstance from "../services/axiosInstance";
import { AuthContext } from "../Context/AuthContext";
import arrowLeft from "../Assets/icons/arrow-left.svg";
import arrowRight from "../Assets/icons/arrow-right.svg";

const Users = () => {
  const { setIsLoading } = useContext(AuthContext);
  const [data, setData] = useState({
    finance: [],
    sellCar: [],
    contactUs: [],
    testDrive: [],
    buyNow: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("sellCar");
  const [selectedImages, setSelectedImages] = useState(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [financeRes, sellCarRes, contactUsRes, testDriveRes, buyNowRes] = await Promise.all([
          axiosInstance.get("/api/v1/finance-eligibility"),
          axiosInstance.get("/api/v1/sell-car"),
          axiosInstance.get("/api/v1/contact-us"),
          axiosInstance.get("/api/v1/test-drives"),
          axiosInstance.get("/api/v1/buy-car")
        ]);

        const newData = {
          finance: financeRes.data?.data || financeRes.data || [],
          sellCar: sellCarRes.data?.data || sellCarRes.data || [],
          contactUs: contactUsRes.data?.data || contactUsRes.data || [],
          testDrive: testDriveRes.data?.data || testDriveRes.data || [],
          buyNow: buyNowRes.data?.data || buyNowRes.data || []
        };

        setData(newData);
      } catch (err) {
        console.error("Error fetching data:", err);
        console.error("Error response:", err.response?.data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setIsLoading]);

  const { currentData, totalPages } = useMemo(() => {
    const activeData = data[activeTab] || [];
    const total = Math.max(1, Math.ceil(activeData.length / itemsPerPage));
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      currentData: activeData.slice(start, end),
      totalPages: total
    };
  }, [data, activeTab, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxVisiblePages / 2));

    if (currentPage <= Math.floor(maxVisiblePages / 2) + 1) {
      startPage = 2;
      endPage = Math.min(maxVisiblePages, totalPages - 1);
    } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 1);
      endPage = totalPages - 1;
    }

    pages.push(
      <button key={1} onClick={() => handlePageChange(1)} className={currentPage === 1 ? "active" : ""}>
        1
      </button>
    );

    if (startPage > 2) pages.push(<span key="start-ellipsis">...</span>);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button key={i} onClick={() => handlePageChange(i)} className={currentPage === i ? "active" : ""}>
          {i}
        </button>
      );
    }

    if (endPage < totalPages - 1) pages.push(<span key="end-ellipsis">...</span>);

    if (totalPages > 1) {
      pages.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)} className={currentPage === totalPages ? "active" : ""}>
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
        >
          <img src={arrowLeft} alt="Previous" />
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`pagination-arrow ${currentPage === totalPages ? "disabled" : ""}`}
        >
          <img src={arrowRight} alt="Next" />
        </button>
      </div>
    );
  };

  const renderTableHeader = () => (
    <thead>
      <tr>
        <th>Name</th>
        <th>Email Address</th>
        <th>Mobile Number</th>
        {activeTab === "sellCar" && <th>Description</th>}
        {(activeTab === "testDrive" || activeTab === "buyNow") && <th>Car</th>}
        {activeTab === "testDrive" && <th>Date & Time</th>}
        {(activeTab === "finance" || activeTab === "contactUs") && <th>Query</th>}
        {activeTab === "sellCar" && <th>Image</th>}
      </tr>
    </thead>
  );

  const renderTableRow = (item) => {
    return (
      <tr key={item._id}>
        <td>{item.fullName || `${item.firstName} ${item.lastName}` || "N/A"}</td>
        <td>{item.email || "N/A"}</td>
        <td>{item.mobileNumber || "N/A"}</td>
        <td>
          {activeTab === "finance" ? `Finance query for ${item.manufacturer} ${item.vehicleType}` :
            activeTab === "sellCar" ? item.description || `Sell car query for ${item.manufacturer} ${item.modelName}` :
              activeTab === "contactUs" ? item.message || "N/A" :
                activeTab === "buyNow" || activeTab === "testDrive" ?
                  `${item.carId?.manufacturerId?.brandName || "N/A"} ${item.carId?.vehicleTypeId?.modelName || "N/A"}` :
                  "N/A"}
        </td>
        {activeTab === "testDrive" && (
          <td>
            {item.date && item.time
              ? `${new Date(item.date).toLocaleDateString()} ${item.time}`
              : "N/A"}
          </td>
        )}
        {activeTab === "sellCar" && (
          <td className="image-cell">
            {item.images?.length > 0 ? (
              <a href="#!" onClick={() => setSelectedImages(item.images)}>
                Images({item.images.length})
              </a>
            ) : "No image"}
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h1 className="screenHeading">Users</h1>
          <p className="screenSubHeading">We are glad to see you again!</p>
        </div>
        <button className="download-btn" onClick={() => console.log("Download file clicked")}>
          Download file
        </button>
      </div>
      <div className="adminRenderTable">
        <div className="admin-actions">
          {["sellCar", "testDrive", "finance", "contactUs", "buyNow"].map(tab => (
            <button
              key={tab}
              className={`action-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, " $1")}
            </button>
          ))}
        </div>
        <div className="table-container">
          {currentData.length > 0 ? (
            <table className="data-table">
              {renderTableHeader()}
              <tbody>{currentData.map(renderTableRow)}</tbody>
            </table>
          ) : (
            <p>No data available for {activeTab}</p>
          )}
        </div>
      </div>
      {renderPagination()}
      {selectedImages && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Car Images</h5>
                <button className="btn-close" onClick={() => setSelectedImages(null)}></button>
              </div>
              <div className="modal-body">
                {selectedImages.map((image, index) => (
                  <img key={image._id} src={image.path} alt={`Car ${index + 1}`} className="img-fluid mb-3" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;