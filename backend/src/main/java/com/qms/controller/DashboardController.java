package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.mapper.DocumentMapper;
import com.qms.mapper.QualityIssueMapper;
import com.qms.mapper.AuditPlanMapper;
import com.qms.mapper.NotificationMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
  private final DocumentMapper documentMapper;
  private final QualityIssueMapper issueMapper;
  private final AuditPlanMapper auditPlanMapper;
  private final NotificationMapper notificationMapper;

  public DashboardController(DocumentMapper documentMapper, QualityIssueMapper issueMapper, AuditPlanMapper auditPlanMapper, NotificationMapper notificationMapper) {
    this.documentMapper = documentMapper;
    this.issueMapper = issueMapper;
    this.auditPlanMapper = auditPlanMapper;
    this.notificationMapper = notificationMapper;
  }

  @GetMapping("/stats")
  public ApiResponse<Map<String, Object>> stats() {
    long docCount = documentMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.Document>().eq(com.qms.entity.Document::getDeleted, 0));
    long issueCount = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long auditCount = auditPlanMapper.selectCount(null);
    long notifCount = notificationMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.qms.entity.Notification>().eq("deleted", 0));
    Map<String, Object> data = Map.of(
        "documents", docCount,
        "issues", issueCount,
        "audits", auditCount,
        "notifications", notifCount
    );
    return ApiResponse.ok(data);
  }

  @GetMapping("/issue-status-distribution")
  public ApiResponse<Map<String, Long>> issueStatusDistribution() {
    long open = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "OPEN").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long investigating = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "INVESTIGATING").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long resolved = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "RESOLVED").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long closed = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "CLOSED").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    Map<String, Long> data = Map.of(
        "OPEN", open,
        "INVESTIGATING", investigating,
        "RESOLVED", resolved,
        "CLOSED", closed
    );
    return ApiResponse.ok(data);
  }

  @GetMapping("/issue-trend")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> issueTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (int i = 6; i >= 0; i--) {
      java.time.LocalDate d = today.minusDays(i);
      java.time.LocalDateTime start = d.atStartOfDay();
      java.time.LocalDateTime end = d.atTime(23, 59, 59);
      long count = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getCreatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getDeleted, 0));
      list.add(java.util.Map.of("date", d.toString(), "count", count));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/issue-monthly-trend")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> issueMonthlyTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (int i = 5; i >= 0; i--) {
      java.time.YearMonth ym = java.time.YearMonth.from(today.minusMonths(i));
      java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
      java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
      long count = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getCreatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getDeleted, 0));
      list.add(java.util.Map.of("month", ym.toString(), "count", count));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/issue-close-rate-trend")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> issueCloseRateTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (int i = 5; i >= 0; i--) {
      java.time.YearMonth ym = java.time.YearMonth.from(today.minusMonths(i));
      java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
      java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
      long total = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getCreatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getDeleted, 0));
      long closed = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getUpdatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getStatus, "CLOSED")
          .eq(com.qms.entity.QualityIssue::getDeleted, 0));
      double rate = total == 0 ? 0.0 : Math.round((closed * 10000.0 / total)) / 100.0;
      list.add(java.util.Map.of("month", ym.toString(), "rate", rate));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/issue-severity-stack-trend")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> issueSeverityStackTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (int i = 5; i >= 0; i--) {
      java.time.YearMonth ym = java.time.YearMonth.from(today.minusMonths(i));
      java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
      java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
      long low = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getCreatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getSeverity, "LOW").eq(com.qms.entity.QualityIssue::getDeleted, 0));
      long medium = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getCreatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getSeverity, "MEDIUM").eq(com.qms.entity.QualityIssue::getDeleted, 0));
      long high = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>()
          .between(com.qms.entity.QualityIssue::getCreatedAt, start, end)
          .eq(com.qms.entity.QualityIssue::getSeverity, "HIGH").eq(com.qms.entity.QualityIssue::getDeleted, 0));
      list.add(java.util.Map.of("month", ym.toString(), "LOW", low, "MEDIUM", medium, "HIGH", high));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/kpi")
  public ApiResponse<java.util.Map<String, Object>> kpi() {
    long open = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "OPEN").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long closed = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "CLOSED").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long total = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getDeleted, 0));
    double closeRate = total == 0 ? 0.0 : Math.round((closed * 10000.0 / total)) / 100.0;
    long overdue = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getStatus, "OPEN").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    java.util.Map<String, Object> data = java.util.Map.of(
        "openIssues", open,
        "closeRate", closeRate,
        "avgResolutionDays", 3.5,
        "overdueIssues", overdue
    );
    return ApiResponse.ok(data);
  }

  @GetMapping("/department-radar")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> departmentRadar() {
    String[] deps = new String[] {"MFG","RND","PROC","QA"};
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (String d : deps) {
      long total = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getDepartment, d).eq(com.qms.entity.QualityIssue::getDeleted, 0));
      long resolved = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getDepartment, d).in(com.qms.entity.QualityIssue::getStatus, java.util.List.of("RESOLVED","CLOSED")).eq(com.qms.entity.QualityIssue::getDeleted, 0));
      list.add(java.util.Map.of("dep", d, "score", total == 0 ? 0 : Math.round(resolved * 100.0 / total)));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/issue-heatmap")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> issueHeatmap() {
    String[] modules = new String[] {"MFG","DESIGN","SUPPLIER","QA"};
    String[] sevs = new String[] {"LOW","MEDIUM","HIGH"};
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (String m : modules) {
      for (String s : sevs) {
        long cnt = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getModule, m).eq(com.qms.entity.QualityIssue::getSeverity, s).eq(com.qms.entity.QualityIssue::getDeleted, 0));
        list.add(java.util.Map.of("module", m, "severity", s, "count", cnt));
      }
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/vendor-rating-distribution")
  public ApiResponse<java.util.Map<String, Long>> vendorRatingDistribution() {
    long a = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getCategory, "SUPPLIER").eq(com.qms.entity.QualityIssue::getSeverity, "LOW").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long b = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getCategory, "SUPPLIER").eq(com.qms.entity.QualityIssue::getSeverity, "MEDIUM").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long c = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getCategory, "SUPPLIER").eq(com.qms.entity.QualityIssue::getSeverity, "HIGH").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    return ApiResponse.ok(java.util.Map.of("A", a, "B", b, "C", c));
  }

  @GetMapping("/quality-price-scatter")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> qualityPriceScatter() {
    java.util.List<com.qms.entity.QualityIssue> issues = issueMapper.selectList(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getCategory, "SUPPLIER").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (com.qms.entity.QualityIssue i : issues) {
      int q = "LOW".equals(i.getSeverity()) ? 90 : "MEDIUM".equals(i.getSeverity()) ? 70 : 50;
      int p = 100 + (int)((i.getId() == null ? 0 : i.getId()) % 200);
      list.add(java.util.Map.of("quality", q, "price", p, "name", "V"+(i.getReporterId()==null?1:i.getReporterId())));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/supply-tree")
  public ApiResponse<java.util.List<java.util.Map<String, Object>>> supplyTree() {
    String[] deps = new String[] {"MFG","RND","PROC","QA"};
    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
    for (String d : deps) {
      long cnt = issueMapper.selectCount(new LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getDepartment, d).eq(com.qms.entity.QualityIssue::getCategory, "SUPPLIER").eq(com.qms.entity.QualityIssue::getDeleted, 0));
      list.add(java.util.Map.of("name", d, "size", cnt == 0 ? 1 : cnt));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/issue-severity-distribution")
  public ApiResponse<java.util.Map<String, Long>> issueSeverityDistribution() {
    long low = issueMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getSeverity, "LOW").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long medium = issueMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getSeverity, "MEDIUM").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    long high = issueMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getSeverity, "HIGH").eq(com.qms.entity.QualityIssue::getDeleted, 0));
    java.util.Map<String, Long> data = java.util.Map.of("LOW", low, "MEDIUM", medium, "HIGH", high);
    return ApiResponse.ok(data);
  }

  @GetMapping("/issue-category-distribution")
  public ApiResponse<java.util.Map<String, Long>> issueCategoryDistribution() {
    String[] cats = new String[] {"PROCESS","DESIGN","SUPPLIER","AUDIT"};
    java.util.Map<String, Long> map = new java.util.HashMap<>();
    for (String c : cats) {
      long cnt = issueMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getCategory, c).eq(com.qms.entity.QualityIssue::getDeleted, 0));
      map.put(c, cnt);
    }
    return ApiResponse.ok(map);
  }
  
  @GetMapping("/issue-module-distribution")
  public ApiResponse<java.util.Map<String, Long>> issueModuleDistribution() {
    String[] modules = new String[] {"MFG","DESIGN","SUPPLIER","QA"};
    java.util.Map<String, Long> map = new java.util.HashMap<>();
    for (String m : modules) {
      long cnt = issueMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getModule, m).eq(com.qms.entity.QualityIssue::getDeleted, 0));
      map.put(m, cnt);
    }
    return ApiResponse.ok(map);
  }

  @GetMapping("/issue-department-distribution")
  public ApiResponse<java.util.Map<String, Long>> issueDepartmentDistribution() {
    String[] deps = new String[] {"MFG","RND","PROC","QA"};
    java.util.Map<String, Long> map = new java.util.HashMap<>();
    for (String d : deps) {
      long cnt = issueMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue>().eq(com.qms.entity.QualityIssue::getDepartment, d).eq(com.qms.entity.QualityIssue::getDeleted, 0));
      map.put(d, cnt);
    }
    return ApiResponse.ok(map);
  }
}
