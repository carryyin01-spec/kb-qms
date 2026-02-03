package com.qms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qms.entity.ConformanceHeader;
import org.apache.ibatis.annotations.Mapper;

import org.apache.ibatis.annotations.Select;

@Mapper
public interface ConformanceHeaderMapper extends BaseMapper<ConformanceHeader> {
  @Select("SELECT report_no FROM conformance_headers WHERE report_no LIKE #{prefix} ORDER BY report_no DESC LIMIT 1")
  String selectMaxReportNo(String prefix);
}

