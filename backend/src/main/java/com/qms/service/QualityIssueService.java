package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.QualityIssue;
import com.qms.mapper.QualityIssueMapper;
import org.springframework.stereotype.Service;

@Service
public class QualityIssueService {
  private final QualityIssueMapper issueMapper;

  public QualityIssueService(QualityIssueMapper issueMapper) {
    this.issueMapper = issueMapper;
  }

  public Page<QualityIssue> page(long page, long size, String title, String severity, String status, String category, String module, String department) {
    LambdaQueryWrapper<QualityIssue> w = new LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), QualityIssue::getTitle, title);
    w.eq(severity != null && !severity.isEmpty(), QualityIssue::getSeverity, severity);
    w.eq(status != null && !status.isEmpty(), QualityIssue::getStatus, status);
    w.eq(category != null && !category.isEmpty(), QualityIssue::getCategory, category);
    w.eq(module != null && !module.isEmpty(), QualityIssue::getModule, module);
    w.eq(department != null && !department.isEmpty(), QualityIssue::getDepartment, department);
    w.eq(QualityIssue::getDeleted, 0);
    return issueMapper.selectPage(Page.of(page, size), w);
  }

  public QualityIssue get(Long id) {
    return issueMapper.selectById(id);
  }

  public void create(QualityIssue i) {
    i.setDeleted(0);
    issueMapper.insert(i);
  }

  public void update(QualityIssue i) {
    issueMapper.updateById(i);
  }

  public void delete(Long id) {
    QualityIssue i = issueMapper.selectById(id);
    if (i != null) {
      i.setDeleted(1);
      issueMapper.updateById(i);
    }
  }
}
