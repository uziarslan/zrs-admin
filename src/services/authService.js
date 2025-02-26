import axiosInstance from "./axiosInstance";

const API_URL = "/api/auth";

const register = async (userData) => {
  const response = await axiosInstance.post(
    `${API_URL}/admin/signup`,
    userData
  );
  if (response.data) {
    localStorage.setItem("token", response.data.token);
  }
  return response;
};

const login = async (userData) => {
  const response = await axiosInstance.post(`${API_URL}/admin/login`, userData);
  if (response.data) {
    localStorage.setItem("token", response.data.token);
  }
  return response;
};

const logout = () => {
  localStorage.removeItem("token");
};

const getUser = async () => {
  const token = localStorage.getItem("token");
  if (token) {
    const response = await axiosInstance.get(`${API_URL}/admin`);
    return response.data;
  }
  return null;
};

const authService = {
  register,
  login,
  logout,
  getUser,
};

export default authService;
