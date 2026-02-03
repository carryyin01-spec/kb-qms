package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.ConformanceHeader;
import com.qms.entity.ConformanceLine;
import com.qms.entity.User;
import com.qms.mapper.ConformanceHeaderMapper;
import com.qms.mapper.ConformanceLineMapper;
import com.qms.mapper.UserMapper;
import org.springframework.stereotype.Service;

@Service
public class ConformanceService {
  private final ConformanceHeaderMapper headerMapper;
  private final ConformanceLineMapper lineMapper;
  private final UserMapper userMapper;

  public ConformanceService(ConformanceHeaderMapper headerMapper, ConformanceLineMapper lineMapper, UserMapper userMapper) {
    this.headerMapper = headerMapper;
    this.lineMapper = lineMapper;
    this.userMapper = userMapper;
  }

  public Page<ConformanceHeader> pageHeaders(long page, long size, String orderNo, String productNo, String startDate, String endDate) {
    LambdaQueryWrapper<ConformanceHeader> w = new LambdaQueryWrapper<>();
    if (orderNo != null && !orderNo.isEmpty()) w.like(ConformanceHeader::getOrderNo, orderNo);
    if (productNo != null && !productNo.isEmpty()) w.like(ConformanceHeader::getProductNo, productNo);
    if (startDate != null && !startDate.isEmpty()) w.ge(ConformanceHeader::getInspectionDate, startDate);
    if (endDate != null && !endDate.isEmpty()) w.le(ConformanceHeader::getInspectionDate, endDate);
    w.orderByDesc(ConformanceHeader::getId);
    return headerMapper.selectPage(Page.of(page, size), w);
  }

