package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.CustomerComplaint;
import com.qms.mapper.CustomerComplaintMapper;
import org.springframework.stereotype.Service;

@Service
public class CustomerComplaintService {
    private final CustomerComplaintMapper complaintMapper;

    public CustomerComplaintService(CustomerComplaintMapper complaintMapper) {
        this.complaintMapper = complaintMapper;
    }

    public Page<CustomerComplaint> page(long page, long size, String customerCode, String productModel, String status,
                                        String inspector, String productionDept, String owner, String responsibleDept) {
        LambdaQueryWrapper<CustomerComplaint> w = new LambdaQueryWrapper<>();
        w.like(customerCode != null && !customerCode.isEmpty(), CustomerComplaint::getCustomerCode, customerCode);
        w.like(productModel != null && !productModel.isEmpty(), CustomerComplaint::getProductModel, productModel);
        w.eq(status != null && !status.isEmpty(), CustomerComplaint::getStatus, status);
        w.eq(inspector != null && !inspector.isEmpty(), CustomerComplaint::getInspector, inspector);
        w.eq(productionDept != null && !productionDept.isEmpty(), CustomerComplaint::getProductionDept, productionDept);
        w.like(owner != null && !owner.isEmpty(), CustomerComplaint::getOwner, owner);
        w.like(responsibleDept != null && !responsibleDept.isEmpty(), CustomerComplaint::getResponsibleDept, responsibleDept);
        w.orderByDesc(CustomerComplaint::getCreatedAt);
        return complaintMapper.selectPage(Page.of(page, size), w);
    }

    public CustomerComplaint get(Long id) {
        return complaintMapper.selectById(id);
    }

    public void create(CustomerComplaint c) {
        c.setDeleted(0);
        complaintMapper.insert(c);
    }

    public void update(CustomerComplaint c) {
        complaintMapper.updateById(c);
    }

    public void delete(Long id) {
        complaintMapper.deleteById(id);
    }
}
