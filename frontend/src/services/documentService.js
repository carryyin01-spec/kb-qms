import request from "../utils/request";

export const listDocuments = (params) => request.get("/documents", { params });
export const getDocument = (id) => request.get(`/documents/${id}`);
export const createDocument = (data) => request.post("/documents", data);
export const updateDocument = (id, data) => request.put(`/documents/${id}`, data);
export const deleteDocument = (id) => request.delete(`/documents/${id}`);
export const listVersions = (documentId, page = 1, size = 10) => request.get(`/document-versions`, { params: { documentId, page, size } });
