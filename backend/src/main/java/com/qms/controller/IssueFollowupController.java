package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.IssueFollowup;
import com.qms.service.IssueFollowupService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/issue-followups")
public class IssueFollowupController {
  private final IssueFollowupService service;

  public IssueFollowupController(IssueFollowupService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<IssueFollowup>> list(@RequestParam Long issueId,
                                               @RequestParam(defaultValue = "1") long page,
                                               @RequestParam(defaultValue = "10") long size) {
    return ApiResponse.ok(service.list(issueId, page, size));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Void> create(@RequestBody IssueFollowup f) {
    f.setCreatedAt(LocalDateTime.now());
    service.add(f);
    return ApiResponse.ok(null);
  }
}

