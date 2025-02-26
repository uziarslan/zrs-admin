import React from "react";
import logo from "../Assets/images/logo.png";
import manage from "../Assets/icons/manage.svg";
import add from "../Assets/icons/add.svg";
import carTab from "../Assets/icons/car-tab.svg";
import group from "../Assets/icons/group.svg";
import notepad from "../Assets/icons/notepad.svg";
import logout from "../Assets/icons/logout.svg";

const Sidebar = ({ onSelectScreen, currentScreen }) => {
  const menuItems = [
    { icon: manage, text: "Manufacturer", screen: "addManufacturer" },
    { icon: manage, text: "Vehicle Type", screen: "vehicleType" },
    { icon: manage, text: "Vehicle Trim", screen: "vehicleTrim" },
    { icon: add, text: "Add New car", screen: "addCar" },
    { icon: carTab, text: "Manage Cars", screen: "manageCars" },
    { icon: group, text: "Users", screen: "users" },
    { icon: notepad, text: "Blog Upload", screen: "blogUpload" },
  ];

  return (
    <div className="sidebar">
      <img src={logo} alt="Logo" className="logo" />
      <nav>
        {menuItems.map((item, index) => (
          <a
            key={index}
            href="#"
            className={currentScreen === item.screen ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              onSelectScreen(item.screen);
            }}
          >
            <img src={item.icon} alt={item.text} />
            <span>{item.text}</span>
          </a>
        ))}
      </nav>
      <a href="#" className="logout">
        <img src={logout} alt="Logout" />
        <span>Logout</span>
      </a>
    </div>
  );
};

export default Sidebar;
