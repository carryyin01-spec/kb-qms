import axios from "axios";
import { getToken } from "./storage";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
  timeout: 10000,
  withCredentials: true
});

instance.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 将前端的操作日志开关状态传递给后端
  const enableLog = localStorage.getItem("enable_operation_log") === "true";
  config.headers["X-Enable-Log"] = enableLog ? "true" : "false";
  return config;
});

instance.interceptors.response.use(
  resp => resp.data,
  err => {
    const r = err.response?.data || { code: 500, message: err.message };
    return r;
  }
);

export default instance;

