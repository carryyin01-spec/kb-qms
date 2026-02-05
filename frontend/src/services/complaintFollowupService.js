import request from "../utils/request";

export const listFollowups = (complaintId, page = 1, size = 10) =>
  request.get("/complaint-followups", { params: { complaintId, page, size } });

export const createFollowup = (data) =>
  request.post("/complaint-followups", data);
