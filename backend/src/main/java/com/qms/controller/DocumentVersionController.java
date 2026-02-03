package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.DocumentVersion;
import com.qms.service.DocumentVersionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/document-versions")
public class DocumentVersionController {
  private final DocumentVersionService versionService;

  public DocumentVersionController(DocumentVersionService versionService) {
    this.versionService = versionService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<DocumentVersion>> list(@RequestParam Long documentId,
                                                 @RequestParam(defaultValue = "1") long page,
                                                 @RequestParam(defaultValue = "10") long size) {
    return ApiResponse.ok(versionService.listByDocument(documentId, page, size));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody DocumentVersion v) {
    versionService.addVersion(v);
    return ApiResponse.ok(null);
  }

  @PostMapping("/rollback")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> rollback(@RequestParam Long documentId, @RequestParam Long versionId) {
    versionService.rollback(documentId, versionId);
    return ApiResponse.ok(null);
  }
}

