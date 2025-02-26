import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        authService.logout();
        setUser(null);
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/signup") {
          window.location.replace("/login");
        }
      } else {
        const loggedInUser = await authService.getUser();
        setUser(loggedInUser);
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (userData) => {
    setIsLoading(true);
    const response = await authService.login(userData);
    if (response.data) {
      const loggedInUser = await authService.getUser();
      setUser(loggedInUser);
    }
    setIsLoading(false);
    return response;
  };

  const register = async (userData) => {
    setIsLoading(true);
    await authService.register(userData);
    const registeredUser = await authService.getUser();
    setUser(registeredUser);
    setIsLoading(false);
  };

  const logout = () => {
    setIsLoading(true);
    authService.logout();
    setUser(null);
    setIsLoading(false);
    window.location.href = "/login";
  };

  const isTokenExpired = (token) => {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() > expirationTime;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
