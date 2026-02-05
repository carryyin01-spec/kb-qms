package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.AuditPlan;
import com.qms.mapper.AuditPlanMapper;
import org.springframework.stereotype.Service;

@Service
public class AuditPlanService {
  private final AuditPlanMapper mapper;

  public AuditPlanService(AuditPlanMapper mapper) {
    this.mapper = mapper;
  }

  public Page<AuditPlan> page(long page, long size, String title, String status) {
    LambdaQueryWrapper<AuditPlan> w = new LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), AuditPlan::getTitle, title);
    w.eq(status != null && !status.isEmpty(), AuditPlan::getStatus, status);
    return mapper.selectPage(Page.of(page, size), w);
  }

  public AuditPlan get(Long id) {
    return mapper.selectById(id);
  }

  public void create(AuditPlan p) {
    p.setDeleted(0);
    mapper.insert(p);
  }

  public void update(AuditPlan p) {
    mapper.updateById(p);
  }

  public void delete(Long id) {
    mapper.deleteById(id);
  }
}

