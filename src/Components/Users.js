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
  const [activeTab, setActiveTab] = useState("finance"); // Toggle between finance and sell car data
  const itemsPerPage = 5; // Matches the table rows in the screenshot

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch finance eligibility data
        const financeResponse = await axiosInstance.get(
          "/api/v1/finance-eligibility"
        );
        setFinanceData(financeResponse.data || []);

        // Fetch sell car data
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
  const totalItems =
    activeTab === "finance" ? financeData.length : sellCarData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage)); // Ensure at least 1 page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData =
    activeTab === "finance"
      ? financeData.slice(indexOfFirstItem, indexOfLastItem)
      : sellCarData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change with bounds checking
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render pagination matching ManageCars.js (up to 5 buttons, ellipsis, arrows)
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
          className={`pagination-arrow ${
            currentPage === totalPages ? "disabled" : ""
          }`}
          aria-label="Next page"
        >
          <img src={arrowRight} alt="Next page" />
        </button>
      </div>
    );
  };

  // Handle download (simulated for now)
  const handleDownload = () => {
    console.log("Download file clicked");
    // Add logic to download data as CSV or PDF here
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Users</h1>
        <p>We are glad to see you again!</p>
        <button className="download-btn" onClick={handleDownload}>
          Download file
        </button>
      </div>
      <div className="admin-actions">
        <button
          className={`action-btn ${activeTab === "finance" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("finance");
            setCurrentPage(1); // Reset to first page when switching tabs
          }}
        >
          Query
        </button>
        <button
          className={`action-btn ${activeTab === "sell" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("sell");
            setCurrentPage(1); // Reset to first page when switching tabs
          }}
        >
          Test Drive
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email Address</th>
              <th>Mobile Number</th>
              <th>Query</th>
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
                    : `Sell car query for ${item.manufacturer} ${item.vehicleType}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default Users;
