import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "";

export const getSystemLogs = async (page = 1, size = 10, username = "") => {
  const params = { page, size };
  if (username) params.username = username;
  const res = await axios.get(`${API_BASE}/api/system-logs`, { params });
  return res.data;
};

export const isLogEnabled = () => {
  return localStorage.getItem("enable_operation_log") === "true";
};

export const setLogEnabled = (enabled) => {
  localStorage.setItem("enable_operation_log", enabled ? "true" : "false");
};
