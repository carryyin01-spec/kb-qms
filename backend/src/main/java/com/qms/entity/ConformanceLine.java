package com.qms.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("conformance_lines")
public class ConformanceLine {
  @TableId(type = IdType.AUTO)
  private Long id;
  private Long headerId;
  private Integer seqNo; // 序号
  private String productSn; // 产品SN
  private LocalDateTime inspectedAt; // 检验日期
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
  private String performanceTest; // 性能测试值
  private String attachInfo; // 有无附件
  private String attachmentCode; // 附件编码
  private String ecn; // ECN/子件ECN
  private String changeDesc; // 变更内容
  private String samplePlan; // 抽样计划
  private String specDesc; // 检验标准
  private String toolDesc; // 检验工具/仪器
  private String productSpecialReq; // 产品特殊要求
  private String defectDesc; // 检验不良描述
  private String issueType; // 问题类型
  private String issueSubtype; // 问题小类
  private String issueNature; // 问题性质
  private String owner; // 责任人
  private String ownerManager; // 责任人主管
  private String ownerDept; // 责任部门
  private String rootCause; // 原因分析
  private String action; // 改善对策
  private String remark; // 备注
  private String result; // 结果(OK/NG)
  private String secondCheckResult;
  private LocalDateTime secondScanTime;
  private String defectImages; // 初检不良图片
  private String secondCheckImages; // 二次扫描图片
  
  @TableField(exist = false)
  private String reportNo; // 报告编号 (从头表关联)

  // 补充头表字段用于展示
  @TableField(exist = false)
  private java.time.LocalDate headerInspectionDate; // 检验日期
  @TableField(exist = false)
  private String headerLineName; // 送检区域
  @TableField(exist = false)
  private String headerProductionLine; // 生产线体
  @TableField(exist = false)
  private String headerWorkShift; // 班次
  @TableField(exist = false)
  private String headerCustomerCode; // 客户编码
  @TableField(exist = false)
  private Integer headerSendQty; // 送检数量
  @TableField(exist = false)
  private Integer headerSampleQty; // 抽样数量
  @TableField(exist = false)
  private String headerChecker; // 生产总检
  @TableField(exist = false)
  private String headerFirmwareVersion; // 固件版本
  @TableField(exist = false)
  private String headerCoatingThickness; // 三防漆厚度
  @TableField(exist = false)
  private String headerAttachInfo; // 有无附件
  @TableField(exist = false)
  private String headerAttachmentCode; // 附件编码
  @TableField(exist = false)
  private String headerEcn; // ECN/子件ECN
  @TableField(exist = false)
  private String headerChangeDesc; // 变更内容
  @TableField(exist = false)
  private String headerSamplePlan; // 抽样计划
  @TableField(exist = false)
  private String headerSpecDesc; // 检验标准
  @TableField(exist = false)
  private String headerToolDesc; // 检验工具/仪器
  @TableField(exist = false)
  private String headerProductSpecialReq; // 产品特殊要求
  @TableField(exist = false)
  private String headerAqlStandard; // 允收水准/AQL
  
  @TableField(fill = FieldFill.INSERT)
  private LocalDateTime createdAt;
}
