package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.dto.LoginRequest;
import com.qms.dto.LoginResponse;
import com.qms.entity.User;
import com.qms.service.UserService;
import com.qms.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final UserService userService;
  private final JwtUtil jwtUtil;

  public AuthController(UserService userService, JwtUtil jwtUtil) {
    this.userService = userService;
    this.jwtUtil = jwtUtil;
  }

  @PostMapping("/login")
  @PreAuthorize("permitAll()")
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    System.out.println("Login attempt for user: " + request.getUsername());
    User user = userService.findByUsername(request.getUsername());
    if (user == null) {
      System.out.println("User not found: " + request.getUsername());
      return ApiResponse.fail(401, "用户名或密码错误");
    }
    boolean check = userService.checkPassword(user, request.getPassword());
    System.out.println("Password check for " + request.getUsername() + ": " + check);
    if (!check) {
      return ApiResponse.fail(401, "用户名或密码错误");
    }
    String token = jwtUtil.generate(user.getUsername());
    List<String> roles = userService.roles(user.getId());
    java.util.List<String> perms = userService.permissions(user.getId());
    LoginResponse resp = new LoginResponse();
    resp.setToken(token);
    resp.setUsername(user.getUsername());
    resp.setName(user.getName());
    resp.setRole(roles.isEmpty() ? "ROLE_USER" : roles.get(0));
    try {
      // attach permissions list
      java.lang.reflect.Field f = LoginResponse.class.getDeclaredField("permissions");
      f.setAccessible(true);
      f.set(resp, perms);
    } catch (Exception ignored) {}
    return ApiResponse.ok(resp);
  }
}

