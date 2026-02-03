import request from "../utils/request";

export const listUsers = (params) => request.get("/users", { params });
export const listAllRoles = () => request.get("/users/roles");
export const getUserRoles = (userId) => request.get(`/users/${userId}/roles`);
export const assignUserRoles = (userId, roleIds) => request.post(`/users/${userId}/roles`, { roleIds });
export const addUserRole = (userId, roleId) => request.post(`/users/${userId}/roles/add`, null, { params: { roleId } });
export const createUser = (payload) => request.post(`/users`, payload);
export const updateUserStatus = (userId, status) => request.put(`/users/${userId}/status`, null, { params: { status } });
export const resetUserPassword = (userId) => request.post(`/users/${userId}/reset-password`);
export const updateUserPassword = (userId, password) => request.post(`/users/${userId}/password`, null, { params: { password } });
