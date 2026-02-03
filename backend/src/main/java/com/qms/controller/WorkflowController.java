package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.WorkflowInstance;
import com.qms.entity.WorkflowTemplate;
import com.qms.service.WorkflowService;
import com.qms.mapper.WorkflowTemplateMapper;
import com.qms.mapper.WorkflowInstanceMapper;
import com.qms.mapper.WorkflowHistoryMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/workflow")
public class WorkflowController {
  private final WorkflowService workflowService;
  private final WorkflowTemplateMapper templateMapper;
  private final WorkflowInstanceMapper instanceMapper;
  private final WorkflowHistoryMapper historyMapper;

  public WorkflowController(WorkflowService workflowService, WorkflowTemplateMapper templateMapper, WorkflowInstanceMapper instanceMapper, WorkflowHistoryMapper historyMapper) {
    this.workflowService = workflowService;
    this.templateMapper = templateMapper;
    this.instanceMapper = instanceMapper;
    this.historyMapper = historyMapper;
  }

  @GetMapping("/templates")
  @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','USER')")
  public com.qms.dto.ApiResponse<java.util.List<com.qms.entity.WorkflowTemplate>> listTemplates() {
    java.util.List<com.qms.entity.WorkflowTemplate> all = templateMapper.selectList(null);
    return com.qms.dto.ApiResponse.ok(all);
  }

  @PostMapping("/templates")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> createTemplate(@RequestBody WorkflowTemplate t) {
    try {
      Map<?,?> cfg = new com.fasterxml.jackson.databind.ObjectMapper().readValue(t.getConfig(), Map.class);
      java.util.List<java.util.Map<String,Object>> nodes = (java.util.List<java.util.Map<String,Object>>) cfg.get("nodes");
      if (nodes != null) {
        for (java.util.Map<String,Object> n : nodes) {
          Object assignees = n.get("assignees");
          if (assignees instanceof java.util.List<?>) {
            for (Object a : (java.util.List<?>) assignees) {
              String s = String.valueOf(a);
              if (s.startsWith("role:")) {
                String r = s.substring(5).toLowerCase();
                if (!java.util.Set.of("reviewer","approver").contains(r)) {
                  return ApiResponse.fail(400, "不支持的审批角色: " + r);
                }
              }
            }
          }
        }
      }
    } catch (Exception e) {
      return ApiResponse.fail(400, "配置解析失败");
    }
    workflowService.createTemplate(t);
    return ApiResponse.ok(null);
  }

  @PostMapping("/instances/start")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<WorkflowInstance> start(@RequestBody Map<String, Object> req) {
    String templateCode = (String) req.get("templateCode");
    Long entityId = req.get("entityId") == null ? null : Long.valueOf(req.get("entityId").toString());
    String entityType = (String) req.get("entityType");
    Long starterId = req.get("starterId") == null ? null : Long.valueOf(req.get("starterId").toString());
    String variables = req.get("variables") == null ? null : toJson(req.get("variables"));
    WorkflowInstance ins = workflowService.start(templateCode, entityId, entityType, starterId, variables);
    if (ins == null) return ApiResponse.fail(400, "模板不可用或不存在");
    return ApiResponse.ok(ins);
  }

  @GetMapping("/instances")
  @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<java.util.List<WorkflowInstance>> listInstances(@RequestParam(required = false) String entityType,
                                                                     @RequestParam(required = false) String status) {
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.WorkflowInstance> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.eq(entityType != null && !entityType.isEmpty(), com.qms.entity.WorkflowInstance::getEntityType, entityType);
    w.eq(status != null && !status.isEmpty(), com.qms.entity.WorkflowInstance::getStatus, status);
    java.util.List<com.qms.entity.WorkflowInstance> list = instanceMapper.selectList(w);
    return ApiResponse.ok(list);
  }

  @PostMapping("/instances/{id}/execute")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> execute(@PathVariable Long id, @RequestBody Map<String, Object> req) {
    String action = (String) req.get("action");
    Long operatorId = req.get("operatorId") == null ? null : Long.valueOf(req.get("operatorId").toString());
    String comment = (String) req.get("comment");
    String variables = req.get("variables") == null ? null : toJson(req.get("variables"));
    boolean ok = workflowService.execute(id, action, operatorId, comment, variables);
    return ok ? ApiResponse.ok(null) : ApiResponse.fail(400, "执行失败");
  }

  @GetMapping("/history")
  @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<java.util.List<com.qms.entity.WorkflowHistory>> history(@RequestParam Long instanceId) {
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.WorkflowHistory> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.eq(com.qms.entity.WorkflowHistory::getInstanceId, instanceId);
    w.orderByAsc(com.qms.entity.WorkflowHistory::getCreatedAt);
    java.util.List<com.qms.entity.WorkflowHistory> list = historyMapper.selectList(w);
    return com.qms.dto.ApiResponse.ok(list);
  }
  private String toJson(Object o) {
    try { return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(o); } catch (Exception e) { return null; }
  }
}
