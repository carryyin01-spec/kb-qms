package com.qms.controller;

import com.qms.entity.Document;
import com.qms.entity.CustomerComplaint;
import com.qms.mapper.DocumentMapper;
import com.qms.mapper.CustomerComplaintMapper;
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

import org.springframework.beans.factory.annotation.Value;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.util.IOUtils;
import java.io.FileInputStream;
import java.io.InputStream;

@RestController
@RequestMapping("/export")
public class ExportController {
  private final DocumentMapper documentMapper;
  private final CustomerComplaintMapper complaintMapper;

  @Value("${file.upload-dir}")
  private String uploadDir;

  @jakarta.annotation.PostConstruct
  public void init() {
    System.out.println("ExportController initialized. uploadDir: " + uploadDir);
  }

  public ExportController(DocumentMapper documentMapper, CustomerComplaintMapper complaintMapper) {
    this.documentMapper = documentMapper;
    this.complaintMapper = complaintMapper;
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

  @GetMapping("/complaints.csv")
  @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('COMPLAINT_EXPORT') or hasRole('ADMIN')")
  public void exportComplaints(HttpServletResponse resp,
                           @RequestParam(required = false) String status,
                           @RequestParam(required = false) String customerCode,
                           @RequestParam(required = false) String productModel,
                           @RequestParam(required = false) String start,
                           @RequestParam(required = false) String end) throws IOException {
    resp.setContentType("text/csv;charset=UTF-8");
    String filename = URLEncoder.encode("complaints.csv", StandardCharsets.UTF_8);
    resp.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<CustomerComplaint> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.like(customerCode != null && !customerCode.isEmpty(), CustomerComplaint::getCustomerCode, customerCode);
    w.like(productModel != null && !productModel.isEmpty(), CustomerComplaint::getProductModel, productModel);
    w.eq(status != null && !status.isEmpty(), CustomerComplaint::getStatus, status);
    if (start != null && !start.isEmpty() && end != null && !end.isEmpty()) {
      java.time.LocalDateTime s = java.time.LocalDate.parse(start).atStartOfDay();
      java.time.LocalDateTime e = java.time.LocalDate.parse(end).atTime(23, 59, 59);
      w.between(CustomerComplaint::getComplaintTime, s, e);
    }
    List<CustomerComplaint> list = complaintMapper.selectList(w);
    StringBuilder sb = new StringBuilder();
    sb.append("id,月份,周期,客户等级,投诉时间,客户代码,产品型号,问题来源,生产部门,订单数量,投诉数量,问题性质,检验员,不良SN,投诉问题描述,不良图片,是否计入指标,严重等级,问题小类,原因(简述),改善措施,责任人,责任线长,责任主管,责任部门,备注,状态\n");
    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    for (CustomerComplaint i : list) {
      String complaintTimeStr = i.getComplaintTime() != null ? i.getComplaintTime().format(formatter) : "";
      sb.append(i.getId()).append(",")
        .append(escape(i.getMonth())).append(",")
        .append(escape(i.getCycle())).append(",")
        .append(escape(i.getCustomerGrade())).append(",")
        .append(escape(complaintTimeStr)).append(",")
        .append(escape(i.getCustomerCode())).append(",")
        .append(escape(i.getProductModel())).append(",")
        .append(escape(i.getProblemSource())).append(",")
        .append(escape(i.getProductionDept())).append(",")
        .append(i.getOrderQty()).append(",")
        .append(i.getComplaintQty()).append(",")
        .append(escape(i.getProblemNature())).append(",")
        .append(escape(i.getInspector())).append(",")
        .append(escape(i.getDefectSn())).append(",")
        .append(escape(i.getComplaintDescription())).append(",")
        .append(escape(i.getDefectPictures())).append(",")
        .append(escape(i.getIsIncludedInIndicators())).append(",")
        .append(escape(i.getSeverityLevel())).append(",")
        .append(escape(i.getProblemSubtype())).append(",")
        .append(escape(i.getRootCause())).append(",")
        .append(escape(i.getImprovementMeasures())).append(",")
        .append(escape(i.getOwner())).append(",")
        .append(escape(i.getLineLeader())).append(",")
        .append(escape(i.getSupervisor())).append(",")
        .append(escape(i.getResponsibleDept())).append(",")
        .append(escape(i.getRemark())).append(",")
        .append(escape(i.getStatus()))
        .append("\n");
    }
    resp.getWriter().write(sb.toString());
  }

  @GetMapping("/complaints.xlsx")
  @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('COMPLAINT_EXPORT') or hasRole('ADMIN')")
  public void exportComplaintsXlsx(HttpServletResponse resp,
                               @RequestParam(required = false) String status,
                               @RequestParam(required = false) String customerCode,
                               @RequestParam(required = false) String productModel,
                               @RequestParam(required = false) String start,
                               @RequestParam(required = false) String end) throws IOException {
    com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<CustomerComplaint> w = new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<>();
    w.like(customerCode != null && !customerCode.isEmpty(), CustomerComplaint::getCustomerCode, customerCode);
    w.like(productModel != null && !productModel.isEmpty(), CustomerComplaint::getProductModel, productModel);
    w.eq(status != null && !status.isEmpty(), CustomerComplaint::getStatus, status);
    if (start != null && !start.isEmpty() && end != null && !end.isEmpty()) {
      java.time.LocalDateTime s = java.time.LocalDate.parse(start).atStartOfDay();
      java.time.LocalDateTime e = java.time.LocalDate.parse(end).atTime(23, 59, 59);
      w.between(CustomerComplaint::getComplaintTime, s, e);
    }
    List<CustomerComplaint> list = complaintMapper.selectList(w);

    ExcelWriter writer = ExcelUtil.getWriter(true);
    
    // 设置列宽
    writer.setColumnWidth(-1, 15);
    writer.setColumnWidth(15, 40); // 不良图片列宽加大
    
    // 写入表头
    writer.writeHeadRow(java.util.Arrays.asList(
        "ID", "月份", "周期", "客户等级", "投诉时间", "客户代码", "产品型号", "问题来源",
        "生产部门", "订单数量", "投诉数量", "问题性质", "检验员", "不良SN", "投诉问题描述",
        "不良图片", "是否计入指标", "严重等级", "问题小类", "原因(简述)", "改善措施",
        "责任人", "责任线长", "责任主管", "责任部门", "备注", "状态"
    ));

    int rowIndex = 1;
    java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    for (CustomerComplaint i : list) {
      String complaintTimeStr = i.getComplaintTime() != null ? i.getComplaintTime().format(formatter) : "";
      
      // 先写入数据行
      writer.writeRow(java.util.Arrays.asList(
          i.getId(), i.getMonth(), i.getCycle(), i.getCustomerGrade(), complaintTimeStr,
          i.getCustomerCode(), i.getProductModel(), i.getProblemSource(), i.getProductionDept(),
          i.getOrderQty(), i.getComplaintQty(), i.getProblemNature(), i.getInspector(),
          i.getDefectSn(), i.getComplaintDescription(), "", // 图片列留空给 writeImg
          i.getIsIncludedInIndicators(), i.getSeverityLevel(), i.getProblemSubtype(),
          i.getRootCause(), i.getImprovementMeasures(), i.getOwner(), i.getLineLeader(),
          i.getSupervisor(), i.getResponsibleDept(), i.getRemark(), i.getStatus()
      ), false);

      // 设置该行高度
      writer.setRowHeight(rowIndex, 60);

      // 处理图片
      if (i.getDefectPictures() != null && !i.getDefectPictures().isEmpty()) {
        String[] pics = i.getDefectPictures().split(",");
        if (pics.length > 0) {
          String firstPic = pics[0].trim();
          String relativePath = firstPic;
          String[] prefixes = {"/api/files/", "api/files/", "/api/", "api/", "/files/", "files/"};
          for (String p : prefixes) {
            if (relativePath.startsWith(p)) {
              relativePath = relativePath.substring(p.length());
              break;
            }
          }
          if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);
          
          File imgFile = new File(uploadDir, relativePath);
          if (imgFile.exists() && imgFile.isFile()) {
            try {
              // Hutool writeImg: 0-indexed column and row
              // 我们希望图片居中一点，稍微缩放
              // 参数: File, leftCol, topRow, rightCol, bottomRow
              writer.writeImg(imgFile, 15, rowIndex, 15, rowIndex);
            } catch (Exception ex) {
              System.err.println("Error writing image " + imgFile.getAbsolutePath() + ": " + ex.getMessage());
            }
          } else {
            System.err.println("Image not found or not a file: " + imgFile.getAbsolutePath());
          }
        }
      }
      rowIndex++;
    }

    resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8");
    String filename = URLEncoder.encode("complaints.xlsx", StandardCharsets.UTF_8);
    resp.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);
    
    java.io.OutputStream out = resp.getOutputStream();
    writer.flush(out);
    writer.close();
    out.close();
  }
}

