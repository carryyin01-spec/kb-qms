import request from "../utils/request";

export const listConformanceHeaders = (params) => request.get("/conformance/headers", { params });
export const listConformanceFullRecords = (params) => request.get("/conformance/full-records", { params });
export const saveConformanceHeader = (data) => request.post("/conformance/headers", data);
export const listConformanceLines = (params) => request.get("/conformance/lines", { params });
export const saveConformanceLine = (data) => request.post("/conformance/lines", data);
export const deleteConformanceLine = (id) => request.delete(`/conformance/lines/${id}`);
export const deleteConformanceHeader = (id) => request.delete(`/conformance/headers/${id}`);
export const getConformanceStats = (headerId) => request.get("/conformance/stats", { params: { headerId } });
export const getConformanceHeader = (id) => request.get(`/conformance/headers/${id}`);
export const getConformanceGlobalStats = (params) => request.get("/conformance/stats-global", { params });
export const findHeaderBySn = (sn) => request.get("/conformance/find-by-sn", { params: { sn } });
export const lineExists = (headerId, sn) => request.get("/conformance/line-exists", { params: { headerId, sn } });
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
