package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.Notification;
import com.qms.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
  private final NotificationService service;

  public NotificationController(NotificationService service) {
    this.service = service;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Page<Notification>> list(@RequestParam(defaultValue = "1") long page,
                                              @RequestParam(defaultValue = "10") long size,
                                              @RequestParam(required = false) String title,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String recipient) {
    return ApiResponse.ok(service.page(page, size, title, status, recipient));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','USER')")
  public ApiResponse<Notification> get(@PathVariable Long id) {
    return ApiResponse.ok(service.get(id));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> create(@RequestBody Notification n) {
    service.create(n);
    return ApiResponse.ok(null);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody Notification n) {
    n.setId(id);
    service.update(n);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok(null);
  }
}