  public ConformanceHeader saveHeader(ConformanceHeader h) {
    if (h.getWorkShift() == null || h.getWorkShift().trim().isEmpty()) {
      throw new RuntimeException("班次不能为空");
    }
    if (h.getLineName() == null || h.getLineName().trim().isEmpty()) {
      throw new RuntimeException("送检区域不能为空");
    }
    if (h.getProductionLine() == null || h.getProductionLine().trim().isEmpty()) {
      throw new RuntimeException("生产线体不能为空");
    }
    if (h.getOrderNo() == null || h.getOrderNo().trim().isEmpty()) {
      throw new RuntimeException("订单编号不能为空");
    }
    if (h.getProductNo() == null || h.getProductNo().trim().isEmpty()) {
      throw new RuntimeException("产品编号不能为空");
    }
    if (h.getId() == null) {
      if (h.getInspectionDate() == null) {
        h.setInspectionDate(java.time.LocalDate.now());
      }
      headerMapper.insert(h);
      if (h.getReportNo() == null || h.getReportNo().isEmpty()) {
          // Fallback if not provided by frontend, though now frontend should provide it
          String datePart = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE);
          String suffix = String.format("%06d", (long) (Math.random() * 1000000));
          h.setReportNo("QM-" + datePart + "-" + suffix);
          headerMapper.updateById(h);
      }
    } else {
      headerMapper.updateById(h);
    }
    return headerMapper.selectById(h.getId());
  }

  public ConformanceHeader getHeader(Long id) {
    return headerMapper.selectById(id);
  }

  public Page<ConformanceLine> pageLines(long page, long size, Long headerId, String productSn, String qaInspector) {
    LambdaQueryWrapper<ConformanceLine> w = new LambdaQueryWrapper<>();
    w.eq(headerId != null, ConformanceLine::getHeaderId, headerId);
    if (productSn != null && !productSn.isEmpty()) {
      w.like(ConformanceLine::getProductSn, productSn);
    }
    if (qaInspector != null && !qaInspector.isEmpty()) {
      w.like(ConformanceLine::getQaInspector, qaInspector);
    }
    w.orderByAsc(ConformanceLine::getSeqNo);
    return lineMapper.selectPage(Page.of(page, size), w);
  }

  public Page<ConformanceLine> pageFullRecords(long page, long size, String startDate, String endDate, String qaInspector, String issueType, String issueSubtype, String issueNature, String ownerDept, String owner, String result, String productNo) {
    LambdaQueryWrapper<ConformanceLine> w = new LambdaQueryWrapper<>();
    if (startDate != null && !startDate.isEmpty()) w.ge(ConformanceLine::getInspectedAt, startDate + " 00:00:00");
    if (endDate != null && !endDate.isEmpty()) w.le(ConformanceLine::getInspectedAt, endDate + " 23:59:59");
    if (qaInspector != null && !qaInspector.trim().isEmpty()) {
      String val = qaInspector.trim();
      w.and(wrapper -> wrapper
          .apply("l.qa_inspector LIKE {0}", "%" + val + "%")
          .or()
          .apply("l.qa_inspector IN (SELECT username FROM users WHERE name LIKE {0})", "%" + val + "%")
          .or()
          .apply("l.qa_inspector IN (SELECT name FROM users WHERE username LIKE {0})", "%" + val + "%")
      );
    }
    if (issueType != null && !issueType.isEmpty()) w.eq(ConformanceLine::getIssueType, issueType);
    if (issueSubtype != null && !issueSubtype.isEmpty()) w.eq(ConformanceLine::getIssueSubtype, issueSubtype);
    if (issueNature != null && !issueNature.isEmpty()) w.eq(ConformanceLine::getIssueNature, issueNature);
    if (ownerDept != null && !ownerDept.isEmpty()) w.eq(ConformanceLine::getOwnerDept, ownerDept);
    if (owner != null && !owner.isEmpty()) w.like(ConformanceLine::getOwner, owner);
    if (result != null && !result.isEmpty()) w.eq(ConformanceLine::getResult, result);
    if (productNo != null && !productNo.isEmpty()) w.apply("l.product_no = {0}", productNo);
    w.orderByDesc(ConformanceLine::getInspectedAt);
    return lineMapper.selectFullPage(Page.of(page, size), w);
  }

  public void saveLine(ConformanceLine l) {
    if (l.getSecondCheckResult() != null && !l.getSecondCheckResult().isEmpty() && l.getSecondScanTime() == null) {
      l.setSecondScanTime(java.time.LocalDateTime.now());
    }
    if (l.getId() == null) {
      // 自动生成 seqNo
      if (l.getSeqNo() == null && l.getHeaderId() != null) {
        Integer maxSeq = lineMapper.selectCount(new LambdaQueryWrapper<ConformanceLine>()
            .eq(ConformanceLine::getHeaderId, l.getHeaderId())).intValue();
        l.setSeqNo(maxSeq + 1);
      }
      // 如果是新记录且没有设置检验时间，则使用当前时间
      if (l.getInspectedAt() == null) {
        l.setInspectedAt(java.time.LocalDateTime.now());
      }
      lineMapper.insert(l);
    } else {
      lineMapper.updateById(l);
    }
  }

  public void deleteLine(Long id) {
    lineMapper.deleteById(id);
  }

  public void deleteHeader(Long id) {
    // 删除关联的明细
    lineMapper.delete(new LambdaQueryWrapper<ConformanceLine>().eq(ConformanceLine::getHeaderId, id));
    // 删除主表
    headerMapper.deleteById(id);
  }

  public java.util.Map<String, Object> stats(Long headerId) {
    LambdaQueryWrapper<ConformanceLine> w = new LambdaQueryWrapper<>();
    w.eq(headerId != null, ConformanceLine::getHeaderId, headerId);
    java.util.List<ConformanceLine> list = lineMapper.selectList(w);
    java.time.LocalDate today = java.time.LocalDate.now();
    java.time.LocalDate weekStart = today.minusDays(6);
    long dayTotal = 0;
    long dayFail = 0;
    long weekTotal = 0;
    long weekFail = 0;
    for (ConformanceLine l : list) {
      java.time.LocalDate d = null;
      if (l.getInspectedAt() != null) d = l.getInspectedAt().toLocalDate();
      else if (l.getCreatedAt() != null) d = l.getCreatedAt().toLocalDate();
      if (d == null) continue;
      boolean isFail = "NG".equalsIgnoreCase(l.getResult());
      if (d.equals(today)) {
        dayTotal++;
        if (isFail) dayFail++;
      }
      if (!d.isBefore(weekStart) && !d.isAfter(today)) {
        weekTotal++;
        if (isFail) weekFail++;
      }
    }
    double dayPassRate = dayTotal == 0 ? 100.0 : (double) (dayTotal - dayFail) * 100.0 / dayTotal;
    double weekPassRate = weekTotal == 0 ? 100.0 : (double) (weekTotal - weekFail) * 100.0 / weekTotal;
    java.util.Map<String, Object> m = new java.util.HashMap<>();
    m.put("dayTotal", dayTotal);
    m.put("dayFail", dayFail);
    m.put("dayPassRate", dayPassRate);
    m.put("weekTotal", weekTotal);
    m.put("weekFail", weekFail);
    m.put("weekPassRate", weekPassRate);
    return m;
  }

  public java.util.Map<String, Object> statsGlobal(String qaInspector) {
    LambdaQueryWrapper<ConformanceLine> w = new LambdaQueryWrapper<>();
    if (qaInspector != null && !qaInspector.isEmpty()) {
      w.and(wrapper -> wrapper
          .eq(ConformanceLine::getQaInspector, qaInspector)
          .or()
          .inSql(ConformanceLine::getQaInspector, "SELECT username FROM users WHERE name = '" + qaInspector.replace("'", "''") + "'")
          .or()
          .inSql(ConformanceLine::getQaInspector, "SELECT name FROM users WHERE username = '" + qaInspector.replace("'", "''") + "'")
      );
    }
    java.util.List<ConformanceLine> list = lineMapper.selectList(w);
    java.time.LocalDate today = java.time.LocalDate.now();
    java.time.LocalDate weekStart = today.minusDays(6);
    java.time.YearMonth ym = java.time.YearMonth.from(today);
    java.time.LocalDate monthStart = ym.atDay(1);
    java.time.LocalDate monthEnd = ym.atEndOfMonth();
    long dayTotal = 0, dayFail = 0, weekTotal = 0, weekFail = 0, monthTotal = 0, monthFail = 0, allTotal = 0, allFail = 0;
    for (ConformanceLine l : list) {
      java.time.LocalDate d = null;
      if (l.getInspectedAt() != null) d = l.getInspectedAt().toLocalDate();
      else if (l.getCreatedAt() != null) d = l.getCreatedAt().toLocalDate();
      if (d == null) continue;
      boolean isFail = "NG".equalsIgnoreCase(l.getResult());
      allTotal++;
      if (isFail) allFail++;
      if (d.equals(today)) {
        dayTotal++;
        if (isFail) dayFail++;
      }
      if (!d.isBefore(weekStart) && !d.isAfter(today)) {
        weekTotal++;
        if (isFail) weekFail++;
      }
      if (!d.isBefore(monthStart) && !d.isAfter(monthEnd)) {
        monthTotal++;
        if (isFail) monthFail++;
      }
    }
    double dayPassRate = dayTotal == 0 ? 100.0 : (double) (dayTotal - dayFail) * 100.0 / dayTotal;
    double weekPassRate = weekTotal == 0 ? 100.0 : (double) (weekTotal - weekFail) * 100.0 / weekTotal;
    double monthPassRate = monthTotal == 0 ? 100.0 : (double) (monthTotal - monthFail) * 100.0 / monthTotal;
    double allPassRate = allTotal == 0 ? 100.0 : (double) (allTotal - allFail) * 100.0 / allTotal;
    java.util.Map<String, Object> m = new java.util.HashMap<>();
    m.put("dayTotal", dayTotal);
    m.put("dayFail", dayFail);
    m.put("dayPassRate", dayPassRate);
    m.put("weekTotal", weekTotal);
    m.put("weekFail", weekFail);
    m.put("weekPassRate", weekPassRate);
    m.put("monthTotal", monthTotal);
    m.put("monthFail", monthFail);
    m.put("monthPassRate", monthPassRate);
    m.put("allTotal", allTotal);
    m.put("allFail", allFail);
    m.put("allPassRate", allPassRate);
    return m;
  }

  public ConformanceHeader findHeaderBySn(String sn) {
    if (sn == null || sn.isEmpty()) return null;
    ConformanceLine line = lineMapper.selectOne(new LambdaQueryWrapper<ConformanceLine>()
        .eq(ConformanceLine::getProductSn, sn)
        .last("LIMIT 1"));
    if (line == null || line.getHeaderId() == null) return null;
    return headerMapper.selectById(line.getHeaderId());
  }

  public boolean lineExists(Long headerId, String sn) {
    if (sn == null || sn.isEmpty()) return false;
    Long count = lineMapper.selectCount(new LambdaQueryWrapper<ConformanceLine>()
        .eq(headerId != null, ConformanceLine::getHeaderId, headerId)
        .eq(ConformanceLine::getProductSn, sn));
    return count != null && count > 0;
  }
}
