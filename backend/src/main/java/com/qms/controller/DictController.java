package com.qms.controller;

import com.qms.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dicts")
public class DictController {
  @GetMapping("/issues/categories")
  public ApiResponse<List<Map<String, String>>> issueCategories() {
    return ApiResponse.ok(List.of(
        Map.of("code", "PROCESS", "name", "生产"),
        Map.of("code", "DESIGN", "name", "设计"),
        Map.of("code", "SUPPLIER", "name", "供应商"),
        Map.of("code", "AUDIT", "name", "审核")
    ));
  }

  @GetMapping("/issues/modules")
  public ApiResponse<List<Map<String, String>>> issueModules() {
    return ApiResponse.ok(List.of(
        Map.of("code", "MFG", "name", "生产模块"),
        Map.of("code", "DESIGN", "name", "设计模块"),
        Map.of("code", "SUPPLIER", "name", "供应商模块"),
        Map.of("code", "QA", "name", "质量模块")
    ));
  }

  @GetMapping("/issues/departments")
  public ApiResponse<List<Map<String, String>>> issueDepartments() {
    return ApiResponse.ok(List.of(
        Map.of("code", "MFG", "name", "制造部"),
        Map.of("code", "RND", "name", "研发部"),
        Map.of("code", "PROC", "name", "采购部"),
        Map.of("code", "QA", "name", "质量部")
    ));
  }
}

