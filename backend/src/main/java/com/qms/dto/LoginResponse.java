package com.qms.dto;

import lombok.Data;

@Data
public class LoginResponse {
  private String token;
  private String username;
  private String name;
  private String role;
  private java.util.List<String> permissions;
}

