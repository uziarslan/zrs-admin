import React from "react";
import { createRoot } from "react-dom/client"; // Fixed import
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import AuthProvider from "./Context/AuthContext";

const root = createRoot(document.getElementById("root")); // Use createRoot directly
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
