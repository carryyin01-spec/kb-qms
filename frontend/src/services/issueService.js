import request from "../utils/request";

export const listIssues = (params) => request.get("/issues", { params });
export const getIssue = (id) => request.get(`/issues/${id}`);
export const createIssue = (data) => request.post("/issues", data);
export const updateIssue = (id, data) => request.put(`/issues/${id}`, data);
export const deleteIssue = (id) => request.delete(`/issues/${id}`);

