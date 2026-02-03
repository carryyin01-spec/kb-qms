import request from "../utils/request";

export const listRoles = (params) => request.get("/roles", { params });
export const createRole = (data) => request.post("/roles", data);
export const updateRole = (id, data) => request.put(`/roles/${id}`, data);
export const deleteRole = (id) => request.delete(`/roles/${id}`);
export const listAllPermissions = () => request.get("/roles/permissions");
export const getRolePermissions = (roleId) => request.get(`/roles/${roleId}/permissions`);
export const assignRolePermissions = (roleId, permissionIds) => request.post(`/roles/${roleId}/permissions`, { permissionIds });

