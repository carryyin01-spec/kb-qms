package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.entity.ConformanceHeader;
import com.qms.entity.ConformanceLine;
import com.qms.service.ConformanceService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/conformance")
public class ConformanceController {
  private final ConformanceService service;

  public ConformanceController(ConformanceService service) {
    this.service = service;
  }

  @GetMapping("/headers")
  public ApiResponse<Page<ConformanceHeader>> headers(@RequestParam(defaultValue = "1") long page,
                                                      @RequestParam(defaultValue = "10") long size,
                                                      @RequestParam(required = false) String orderNo,
                                                      @RequestParam(required = false) String productNo,
                                                      @RequestParam(required = false) String startDate,
                                                      @RequestParam(required = false) String endDate) {
    return ApiResponse.ok(service.pageHeaders(page, size, orderNo, productNo, startDate, endDate));
  }

  @PostMapping("/headers")
  public ApiResponse<ConformanceHeader> saveHeader(@RequestBody ConformanceHeader h) {
    return ApiResponse.ok(service.saveHeader(h));
  }

  @GetMapping("/lines")
  public ApiResponse<Page<ConformanceLine>> lines(@RequestParam(defaultValue = "1") long page,
                                                  @RequestParam(defaultValue = "10") long size,
                                                  @RequestParam Long headerId,
                                                  @RequestParam(required = false) String productSn,
                                                  @RequestParam(required = false) String qaInspector) {
    return ApiResponse.ok(service.pageLines(page, size, headerId, productSn, qaInspector));
  }

  @GetMapping("/full-records")
  public ApiResponse<Page<ConformanceLine>> fullRecords(@RequestParam(defaultValue = "1") long page,
                                                        @RequestParam(defaultValue = "10") long size,
                                                        @RequestParam(required = false) String startDate,
                                                        @RequestParam(required = false) String endDate,
                                                        @RequestParam(required = false) String qaInspector,
                                                        @RequestParam(required = false) String issueType,
                                                        @RequestParam(required = false) String issueSubtype,
                                                        @RequestParam(required = false) String issueNature,
                                                        @RequestParam(required = false) String ownerDept,
                                                        @RequestParam(required = false) String owner,
                                                        @RequestParam(required = false) String result,
                                                        @RequestParam(required = false) String productNo) {
    return ApiResponse.ok(service.pageFullRecords(page, size, startDate, endDate, qaInspector, issueType, issueSubtype, issueNature, ownerDept, owner, result, productNo));
  }

  @PostMapping("/lines")
  public ApiResponse<Void> saveLine(@RequestBody ConformanceLine l) {
    service.saveLine(l);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/lines/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> deleteLine(@PathVariable Long id) {
    service.deleteLine(id);
    return ApiResponse.ok(null);
  }

  @DeleteMapping("/headers/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> deleteHeader(@PathVariable Long id) {
    service.deleteHeader(id);
    return ApiResponse.ok(null);
  }

  @GetMapping("/stats")
  public ApiResponse<java.util.Map<String, Object>> stats(@RequestParam Long headerId) {
    return ApiResponse.ok(service.stats(headerId));
  }

  @GetMapping("/headers/{id}")
  public ApiResponse<ConformanceHeader> header(@PathVariable Long id) {
    return ApiResponse.ok(service.getHeader(id));
  }

  @GetMapping("/stats-global")
  public ApiResponse<java.util.Map<String, Object>> statsGlobal(@RequestParam(required = false) String qaInspector) {
    return ApiResponse.ok(service.statsGlobal(qaInspector));
  }

  @GetMapping("/find-by-sn")
  public ApiResponse<ConformanceHeader> findBySn(@RequestParam String sn) {
    return ApiResponse.ok(service.findHeaderBySn(sn));
  }

  @GetMapping("/line-exists")
  public ApiResponse<Boolean> lineExists(@RequestParam Long headerId, @RequestParam String sn) {
    return ApiResponse.ok(service.lineExists(headerId, sn));
  }
}
