package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.User;
import com.qms.mapper.RoleMapper;
import com.qms.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
  private final UserMapper userMapper;
  private final RoleMapper roleMapper;
  private final com.qms.mapper.PermissionMapper permissionMapper;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserMapper userMapper, RoleMapper roleMapper, com.qms.mapper.PermissionMapper permissionMapper, PasswordEncoder passwordEncoder) {
    this.userMapper = userMapper;
    this.roleMapper = roleMapper;
    this.permissionMapper = permissionMapper;
    this.passwordEncoder = passwordEncoder;
  }

  public User findByUsername(String username) {
    return userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username).eq(User::getDeleted, 0));
  }

  public boolean checkPassword(User user, String rawPassword) {
    String stored = user.getPassword();
    if (stored == null) return false;
    if (stored.length() < 60) {
      return stored.equals(rawPassword);
    }
    return passwordEncoder.matches(rawPassword, stored);
  }

  public List<String> roles(Long userId) {
    return roleMapper.listRoleCodesByUserId(userId);
  }

  public java.util.List<String> permissions(Long userId) {
    return permissionMapper.listPermissionCodesByUserId(userId);
  }
}

