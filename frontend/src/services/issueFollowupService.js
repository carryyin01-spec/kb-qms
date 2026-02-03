import request from "../utils/request";

export const listFollowups = (issueId, page = 1, size = 10) =>
  request.get("/issue-followups", { params: { issueId, page, size } });

export const createFollowup = (data) =>
  request.post("/issue-followups", data);

