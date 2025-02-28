import React, { useState } from "react";
import Sidebar from "./Sidebar";
import AddManufacturer from "./AddManufacturer";
import AddVehicleType from "./AddVehicleType";
import AddCar from "./AddCar";
import AddTrim from "./AddTrim";
import ManageCars from "./ManageCars";
import Users from "./Users";

function Dashboard() {
  const [currentScreen, setCurrentScreen] = useState("addManufacturer");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleScreenChange = (screen) => {
    setCurrentScreen(screen);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "addManufacturer":
        return <AddManufacturer />;
      case "vehicleType":
        return <AddVehicleType />;
      case "vehicleTrim":
        return <AddTrim />;
      case "addCar":
        return <AddCar />;
      case "manageCars":
        return <ManageCars />;
      case "users":
        return <Users />;
      case "blogUpload":
        return <div>Blog Upload Screen</div>;
      default:
        return <AddManufacturer />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        onSelectScreen={handleScreenChange}
        currentScreen={currentScreen}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className="content">
      {!sidebarOpen && (
          <button className="mobile-toggle" onClick={toggleSidebar}>
            ☰
          </button>
        )}
        {renderScreen()}
      </div>
    </div>
  );
}

export default Dashboard;