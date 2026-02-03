import request from "../utils/request";

export const listNotifications = (params) => request.get("/notifications", { params });
export const createNotification = (data) => request.post("/notifications", data);
export const deleteNotification = (id) => request.delete(`/notifications/${id}`);

