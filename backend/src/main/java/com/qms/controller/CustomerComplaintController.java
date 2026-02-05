package com.qms.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.dto.ApiResponse;
import com.qms.dto.CustomerComplaintCreateRequest;
import com.qms.dto.CustomerComplaintUpdateRequest;
import com.qms.entity.CustomerComplaint;
import com.qms.service.CustomerComplaintService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/complaints")
public class CustomerComplaintController {
    private final CustomerComplaintService complaintService;

    public CustomerComplaintController(CustomerComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MENU_COMPLAINTS') or hasRole('ADMIN')")
    public ApiResponse<Page<CustomerComplaint>> list(@RequestParam(defaultValue = "1") long page,
                                                     @RequestParam(defaultValue = "10") long size,
                                                     @RequestParam(required = false) String customerCode,
                                                     @RequestParam(required = false) String productModel,
                                                     @RequestParam(required = false) String status) {
        return ApiResponse.ok(complaintService.page(page, size, customerCode, productModel, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MENU_COMPLAINTS') or hasRole('ADMIN')")
    public ApiResponse<CustomerComplaint> get(@PathVariable Long id) {
        return ApiResponse.ok(complaintService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('COMPLAINT_CREATE') or hasRole('ADMIN')")
    public ApiResponse<Void> create(@RequestBody CustomerComplaintCreateRequest req) {
        CustomerComplaint c = new CustomerComplaint();
        copyProperties(req, c);
        complaintService.create(c);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('COMPLAINT_UPDATE') or hasRole('ADMIN')")
    public ApiResponse<Void> update(@PathVariable Long id, @RequestBody CustomerComplaintUpdateRequest req) {
        CustomerComplaint c = new CustomerComplaint();
        c.setId(id);
        copyProperties(req, c);
        complaintService.update(c);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('COMPLAINT_DELETE') or hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        complaintService.delete(id);
        return ApiResponse.ok(null);
    }

    private void copyProperties(Object source, CustomerComplaint target) {
        if (source instanceof CustomerComplaintCreateRequest) {
            CustomerComplaintCreateRequest req = (CustomerComplaintCreateRequest) source;
            target.setMonth(req.getMonth());
            target.setCycle(req.getCycle());
            target.setCustomerGrade(req.getCustomerGrade());
            target.setComplaintTime(req.getComplaintTime());
            target.setCustomerCode(req.getCustomerCode());
            target.setProductModel(req.getProductModel());
            target.setProblemSource(req.getProblemSource());
            target.setProductionDept(req.getProductionDept());
            target.setOrderQty(req.getOrderQty());
            target.setComplaintQty(req.getComplaintQty());
            target.setProblemNature(req.getProblemNature());
            target.setInspector(req.getInspector());
            target.setDefectSn(req.getDefectSn());
            target.setComplaintDescription(req.getComplaintDescription());
            target.setDefectPictures(req.getDefectPictures());
            target.setIsIncludedInIndicators(req.getIsIncludedInIndicators());
            target.setSeverityLevel(req.getSeverityLevel());
            target.setProblemSubtype(req.getProblemSubtype());
            target.setRootCause(req.getRootCause());
            target.setImprovementMeasures(req.getImprovementMeasures());
            target.setOwner(req.getOwner());
            target.setLineLeader(req.getLineLeader());
            target.setSupervisor(req.getSupervisor());
            target.setResponsibleDept(req.getResponsibleDept());
            target.setRemark(req.getRemark());
            target.setStatus(req.getStatus());
        } else if (source instanceof CustomerComplaintUpdateRequest) {
            CustomerComplaintUpdateRequest req = (CustomerComplaintUpdateRequest) source;
            target.setMonth(req.getMonth());
            target.setCycle(req.getCycle());
            target.setCustomerGrade(req.getCustomerGrade());
            target.setComplaintTime(req.getComplaintTime());
            target.setCustomerCode(req.getCustomerCode());
            target.setProductModel(req.getProductModel());
            target.setProblemSource(req.getProblemSource());
            target.setProductionDept(req.getProductionDept());
            target.setOrderQty(req.getOrderQty());
            target.setComplaintQty(req.getComplaintQty());
            target.setProblemNature(req.getProblemNature());
            target.setInspector(req.getInspector());
            target.setDefectSn(req.getDefectSn());
            target.setComplaintDescription(req.getComplaintDescription());
            target.setDefectPictures(req.getDefectPictures());
            target.setIsIncludedInIndicators(req.getIsIncludedInIndicators());
            target.setSeverityLevel(req.getSeverityLevel());
            target.setProblemSubtype(req.getProblemSubtype());
            target.setRootCause(req.getRootCause());
            target.setImprovementMeasures(req.getImprovementMeasures());
            target.setOwner(req.getOwner());
            target.setLineLeader(req.getLineLeader());
            target.setSupervisor(req.getSupervisor());
            target.setResponsibleDept(req.getResponsibleDept());
            target.setRemark(req.getRemark());
            target.setStatus(req.getStatus());
        }
    }
}
