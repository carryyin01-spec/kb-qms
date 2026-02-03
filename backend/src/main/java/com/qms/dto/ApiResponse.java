package com.qms.dto;

import lombok.Data;

@Data
public class ApiResponse<T> {
  private int code;
  private String message;
  private T data;

  public static <T> ApiResponse<T> ok(T data) {
    ApiResponse<T> r = new ApiResponse<>();
    r.code = 200;
    r.message = "OK";
    r.data = data;
    return r;
  }

  public static <T> ApiResponse<T> fail(int code, String message) {
    ApiResponse<T> r = new ApiResponse<>();
    r.code = code;
    r.message = message;
    return r;
  }
}

