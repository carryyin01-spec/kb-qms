package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.mapper.DocumentMapper;
import com.qms.mapper.CustomerComplaintMapper;
import com.qms.mapper.AuditPlanMapper;
import com.qms.mapper.NotificationMapper;
import com.qms.entity.CustomerComplaint;
import com.qms.entity.Document;
import com.qms.entity.Notification;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
  private final DocumentMapper documentMapper;
  private final CustomerComplaintMapper complaintMapper;
  private final AuditPlanMapper auditPlanMapper;
  private final NotificationMapper notificationMapper;

  public DashboardController(DocumentMapper documentMapper, CustomerComplaintMapper complaintMapper, AuditPlanMapper auditPlanMapper, NotificationMapper notificationMapper) {
    this.documentMapper = documentMapper;
    this.complaintMapper = complaintMapper;
    this.auditPlanMapper = auditPlanMapper;
    this.notificationMapper = notificationMapper;
  }

  @GetMapping("/stats")
  public ApiResponse<Map<String, Object>> stats() {
    long docCount = documentMapper.selectCount(new LambdaQueryWrapper<Document>().eq(Document::getDeleted, 0));
    long complaintCount = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getDeleted, 0));
    long auditCount = auditPlanMapper.selectCount(null);
    long notifCount = notificationMapper.selectCount(new QueryWrapper<Notification>().eq("deleted", 0));
    Map<String, Object> data = Map.of(
        "documents", docCount,
        "complaints", complaintCount,
        "audits", auditCount,
        "notifications", notifCount
    );
    return ApiResponse.ok(data);
  }

  @GetMapping("/complaint-status-distribution")
  public ApiResponse<Map<String, Long>> complaintStatusDistribution() {
    long open = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getStatus, "open").eq(CustomerComplaint::getDeleted, 0));
    long ongoing = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getStatus, "on-going").eq(CustomerComplaint::getDeleted, 0));
    long closed = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getStatus, "closed").eq(CustomerComplaint::getDeleted, 0));
    Map<String, Long> data = Map.of(
        "open", open,
        "on-going", ongoing,
        "closed", closed
    );
    return ApiResponse.ok(data);
  }

  @GetMapping("/complaint-trend")
  public ApiResponse<List<Map<String, Object>>> complaintTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    List<Map<String, Object>> list = new ArrayList<>();
    for (int i = 6; i >= 0; i--) {
      java.time.LocalDate d = today.minusDays(i);
      java.time.LocalDateTime start = d.atStartOfDay();
      java.time.LocalDateTime end = d.atTime(23, 59, 59);
      long count = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>()
          .between(CustomerComplaint::getComplaintTime, start, end)
          .eq(CustomerComplaint::getDeleted, 0));
      list.add(Map.of("date", d.toString(), "count", count));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/complaint-monthly-trend")
  public ApiResponse<List<Map<String, Object>>> complaintMonthlyTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    List<Map<String, Object>> list = new ArrayList<>();
    for (int i = 5; i >= 0; i--) {
      java.time.YearMonth ym = java.time.YearMonth.from(today.minusMonths(i));
      java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
      java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
      long count = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>()
          .between(CustomerComplaint::getComplaintTime, start, end)
          .eq(CustomerComplaint::getDeleted, 0));
      list.add(Map.of("month", ym.toString(), "count", count));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/complaint-close-rate-trend")
  public ApiResponse<List<Map<String, Object>>> complaintCloseRateTrend() {
    java.time.LocalDate today = java.time.LocalDate.now();
    List<Map<String, Object>> list = new ArrayList<>();
    for (int i = 5; i >= 0; i--) {
      java.time.YearMonth ym = java.time.YearMonth.from(today.minusMonths(i));
      java.time.LocalDateTime start = ym.atDay(1).atStartOfDay();
      java.time.LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
      long total = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>()
          .between(CustomerComplaint::getComplaintTime, start, end)
          .eq(CustomerComplaint::getDeleted, 0));
      long closed = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>()
          .between(CustomerComplaint::getUpdatedAt, start, end)
          .eq(CustomerComplaint::getStatus, "closed")
          .eq(CustomerComplaint::getDeleted, 0));
      double rate = total == 0 ? 0.0 : Math.round((closed * 10000.0 / total)) / 100.0;
      list.add(Map.of("month", ym.toString(), "rate", rate));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/kpi")
  public ApiResponse<Map<String, Object>> kpi() {
    long open = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getStatus, "open").eq(CustomerComplaint::getDeleted, 0));
    long closed = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getStatus, "closed").eq(CustomerComplaint::getDeleted, 0));
    long total = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getDeleted, 0));
    double closeRate = total == 0 ? 0.0 : Math.round((closed * 10000.0 / total)) / 100.0;
    long overdue = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getStatus, "open").eq(CustomerComplaint::getDeleted, 0));
    Map<String, Object> data = Map.of(
        "openComplaints", open,
        "closeRate", closeRate,
        "avgResolutionDays", 3.5,
        "overdueComplaints", overdue
    );
    return ApiResponse.ok(data);
  }

  @GetMapping("/department-radar")
  public ApiResponse<List<Map<String, Object>>> departmentRadar() {
    String[] deps = new String[] {"制造部","研发部","采购部","质量部"};
    List<Map<String, Object>> list = new ArrayList<>();
    for (String d : deps) {
      long total = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getResponsibleDept, d).eq(CustomerComplaint::getDeleted, 0));
      long resolved = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getResponsibleDept, d).in(CustomerComplaint::getStatus, List.of("closed")).eq(CustomerComplaint::getDeleted, 0));
      list.add(Map.of("dep", d, "score", total == 0 ? 0 : Math.round(resolved * 100.0 / total)));
    }
    return ApiResponse.ok(list);
  }

  @GetMapping("/complaint-heatmap")
  public ApiResponse<List<Map<String, Object>>> complaintHeatmap() {
    String[] modules = new String[] {"生产部门","质量部门"};
    String[] sevs = new String[] {"LOW","MEDIUM","HIGH"};
    List<Map<String, Object>> list = new ArrayList<>();
    for (String m : modules) {
      for (String s : sevs) {
        long cnt = complaintMapper.selectCount(new LambdaQueryWrapper<CustomerComplaint>().eq(CustomerComplaint::getProductionDept, m).eq(CustomerComplaint::getSeverityLevel, s).eq(CustomerComplaint::getDeleted, 0));
        list.add(Map.of("module", m, "severity", s, "count", cnt));
      }
    }
    return ApiResponse.ok(list);
  }
}
