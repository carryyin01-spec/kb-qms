package com.qms.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.User;
import com.qms.mapper.RoleMapper;
import com.qms.mapper.UserMapper;
import com.qms.mapper.PermissionMapper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
  private final UserMapper userMapper;
  private final RoleMapper roleMapper;
  private final PermissionMapper permissionMapper;

  public CustomUserDetailsService(UserMapper userMapper, RoleMapper roleMapper, PermissionMapper permissionMapper) {
    this.userMapper = userMapper;
    this.roleMapper = roleMapper;
    this.permissionMapper = permissionMapper;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username).eq(User::getDeleted, 0));
    if (user == null) {
      throw new UsernameNotFoundException("User not found");
    }
    List<String> roles = roleMapper.listRoleCodesByUserId(user.getId());
    List<String> perms = permissionMapper.listPermissionCodesByUserId(user.getId());
    List<GrantedAuthority> authorities = new java.util.ArrayList<>();
    authorities.addAll(roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList()));
    authorities.addAll(perms.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList()));
    
    return new LoginUser(
        user.getUsername(),
        user.getPassword(),
        user.getName(),
        user.getStatus() != null && user.getStatus() == 1,
        true,
        true,
        true,
        authorities
    );
  }
}

