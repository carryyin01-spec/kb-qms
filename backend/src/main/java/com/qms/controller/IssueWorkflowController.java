package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.QualityIssue;
import com.qms.mapper.QualityIssueMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/issue-workflow")
public class IssueWorkflowController {
  private final QualityIssueMapper issueMapper;

  public IssueWorkflowController(QualityIssueMapper issueMapper) {
    this.issueMapper = issueMapper;
  }

  private static final Map<String, Set<String>> ALLOWED = Map.of(
      "OPEN", Set.of("INVESTIGATING"),
      "INVESTIGATING", Set.of("RESOLVED"),
      "RESOLVED", Set.of("CLOSED"),
      "CLOSED", Set.of()
  );

  @PostMapping("/transition")
  @PreAuthorize("hasAuthority('ISSUE_WORKFLOW') or hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> transition(@RequestParam Long id, @RequestParam String targetStatus) {
    QualityIssue i = issueMapper.selectById(id);
    if (i == null) return ApiResponse.fail(404, "not found");
    String cur = i.getStatus();
    Set<String> nexts = ALLOWED.getOrDefault(cur == null ? "OPEN" : cur, Set.of());
    if (!nexts.contains(targetStatus)) return ApiResponse.fail(400, "invalid transition");
    i.setStatus(targetStatus);
    issueMapper.updateById(i);
    return ApiResponse.ok(null);
  }
}

