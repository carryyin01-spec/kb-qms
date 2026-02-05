package com.qms.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("complaint_attachments")
public class ComplaintAttachment {
    @TableId
    private Long id;
    private Long complaintId;
    private String filename;
    private String url;
    private LocalDateTime createdAt;
    private Integer deleted;
}
