package com.qms.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.Permission;
import com.qms.mapper.PermissionMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/permissions")
public class PermissionController {
  private final PermissionMapper mapper;

  public PermissionController(PermissionMapper mapper) {
    this.mapper = mapper;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Page<Permission>> list(@RequestParam(defaultValue = "1") long page,
                                            @RequestParam(defaultValue = "10") long size,
                                            @RequestParam(required = false) String name,
                                            @RequestParam(required = false) String code) {
    LambdaQueryWrapper<Permission> w = new LambdaQueryWrapper<>();
    w.like(name != null && !name.isEmpty(), Permission::getName, name);
    w.like(code != null && !code.isEmpty(), Permission::getCode, code);
    w.eq(Permission::getDeleted, 0);
    return ApiResponse.ok(mapper.selectPage(Page.of(page, size), w));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody Permission p) {
    p.setDeleted(0);
    mapper.insert(p);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody Permission p) {
    p.setId(id);
    mapper.updateById(p);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    Permission p = mapper.selectById(id);
    if (p != null) {
      p.setDeleted(1);
      mapper.updateById(p);
    }
    return ApiResponse.ok(null);
  }
}

