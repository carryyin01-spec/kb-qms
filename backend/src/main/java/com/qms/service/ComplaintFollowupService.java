package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.ComplaintFollowup;
import com.qms.mapper.ComplaintFollowupMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ComplaintFollowupService {
    private final ComplaintFollowupMapper followupMapper;

    public ComplaintFollowupService(ComplaintFollowupMapper followupMapper) {
        this.followupMapper = followupMapper;
    }

    public List<ComplaintFollowup> listByComplaintId(Long complaintId) {
        return followupMapper.selectList(new LambdaQueryWrapper<ComplaintFollowup>()
                .eq(ComplaintFollowup::getComplaintId, complaintId)
                .eq(ComplaintFollowup::getDeleted, 0)
                .orderByDesc(ComplaintFollowup::getCreatedAt));
    }

    public void create(ComplaintFollowup f) {
        f.setDeleted(0);
        followupMapper.insert(f);
    }
}
