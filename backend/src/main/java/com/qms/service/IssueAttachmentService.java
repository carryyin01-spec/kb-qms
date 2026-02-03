package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.IssueAttachment;
import com.qms.mapper.IssueAttachmentMapper;
import org.springframework.stereotype.Service;

@Service
public class IssueAttachmentService {
  private final IssueAttachmentMapper attachmentMapper;

  public IssueAttachmentService(IssueAttachmentMapper attachmentMapper) {
    this.attachmentMapper = attachmentMapper;
  }

  public Page<IssueAttachment> list(Long issueId, long page, long size) {
    return attachmentMapper.selectPage(Page.of(page, size),
        new LambdaQueryWrapper<IssueAttachment>().eq(IssueAttachment::getIssueId, issueId).eq(IssueAttachment::getDeleted, 0).orderByDesc(IssueAttachment::getCreatedAt));
  }

  public void add(IssueAttachment a) {
    a.setDeleted(0);
    attachmentMapper.insert(a);
  }

  public void delete(Long id) {
    IssueAttachment a = attachmentMapper.selectById(id);
    if (a != null) {
      a.setDeleted(1);
      attachmentMapper.updateById(a);
    }
  }
}

