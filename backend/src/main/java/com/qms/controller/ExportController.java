package com.qms.controller;

import com.qms.entity.Document;
import com.qms.mapper.DocumentMapper;
import com.qms.mapper.QualityIssueMapper;
import com.qms.dto.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.io.File;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/export")
public class ExportController {
  private final DocumentMapper documentMapper;
  private final QualityIssueMapper issueMapper;

  public ExportController(DocumentMapper documentMapper, QualityIssueMapper issueMapper) {
    this.documentMapper = documentMapper;
    this.issueMapper = issueMapper;
  }

  @GetMapping("/documents.csv")
  @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('DOC_EXPORT') or hasRole('ADMIN')")
  public void exportDocuments(HttpServletResponse resp,
                              @RequestParam(required = false) String status,
                              @RequestParam(required = false) String title,
                              @RequestParam(required = false) String start,
                              @RequestParam(required = false) String end) throws IOException {
    resp.setContentType("text/csv;charset=UTF-8");
    String filename = URLEncoder.encode("documents.csv", StandardCharsets.UTF_8);
    resp.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.Document> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), com.qms.entity.Document::getTitle, title);
    w.eq(status != null && !status.isEmpty(), com.qms.entity.Document::getStatus, status);
    if (start != null && !start.isEmpty() && end != null && !end.isEmpty()) {
      java.time.LocalDateTime s = java.time.LocalDate.parse(start).atStartOfDay();
      java.time.LocalDateTime e = java.time.LocalDate.parse(end).atTime(23, 59, 59);
      w.between(com.qms.entity.Document::getCreatedAt, s, e);
    }
    List<com.qms.entity.Document> docs = documentMapper.selectList(w);
    StringBuilder sb = new StringBuilder();
    sb.append("id,title,status,ownerId\n");
    for (Document d : docs) {
      sb.append(d.getId()).append(",")
        .append(escape(d.getTitle())).append(",")
        .append(escape(d.getStatus())).append(",")
        .append(d.getOwnerId() == null ? "" : d.getOwnerId())
        .append("\n");
    }
    resp.getWriter().write(sb.toString());
  }
  
  @GetMapping("/documents.xlsx")
  @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('DOC_EXPORT') or hasRole('ADMIN')")
  public void exportDocumentsXlsx(HttpServletResponse resp,
                                  @RequestParam(required = false) String status,
                                  @RequestParam(required = false) String title,
                                  @RequestParam(required = false) String start,
                                  @RequestParam(required = false) String end) throws IOException {
    resp.setContentType("application/vnd.ms-excel;charset=UTF-8");
    String filename = URLEncoder.encode("documents.xlsx", StandardCharsets.UTF_8);
    resp.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.Document> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), com.qms.entity.Document::getTitle, title);
    w.eq(status != null && !status.isEmpty(), com.qms.entity.Document::getStatus, status);
    if (start != null && !start.isEmpty() && end != null && !end.isEmpty()) {
      java.time.LocalDateTime s = java.time.LocalDate.parse(start).atStartOfDay();
      java.time.LocalDateTime e = java.time.LocalDate.parse(end).atTime(23, 59, 59);
      w.between(com.qms.entity.Document::getCreatedAt, s, e);
    }
    List<com.qms.entity.Document> docs = documentMapper.selectList(w);
    StringBuilder sb = new StringBuilder();
    sb.append("<table border='1'><tr><th>ID</th><th>标题</th><th>状态</th><th>所有者</th></tr>");
    for (Document d : docs) {
      sb.append("<tr><td>").append(d.getId()).append("</td><td>")
        .append(d.getTitle() == null ? "" : d.getTitle()).append("</td><td>")
        .append(d.getStatus() == null ? "" : d.getStatus()).append("</td><td>")
        .append(d.getOwnerId() == null ? "" : d.getOwnerId()).append("</td></tr>");
    }
    sb.append("</table>");
    resp.getWriter().write(sb.toString());
  }


  private String escape(String s) {
    if (s == null) return "";
    String v = s.replace("\"", "\"\"");
    if (v.contains(",") || v.contains("\n")) {
      return "\"" + v + "\"";
    }
    return v;
  }

  @PostMapping("/upload")
  public ApiResponse<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) {
      return ApiResponse.fail(400, "文件为空");
    }
    String baseDir = "uploads";
    String dateDir = LocalDate.now().toString();
    File dir = new File(baseDir, dateDir);
    if (!dir.exists()) {
      dir.mkdirs();
    }
    String original = org.springframework.util.StringUtils.cleanPath(file.getOriginalFilename());
    String filename = UUID.randomUUID().toString() + "_" + original;
    File dest = new File(dir, filename);
    file.transferTo(dest);
    String url = "/api/files/" + dateDir + "/" + filename;
    return ApiResponse.ok(Map.of("url", url));
  }

  @GetMapping("/issues.csv")
  @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ISSUE_EXPORT') or hasRole('ADMIN')")
  public void exportIssues(HttpServletResponse resp,
                           @RequestParam(required = false) String status,
                           @RequestParam(required = false) String severity,
                           @RequestParam(required = false) String title,
                           @RequestParam(required = false) String category,
                           @RequestParam(required = false) String module,
                           @RequestParam(required = false) String department,
                           @RequestParam(required = false) String start,
                           @RequestParam(required = false) String end) throws IOException {
    resp.setContentType("text/csv;charset=UTF-8");
    String filename = URLEncoder.encode("issues.csv", StandardCharsets.UTF_8);
    resp.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), com.qms.entity.QualityIssue::getTitle, title);
    w.eq(status != null && !status.isEmpty(), com.qms.entity.QualityIssue::getStatus, status);
    w.eq(severity != null && !severity.isEmpty(), com.qms.entity.QualityIssue::getSeverity, severity);
    w.eq(category != null && !category.isEmpty(), com.qms.entity.QualityIssue::getCategory, category);
    w.eq(module != null && !module.isEmpty(), com.qms.entity.QualityIssue::getModule, module);
    w.eq(department != null && !department.isEmpty(), com.qms.entity.QualityIssue::getDepartment, department);
    if (start != null && !start.isEmpty() && end != null && !end.isEmpty()) {
      java.time.LocalDateTime s = java.time.LocalDate.parse(start).atStartOfDay();
      java.time.LocalDateTime e = java.time.LocalDate.parse(end).atTime(23, 59, 59);
      w.between(com.qms.entity.QualityIssue::getCreatedAt, s, e);
    }
    java.util.List<com.qms.entity.QualityIssue> list = issueMapper.selectList(w);
    StringBuilder sb = new StringBuilder();
    sb.append("id,title,severity,category,module,department,status,reporterId\n");
    for (com.qms.entity.QualityIssue i : list) {
      sb.append(i.getId()).append(",")
        .append(escape(i.getTitle())).append(",")
        .append(escape(i.getSeverity())).append(",")
        .append(escape(i.getCategory())).append(",")
        .append(escape(i.getModule())).append(",")
        .append(escape(i.getDepartment())).append(",")
        .append(escape(i.getStatus())).append(",")
        .append(i.getReporterId() == null ? "" : i.getReporterId())
        .append("\n");
    }
    resp.getWriter().write(sb.toString());
  }

  @GetMapping("/issues.xlsx")
  @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ISSUE_EXPORT') or hasRole('ADMIN')")
  public void exportIssuesXlsx(HttpServletResponse resp,
                               @RequestParam(required = false) String status,
                               @RequestParam(required = false) String severity,
                               @RequestParam(required = false) String title,
                               @RequestParam(required = false) String category,
                               @RequestParam(required = false) String module,
                               @RequestParam(required = false) String department,
                               @RequestParam(required = false) String start,
                               @RequestParam(required = false) String end) throws IOException {
    resp.setContentType("application/vnd.ms-excel;charset=UTF-8");
    String filename = URLEncoder.encode("issues.xlsx", StandardCharsets.UTF_8);
    resp.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.qms.entity.QualityIssue> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), com.qms.entity.QualityIssue::getTitle, title);
    w.eq(status != null && !status.isEmpty(), com.qms.entity.QualityIssue::getStatus, status);
    w.eq(severity != null && !severity.isEmpty(), com.qms.entity.QualityIssue::getSeverity, severity);
    w.eq(category != null && !category.isEmpty(), com.qms.entity.QualityIssue::getCategory, category);
    w.eq(module != null && !module.isEmpty(), com.qms.entity.QualityIssue::getModule, module);
    w.eq(department != null && !department.isEmpty(), com.qms.entity.QualityIssue::getDepartment, department);
    if (start != null && !start.isEmpty() && end != null && !end.isEmpty()) {
      java.time.LocalDateTime s = java.time.LocalDate.parse(start).atStartOfDay();
      java.time.LocalDateTime e = java.time.LocalDate.parse(end).atTime(23, 59, 59);
      w.between(com.qms.entity.QualityIssue::getCreatedAt, s, e);
    }
    java.util.List<com.qms.entity.QualityIssue> issues = issueMapper.selectList(w);
    StringBuilder sb = new StringBuilder();
    sb.append("<table border='1'><tr><th>ID</th><th>标题</th><th>严重度</th><th>类别</th><th>模块</th><th>责任部门</th><th>状态</th></tr>");
    for (com.qms.entity.QualityIssue i : issues) {
      sb.append("<tr><td>").append(i.getId()).append("</td><td>")
        .append(i.getTitle() == null ? "" : i.getTitle()).append("</td><td>")
        .append(i.getSeverity() == null ? "" : i.getSeverity()).append("</td><td>")
        .append(i.getCategory() == null ? "" : i.getCategory()).append("</td><td>")
        .append(i.getModule() == null ? "" : i.getModule()).append("</td><td>")
        .append(i.getDepartment() == null ? "" : i.getDepartment()).append("</td><td>")
        .append(i.getStatus() == null ? "" : i.getStatus()).append("</td></tr>");
    }
    sb.append("</table>");
    resp.getWriter().write(sb.toString());
  }
}

