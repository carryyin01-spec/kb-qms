package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.ComplaintFollowup;
import com.qms.service.ComplaintFollowupService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaint-followups")
@PreAuthorize("hasAuthority('MENU_COMPLAINTS') or hasRole('ADMIN')")
public class ComplaintFollowupController {
    private final ComplaintFollowupService followupService;

    public ComplaintFollowupController(ComplaintFollowupService followupService) {
        this.followupService = followupService;
    }

    @GetMapping("/{complaintId}")
    public ApiResponse<List<ComplaintFollowup>> list(@PathVariable Long complaintId) {
        return ApiResponse.ok(followupService.listByComplaintId(complaintId));
    }

    @PostMapping
    public ApiResponse<Void> create(@RequestBody ComplaintFollowup f) {
        followupService.create(f);
        return ApiResponse.ok(null);
    }
}
