import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Dashboard from "./Components/Dashboard";
import AddManufacturer from "./Components/AddManufacturer";
import AddVehicleType from "./Components/AddVehicleType";
import AddTrim from "./Components/AddTrim";
import AddCar from "./Components/AddCar";
import ManageCars from "./Components/ManageCars";
import AddBlog from "./Components/AddBlog";
import Blogs from "./Components/Blogs";
import Users from "./Components/Users";
import { AuthContext } from "./Context/AuthContext";
import Loader from "./Components/Loader";

function App() {
  const { isLoading } = useContext(AuthContext);
  return (
    <Router>
      <div className="App">
        {isLoading && <Loader />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Dashboard />}>
            <Route index element={<Navigate to="/brands" replace />} />
            <Route path="brands" element={<AddManufacturer />} />
            <Route path="models" element={<AddVehicleType />} />
            <Route path="trims" element={<AddTrim />} />
            <Route path="inventory" element={<ManageCars />} />
            <Route path="inventory/new" element={<AddCar />} />
            <Route path="blog/new" element={<AddBlog />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="customers" element={<Users />} />
            <Route path="*" element={<Navigate to="/brands" replace />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
