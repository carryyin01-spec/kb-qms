package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.DocumentVersion;
import com.qms.mapper.DocumentVersionMapper;
import org.springframework.stereotype.Service;

@Service
public class DocumentVersionService {
  private final DocumentVersionMapper versionMapper;
  private final com.qms.mapper.DocumentMapper documentMapper;

  public DocumentVersionService(DocumentVersionMapper versionMapper, com.qms.mapper.DocumentMapper documentMapper) {
    this.versionMapper = versionMapper;
    this.documentMapper = documentMapper;
  }

  public Page<DocumentVersion> listByDocument(Long documentId, long page, long size) {
    LambdaQueryWrapper<DocumentVersion> w = new LambdaQueryWrapper<>();
    w.eq(DocumentVersion::getDocumentId, documentId);
    w.eq(DocumentVersion::getDeleted, 0);
    w.orderByDesc(DocumentVersion::getVersionNo);
    return versionMapper.selectPage(Page.of(page, size), w);
  }

  public void addVersion(DocumentVersion v) {
    v.setDeleted(0);
    Integer latest = latestVersionNo(v.getDocumentId());
    v.setVersionNo(latest == null ? 1 : latest + 1);
    versionMapper.insert(v);
  }

  public Integer latestVersionNo(Long documentId) {
    Page<DocumentVersion> p = versionMapper.selectPage(Page.of(1, 1),
        new LambdaQueryWrapper<DocumentVersion>()
            .eq(DocumentVersion::getDocumentId, documentId)
            .eq(DocumentVersion::getDeleted, 0)
            .orderByDesc(DocumentVersion::getVersionNo));
    if (p.getRecords().isEmpty()) return null;
    return p.getRecords().get(0).getVersionNo();
  }

  public void rollback(Long documentId, Long versionId) {
    DocumentVersion v = versionMapper.selectById(versionId);
    if (v == null || !v.getDocumentId().equals(documentId)) return;
    com.qms.entity.Document d = documentMapper.selectById(documentId);
    if (d == null) return;
    d.setContent(v.getContent());
    documentMapper.updateById(d);
    DocumentVersion nv = new DocumentVersion();
    nv.setDocumentId(documentId);
    nv.setContent(v.getContent());
    nv.setDeleted(0);
    Integer latest = latestVersionNo(documentId);
    nv.setVersionNo(latest == null ? 1 : latest + 1);
    versionMapper.insert(nv);
  }
}

