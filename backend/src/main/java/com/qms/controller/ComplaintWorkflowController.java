package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.CustomerComplaint;
import com.qms.mapper.CustomerComplaintMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/complaint-workflow")
public class ComplaintWorkflowController {
    private final CustomerComplaintMapper complaintMapper;

    public ComplaintWorkflowController(CustomerComplaintMapper complaintMapper) {
        this.complaintMapper = complaintMapper;
    }

    private static final Map<String, Set<String>> ALLOWED = Map.of(
            "open", Set.of("on-going"),
            "on-going", Set.of("closed"),
            "closed", Set.of()
    );

    @PostMapping("/transition")
    @PreAuthorize("hasAuthority('COMPLAINT_WORKFLOW') or hasAnyRole('ADMIN','USER')")
    public ApiResponse<Void> transition(@RequestParam Long id, @RequestParam String targetStatus) {
        CustomerComplaint c = complaintMapper.selectById(id);
        if (c == null) return ApiResponse.fail(404, "not found");
        String cur = c.getStatus();
        Set<String> nexts = ALLOWED.getOrDefault(cur == null ? "open" : cur.toLowerCase(), Set.of());
        if (!nexts.contains(targetStatus.toLowerCase())) return ApiResponse.fail(400, "invalid transition");
        c.setStatus(targetStatus.toLowerCase());
        complaintMapper.updateById(c);
        return ApiResponse.ok(null);
    }
}
