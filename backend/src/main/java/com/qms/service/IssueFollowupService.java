package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.IssueFollowup;
import com.qms.mapper.IssueFollowupMapper;
import org.springframework.stereotype.Service;

@Service
public class IssueFollowupService {
  private final IssueFollowupMapper mapper;

  public IssueFollowupService(IssueFollowupMapper mapper) {
    this.mapper = mapper;
  }

  public Page<IssueFollowup> list(Long issueId, long page, long size) {
    return mapper.selectPage(Page.of(page, size),
        new LambdaQueryWrapper<IssueFollowup>()
            .eq(IssueFollowup::getIssueId, issueId)
            .eq(IssueFollowup::getDeleted, 0)
            .orderByDesc(IssueFollowup::getCreatedAt));
  }

  public void add(IssueFollowup f) {
    f.setDeleted(0);
    mapper.insert(f);
  }
}

