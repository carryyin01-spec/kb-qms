package com.qms.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.dto.RoleAssignRequest;
import com.qms.entity.User;
import com.qms.mapper.UserMapper;
import com.qms.mapper.RoleMapper;
import com.qms.mapper.UserRoleMapper;
import com.qms.entity.Role;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
  private final UserMapper userMapper;
  private final RoleMapper roleMapper;
  private final UserRoleMapper userRoleMapper;

  public UserController(UserMapper userMapper, RoleMapper roleMapper, UserRoleMapper userRoleMapper) {
    this.userMapper = userMapper;
    this.roleMapper = roleMapper;
    this.userRoleMapper = userRoleMapper;
  }

  @GetMapping
  public ApiResponse<Page<User>> list(@RequestParam(defaultValue = "1") long page,
                                      @RequestParam(defaultValue = "10") long size,
                                      @RequestParam(required = false) String username,
                                      @RequestParam(required = false) String name,
                                      @RequestParam(required = false) String roleCode) {
    LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
    if (username != null && !username.isEmpty()) {
      wrapper.like(User::getUsername, username);
    }
    if (name != null && !name.isEmpty()) {
      wrapper.like(User::getName, name);
    }
    if (roleCode != null && !roleCode.isEmpty()) {
      java.util.List<User> list = userMapper.selectByRoleCode(roleCode);
      Page<User> p = Page.of(page, size);
      p.setRecords(list);
      p.setTotal(list.size());
      return ApiResponse.ok(p);
    }
    Page<User> p = userMapper.selectPage(Page.of(page, size), wrapper);
    return ApiResponse.ok(p);
  }

  @GetMapping("/{id}")
  public ApiResponse<User> get(@PathVariable Long id) {
    return ApiResponse.ok(userMapper.selectById(id));
  }

  @GetMapping("/{id}/roles")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<java.util.List<Long>> getRoles(@PathVariable Long id) {
    return ApiResponse.ok(userRoleMapper.selectRoleIdsByUserId(id));
  }

  @GetMapping("/roles")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<java.util.List<Role>> allRoles() {
    return ApiResponse.ok(roleMapper.selectList(null));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody User u) {
    if (u.getUsername() == null || u.getUsername().isEmpty() || u.getPassword() == null || u.getPassword().isEmpty()) {
      return ApiResponse.fail(400, "用户名或密码不能为空");
    }
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>().eq(User::getUsername, u.getUsername());
    if (userMapper.selectCount(w) > 0) {
      return ApiResponse.fail(409, "用户名已存在");
    }
    u.setDeleted(0);
    u.setCreatedAt(java.time.LocalDateTime.now());
    try {
      org.springframework.security.crypto.password.PasswordEncoder enc = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
      if (u.getPassword().length() < 60) u.setPassword(enc.encode(u.getPassword()));
    } catch (Exception ignored) {}
    userMapper.insert(u);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}/status")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
    if (status == null || (status != 0 && status != 1)) return ApiResponse.fail(400, "状态无效");
    User u = userMapper.selectById(id);
    if (u == null) return ApiResponse.fail(404, "用户不存在");
    u.setStatus(status);
    userMapper.updateById(u);
    return ApiResponse.ok(null);
  }

  @PostMapping("/{id}/roles")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public ApiResponse<Void> assignRoles(@PathVariable Long id, @RequestBody RoleAssignRequest req) {
    userRoleMapper.deleteByUserId(id);
    if (req.getRoleIds() != null) {
      for (Long rid : req.getRoleIds()) {
        userRoleMapper.insertUserRole(id, rid);
      }
    }
    return ApiResponse.ok(null);
  }

  @PostMapping("/{id}/roles/add")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> addRole(@PathVariable Long id, @RequestParam Long roleId) {
    userRoleMapper.insertUserRole(id, roleId);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}/roles/{roleId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> removeRole(@PathVariable Long id, @PathVariable Long roleId) {
    userRoleMapper.deleteUserRole(id, roleId);
    return ApiResponse.ok(null);
  }

  @PostMapping("/{id}/password")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> updatePassword(@PathVariable Long id, @RequestParam String password) {
    if (password == null || password.isEmpty()) return ApiResponse.fail(400, "密码不能为空");
    User u = userMapper.selectById(id);
    if (u == null) return ApiResponse.fail(404, "用户不存在");
    org.springframework.security.crypto.password.PasswordEncoder enc = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    u.setPassword(enc.encode(password));
    userMapper.updateById(u);
    return ApiResponse.ok(null);
  }

  @PostMapping("/{id}/reset-password")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> resetPassword(@PathVariable Long id) {
    User u = userMapper.selectById(id);
    if (u == null) return ApiResponse.fail(404, "用户不存在");
    org.springframework.security.crypto.password.PasswordEncoder enc = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    u.setPassword(enc.encode("12345"));
    userMapper.updateById(u);
    return ApiResponse.ok(null);
  }
}
