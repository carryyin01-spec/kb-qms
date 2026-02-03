package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.dto.QualityIssueCreateRequest;
import com.qms.dto.QualityIssueUpdateRequest;
import com.qms.entity.QualityIssue;
import com.qms.service.QualityIssueService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/issues")
public class QualityIssueController {
  private final QualityIssueService issueService;

  public QualityIssueController(QualityIssueService issueService) {
    this.issueService = issueService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<QualityIssue>> list(@RequestParam(defaultValue = "1") long page,
                                              @RequestParam(defaultValue = "10") long size,
                                              @RequestParam(required = false) String title,
                                              @RequestParam(required = false) String severity,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String category,
                                              @RequestParam(required = false) String module,
                                              @RequestParam(required = false) String department) {
    return ApiResponse.ok(issueService.page(page, size, title, severity, status, category, module, department));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<QualityIssue> get(@PathVariable Long id) {
    return ApiResponse.ok(issueService.get(id));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('ISSUE_CREATE') or hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody @jakarta.validation.Valid QualityIssueCreateRequest req) {
    java.util.Set<String> categories = java.util.Set.of("PROCESS","DESIGN","SUPPLIER","AUDIT");
    java.util.Set<String> modules = java.util.Set.of("MFG","DESIGN","SUPPLIER","QA");
    java.util.Set<String> departments = java.util.Set.of("MFG","RND","PROC","QA");
    if (req.getCategory() != null && !req.getCategory().isEmpty() && !categories.contains(req.getCategory())) {
      return ApiResponse.fail(400, "类别无效");
    }
    if (req.getModule() != null && !req.getModule().isEmpty() && !modules.contains(req.getModule())) {
      return ApiResponse.fail(400, "模块无效");
    }
    if (req.getDepartment() != null && !req.getDepartment().isEmpty() && !departments.contains(req.getDepartment())) {
      return ApiResponse.fail(400, "责任部门无效");
    }
    QualityIssue i = new QualityIssue();
    i.setTitle(req.getTitle());
    i.setDescription(req.getDescription());
    i.setSeverity(req.getSeverity());
    i.setCategory(req.getCategory());
    i.setModule(req.getModule());
    i.setDepartment(req.getDepartment());
    i.setStatus(req.getStatus());
    i.setReporterId(req.getReporterId());
    issueService.create(i);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('ISSUE_UPDATE') or hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody @jakarta.validation.Valid QualityIssueUpdateRequest req) {
    java.util.Set<String> categories = java.util.Set.of("PROCESS","DESIGN","SUPPLIER","AUDIT");
    java.util.Set<String> modules = java.util.Set.of("MFG","DESIGN","SUPPLIER","QA");
    java.util.Set<String> departments = java.util.Set.of("MFG","RND","PROC","QA");
    if (req.getCategory() != null && !req.getCategory().isEmpty() && !categories.contains(req.getCategory())) {
      return ApiResponse.fail(400, "类别无效");
    }
    if (req.getModule() != null && !req.getModule().isEmpty() && !modules.contains(req.getModule())) {
      return ApiResponse.fail(400, "模块无效");
    }
    if (req.getDepartment() != null && !req.getDepartment().isEmpty() && !departments.contains(req.getDepartment())) {
      return ApiResponse.fail(400, "责任部门无效");
    }
    QualityIssue i = new QualityIssue();
    i.setId(id);
    i.setTitle(req.getTitle());
    i.setDescription(req.getDescription());
    i.setSeverity(req.getSeverity());
    i.setCategory(req.getCategory());
    i.setModule(req.getModule());
    i.setDepartment(req.getDepartment());
    i.setStatus(req.getStatus());
    i.setReporterId(req.getReporterId());
    issueService.update(i);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('ISSUE_DELETE') or hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    issueService.delete(id);
    return ApiResponse.ok(null);
  }
}
