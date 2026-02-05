import request from "../utils/request";

export const getDashboardStats = () => request.get("/dashboard/stats");
export const getComplaintStatusDistribution = () => request.get("/dashboard/complaint-status-distribution");
export const getComplaintTrend = () => request.get("/dashboard/complaint-trend");
export const getComplaintMonthlyTrend = () => request.get("/dashboard/complaint-monthly-trend");
export const getComplaintCloseRateTrend = () => request.get("/dashboard/complaint-close-rate-trend");
export const getComplaintHeatmap = () => request.get("/dashboard/complaint-heatmap");
export const getKpi = () => request.get("/dashboard/kpi");
export const getDepartmentRadar = () => request.get("/dashboard/department-radar");

export const listUsersByRole = (roleCode) => request.get("/users", { params: { page: 1, size: 100, roleCode } });

export const listWorkflowTemplates = () => request.get("/workflow/templates");
export const createWorkflowTemplate = (data) => request.post("/workflow/templates", data);
export const listWorkflowInstances = (params) => request.get("/workflow/instances", { params });
export const startWorkflowInstance = (data) => request.post("/workflow/instances/start", data);
export const executeWorkflowInstance = (id, data) => request.post(`/workflow/instances/${id}/execute`, data);
export const getWorkflowHistory = (instanceId) => request.get("/workflow/history", { params: { instanceId } });
export const createIntegrationConfig = (data) => request.post("/integration/configs", data);
export const createIntegrationMapping = (data) => request.post("/integration/mappings", data);
export const listIntegrationConfigs = () => request.get("/integration/configs");
export const listIntegrationMappings = () => request.get("/integration/mappings");
export const listIntegrationLogs = () => request.get("/integration/logs");


