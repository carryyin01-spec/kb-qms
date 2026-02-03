package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.AuditPlan;
import com.qms.service.AuditPlanService;
import com.qms.mapper.UserMapper;
import com.qms.entity.User;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audits")
public class AuditPlanController {
  private final AuditPlanService service;
  private final UserMapper userMapper;

  public AuditPlanController(AuditPlanService service, UserMapper userMapper) {
    this.service = service;
    this.userMapper = userMapper;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<AuditPlan>> list(@RequestParam(defaultValue = "1") long page,
                                           @RequestParam(defaultValue = "10") long size,
                                           @RequestParam(required = false) String title,
                                           @RequestParam(required = false) String status) {
    return ApiResponse.ok(service.page(page, size, title, status));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<AuditPlan> get(@PathVariable Long id) {
    return ApiResponse.ok(service.get(id));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody AuditPlan p) {
    if (p.getApprover() != null && !p.getApprover().isEmpty()) {
      User u = userMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>().eq(User::getUsername, p.getApprover()));
      if (u == null) {
        return ApiResponse.fail(400, "审批人不存在");
      }
    }
    service.create(p);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody AuditPlan p) {
    p.setId(id);
    if (p.getApprover() != null && !p.getApprover().isEmpty()) {
      User u = userMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>().eq(User::getUsername, p.getApprover()));
      if (u == null) {
        return ApiResponse.fail(400, "审批人不存在");
      }
    }
    service.update(p);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok(null);
  }
}
