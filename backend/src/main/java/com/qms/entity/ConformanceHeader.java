package com.qms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("conformance_headers")
public class ConformanceHeader {
  @TableId(type = IdType.AUTO)
  private Long id;
  private LocalDate inspectionDate; // 检验日期
  private String lineName; // 送检区域
  private String productionLine; // 生产线体
  private String workShift; // 班次
  private String productNo; // 产品编码
  private String customerCode; // 客户编码
  private Integer sendQty; // 送检数量
  private Integer sampleQty; // 抽样数量
  private String qaInspector; // QA检验员
  private String checker; // 生产总检
  private String orderNo; // 订单编号
  private String firmwareVersion; // 固件版本
  private String coatingThickness; // 三防漆厚度
  private String attachInfo; // 有无附件
  private String attachmentCode; // 附件编码
  private String ecn; // ECN/子件ECN
  private String changeDesc; // 变更内容
  private String samplePlan; // 抽样计划
  private String specDesc; // 检验标准
  private String toolDesc; // 检验工具/仪器
  private String productSpecialReq; // 产品特殊要求
  private String aqlStandard; // 允收水准/AQL
  
  private String reportNo; // 报告编号
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
