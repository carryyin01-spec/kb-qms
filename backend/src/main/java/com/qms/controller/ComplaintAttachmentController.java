package com.qms.controller;

import com.qms.dto.ApiResponse;
import com.qms.entity.ComplaintAttachment;
import com.qms.service.ComplaintAttachmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaint-attachments")
public class ComplaintAttachmentController {
    private final ComplaintAttachmentService attachmentService;

    public ComplaintAttachmentController(ComplaintAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/{complaintId}")
    public ApiResponse<List<ComplaintAttachment>> list(@PathVariable Long complaintId) {
        return ApiResponse.ok(attachmentService.listByComplaintId(complaintId));
    }

    @PostMapping
    public ApiResponse<Void> create(@RequestBody ComplaintAttachment a) {
        attachmentService.create(a);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return ApiResponse.ok(null);
    }
}
