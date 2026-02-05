package com.qms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CustomerComplaintCreateRequest {
    private String month;
    private String cycle;
    private String customerGrade;
    private LocalDateTime complaintTime;
    private String customerCode;
    private String productModel;
    private String problemSource;
    private String productionDept;
    private Integer orderQty;
    private Integer complaintQty;
    private String problemNature;
    private String inspector;
    private String defectSn;
    private String complaintDescription;
    private String defectPictures;
    private String isIncludedInIndicators;
    private String severityLevel;
    private String problemSubtype;
    private String rootCause;
    private String improvementMeasures;
    private String owner;
    private String lineLeader;
    private String supervisor;
    private String responsibleDept;
    private String remark;
    private String status;
}
