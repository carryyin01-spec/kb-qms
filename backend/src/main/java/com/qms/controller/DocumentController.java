package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.dto.DocumentCreateRequest;
import com.qms.dto.DocumentUpdateRequest;
import com.qms.entity.Document;
import com.qms.service.DocumentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documents")
public class DocumentController {
  private final DocumentService documentService;

  public DocumentController(DocumentService documentService) {
    this.documentService = documentService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<Document>> list(@RequestParam(defaultValue = "1") long page,
                                          @RequestParam(defaultValue = "10") long size,
                                          @RequestParam(required = false) String title,
                                          @RequestParam(required = false) String status) {
    return ApiResponse.ok(documentService.page(page, size, title, status));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Document> get(@PathVariable Long id) {
    return ApiResponse.ok(documentService.get(id));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('DOC_CREATE') or hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody @jakarta.validation.Valid DocumentCreateRequest req) {
    Document d = new Document();
    d.setTitle(req.getTitle());
    d.setContent(req.getContent());
    d.setStatus(req.getStatus());
    d.setOwnerId(req.getOwnerId());
    documentService.create(d);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('DOC_UPDATE') or hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody @jakarta.validation.Valid DocumentUpdateRequest req) {
    Document d = new Document();
    d.setId(id);
    d.setTitle(req.getTitle());
    d.setContent(req.getContent());
    d.setStatus(req.getStatus());
    d.setOwnerId(req.getOwnerId());
    documentService.update(d);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('DOC_DELETE') or hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    documentService.delete(id);
    return ApiResponse.ok(null);
  }
}
