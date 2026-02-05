package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.ComplaintAttachment;
import com.qms.mapper.ComplaintAttachmentMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ComplaintAttachmentService {
    private final ComplaintAttachmentMapper attachmentMapper;

    public ComplaintAttachmentService(ComplaintAttachmentMapper attachmentMapper) {
        this.attachmentMapper = attachmentMapper;
    }

    public List<ComplaintAttachment> listByComplaintId(Long complaintId) {
        return attachmentMapper.selectList(new LambdaQueryWrapper<ComplaintAttachment>()
                .eq(ComplaintAttachment::getComplaintId, complaintId)
                .eq(ComplaintAttachment::getDeleted, 0));
    }

    public void create(ComplaintAttachment a) {
        a.setDeleted(0);
        attachmentMapper.insert(a);
    }

    public void delete(Long id) {
        ComplaintAttachment a = attachmentMapper.selectById(id);
        if (a != null) {
            a.setDeleted(1);
            attachmentMapper.updateById(a);
        }
    }
}
