package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.Document;
import com.qms.mapper.DocumentMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/document-workflow")
public class DocumentWorkflowController {
  private final DocumentMapper documentMapper;

  public DocumentWorkflowController(DocumentMapper documentMapper) {
    this.documentMapper = documentMapper;
  }

  private static final Map<String, Set<String>> ALLOWED = Map.of(
      "DRAFT", Set.of("REVIEW"),
      "REVIEW", Set.of("APPROVED", "DRAFT"),
      "APPROVED", Set.of("ACTIVE"),
      "ACTIVE", Set.of("ARCHIVED"),
      "ARCHIVED", Set.of()
  );

  @PostMapping("/transition")
  @PreAuthorize("hasAuthority('DOC_WORKFLOW') or hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> transition(@RequestParam Long id, @RequestParam String targetStatus) {
    Document d = documentMapper.selectById(id);
    if (d == null) return ApiResponse.fail(404, "not found");
    String cur = d.getStatus();
    Set<String> nexts = ALLOWED.getOrDefault(cur == null ? "DRAFT" : cur, Set.of());
    if (!nexts.contains(targetStatus)) return ApiResponse.fail(400, "invalid transition");
    d.setStatus(targetStatus);
    documentMapper.updateById(d);
    return ApiResponse.ok(null);
  }
}

