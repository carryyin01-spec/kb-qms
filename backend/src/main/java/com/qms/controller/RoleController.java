package com.qms.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.dto.PermissionAssignRequest;
import com.qms.entity.Permission;
import com.qms.entity.Role;
import com.qms.mapper.RoleMapper;
import com.qms.mapper.PermissionMapper;
import com.qms.mapper.RolePermissionMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
public class RoleController {
  private final RoleMapper roleMapper;
  private final PermissionMapper permissionMapper;
  private final RolePermissionMapper rolePermissionMapper;

  public RoleController(RoleMapper roleMapper, PermissionMapper permissionMapper, RolePermissionMapper rolePermissionMapper) {
    this.roleMapper = roleMapper;
    this.permissionMapper = permissionMapper;
    this.rolePermissionMapper = rolePermissionMapper;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Page<Role>> list(@RequestParam(defaultValue = "1") long page,
                                      @RequestParam(defaultValue = "10") long size,
                                      @RequestParam(required = false) String name,
                                      @RequestParam(required = false) String code) {
    LambdaQueryWrapper<Role> w = new LambdaQueryWrapper<>();
    w.like(name != null && !name.isEmpty(), Role::getName, name);
    w.like(code != null && !code.isEmpty(), Role::getCode, code);
    return ApiResponse.ok(roleMapper.selectPage(Page.of(page, size), w));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody Role r) {
    r.setDeleted(0);
    roleMapper.insert(r);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody Role r) {
    r.setId(id);
    roleMapper.updateById(r);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    roleMapper.deleteById(id);
    return ApiResponse.ok(null);
  }

  @GetMapping("/{id}/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<List<Long>> rolePermissions(@PathVariable Long id) {
    return ApiResponse.ok(rolePermissionMapper.selectPermissionIdsByRoleId(id));
  }

  @GetMapping("/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<List<Permission>> allPermissions() {
    return ApiResponse.ok(permissionMapper.selectList(null));
  }

  @PostMapping("/{id}/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public ApiResponse<Void> assignPermissions(@PathVariable Long id, @RequestBody PermissionAssignRequest req) {
    List<Long> ids = req.getPermissionIds();
    rolePermissionMapper.deleteByRoleId(id);
    if (ids != null) for (Long pid : ids) rolePermissionMapper.insertRolePermission(id, pid);
    return ApiResponse.ok(null);
  }

  @PostMapping("/{id}/apply-template")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public ApiResponse<Void> applyTemplate(@PathVariable Long id, @RequestParam String template) {
    java.util.Map<String, java.util.List<String>> tpl = new java.util.HashMap<>();
    tpl.put("reviewer", java.util.List.of("DOC_WORKFLOW","ISSUE_WORKFLOW","DOC_UPDATE","ISSUE_UPDATE","DOC_EXPORT","ISSUE_EXPORT"));
    tpl.put("approver", java.util.List.of("DOC_WORKFLOW","ISSUE_WORKFLOW","DOC_UPDATE","ISSUE_UPDATE","DOC_DELETE","ISSUE_DELETE","DOC_EXPORT","ISSUE_EXPORT"));
    tpl.put("admin", java.util.List.of("DOC_CREATE","DOC_UPDATE","DOC_DELETE","DOC_EXPORT","DOC_WORKFLOW","ISSUE_CREATE","ISSUE_UPDATE","ISSUE_DELETE","ISSUE_EXPORT","ISSUE_WORKFLOW","MENU_ADMIN"));
    tpl.put("viewer", java.util.List.of("DOC_EXPORT","ISSUE_EXPORT"));
    tpl.put("doc_admin", java.util.List.of("DOC_CREATE","DOC_UPDATE","DOC_DELETE","DOC_EXPORT","DOC_WORKFLOW"));
    java.util.List<String> codes = tpl.getOrDefault(template, java.util.List.of());
    if (codes.isEmpty()) return ApiResponse.fail(400, "模板无效");
    java.util.List<Permission> all = permissionMapper.selectList(null);
    java.util.Map<String, Long> codeId = new java.util.HashMap<>();
    for (Permission p : all) codeId.put(p.getCode(), p.getId());
    for (String c : codes) {
      if (!codeId.containsKey(c)) {
        Permission p = new Permission();
        p.setName(c);
        p.setCode(c);
        p.setDeleted(0);
        permissionMapper.insert(p);
        Permission inserted = permissionMapper.selectOne(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Permission>().eq(Permission::getCode, c));
        if (inserted != null) codeId.put(c, inserted.getId());
      }
    }
    java.util.Set<Long> existing = new java.util.HashSet<>(rolePermissionMapper.selectPermissionIdsByRoleId(id));
    for (String c : codes) {
      Long pid = codeId.get(c);
      if (pid != null && !existing.contains(pid)) rolePermissionMapper.insertRolePermission(id, pid);
    }
    return ApiResponse.ok(null);
  }
}
