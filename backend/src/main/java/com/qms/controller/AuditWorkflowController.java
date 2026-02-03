package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.AuditPlan;
import com.qms.service.AuditPlanService;
import com.qms.service.SystemLogService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/audit-workflow")
public class AuditWorkflowController {
  private final AuditPlanService service;
  private final SystemLogService logService;

  public AuditWorkflowController(AuditPlanService service, SystemLogService logService) {
    this.service = service;
    this.logService = logService;
  }

  @PostMapping("/transition")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> transition(@RequestParam Long id, @RequestParam String targetStatus, @RequestParam(required = false) String note) {
    AuditPlan p = service.get(id);
    if (p == null || p.getDeleted() != null && p.getDeleted() == 1) {
      return ApiResponse.fail(404, "审核计划不存在");
    }
    String cur = p.getStatus();
    if (!isAllowed(cur, targetStatus)) {
      return ApiResponse.fail(400, "非法流转");
    }
    org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    String username = auth != null ? auth.getName() : "anonymous";
    if (("COMPLETED".equals(targetStatus) || "CANCELLED".equals(targetStatus)) && p.getApprover() != null && !p.getApprover().isEmpty()) {
      if (!username.equals(p.getApprover())) {
        return ApiResponse.fail(403, "仅审批人可完成或取消该审核计划");
      }
    }
    p.setStatus(targetStatus);
    service.update(p);
    com.qms.entity.SystemLog log = new com.qms.entity.SystemLog();
    log.setUsername(username);
    log.setPath("/audit-workflow/transition");
    log.setMethod("POST");
    String action = "audit_workflow:" + cur + "->" + targetStatus;
    if (note != null && !note.isEmpty()) action = action + ":" + note;
    log.setAction(action);
    log.setIp("N/A");
    log.setCreatedAt(java.time.LocalDateTime.now());
    logService.save(log);
    return ApiResponse.ok(null);
  }

  public static List<String> nextStatuses(String cur) {
    switch (cur == null ? "PLANNED" : cur) {
      case "PLANNED": return List.of("IN_PROGRESS", "CANCELLED");
      case "IN_PROGRESS": return List.of("COMPLETED", "CANCELLED");
      default: return List.of();
    }
  }

  private boolean isAllowed(String cur, String target) {
    return nextStatuses(cur).contains(target);
  }
}
