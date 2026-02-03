package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.Document;
import com.qms.mapper.DocumentMapper;
import org.springframework.stereotype.Service;

@Service
public class DocumentService {
  private final DocumentMapper documentMapper;

  public DocumentService(DocumentMapper documentMapper) {
    this.documentMapper = documentMapper;
  }

  public Page<Document> page(long page, long size, String title, String status) {
    LambdaQueryWrapper<Document> w = new LambdaQueryWrapper<>();
    w.eq(status != null && !status.isEmpty(), Document::getStatus, status);
    w.like(title != null && !title.isEmpty(), Document::getTitle, title);
    w.eq(Document::getDeleted, 0);
    return documentMapper.selectPage(Page.of(page, size), w);
  }

  public Document get(Long id) {
    return documentMapper.selectById(id);
  }

  public void create(Document d) {
    d.setDeleted(0);
    documentMapper.insert(d);
  }

  public void update(Document d) {
    documentMapper.updateById(d);
  }

  public void delete(Long id) {
    Document d = documentMapper.selectById(id);
    if (d != null) {
      d.setDeleted(1);
      documentMapper.updateById(d);
    }
  }
}

