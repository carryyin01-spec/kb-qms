package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("complaint_followups")
public class ComplaintFollowup {
    @TableId
    private Long id;
    private Long complaintId;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
    private Integer deleted;
}
