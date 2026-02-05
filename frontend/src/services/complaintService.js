import request from "../utils/request";

export const listComplaints = (params) => request.get("/complaints", { params });
export const getComplaint = (id) => request.get(`/complaints/${id}`);
export const createComplaint = (data) => request.post("/complaints", data);
export const updateComplaint = (id, data) => request.put(`/complaints/${id}`, data);
export const deleteComplaint = (id) => request.delete(`/complaints/${id}`);
