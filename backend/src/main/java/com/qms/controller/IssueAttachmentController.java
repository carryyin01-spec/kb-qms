package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.IssueAttachment;
import com.qms.service.IssueAttachmentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/issue-attachments")
public class IssueAttachmentController {
  private final IssueAttachmentService attachmentService;

  public IssueAttachmentController(IssueAttachmentService attachmentService) {
    this.attachmentService = attachmentService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<IssueAttachment>> list(@RequestParam Long issueId,
                                                 @RequestParam(defaultValue = "1") long page,
                                                 @RequestParam(defaultValue = "10") long size) {
    return ApiResponse.ok(attachmentService.list(issueId, page, size));
  }

  @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Map<String, String>> upload(@RequestParam Long issueId, @RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) return ApiResponse.fail(400, "文件为空");
    String baseDir = java.nio.file.Paths.get(System.getProperty("user.dir"), "uploads", "issues", String.valueOf(issueId)).toString();
    File dir = new File(baseDir);
    if (!dir.exists()) dir.mkdirs();
    String original = org.springframework.util.StringUtils.cleanPath(file.getOriginalFilename());
    String filename = UUID.randomUUID().toString() + "_" + original;
    File dest = new File(dir, filename);
    file.transferTo(dest);
    String url = "/api/files/issues/" + issueId + "/" + filename;
    IssueAttachment a = new IssueAttachment();
    a.setIssueId(issueId);
    a.setFilename(original);
    a.setUrl(url);
    a.setCreatedAt(LocalDateTime.now());
    attachmentService.add(a);
    return ApiResponse.ok(Map.of("url", url));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    attachmentService.delete(id);
    return ApiResponse.ok(null);
  }
}
