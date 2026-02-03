package com.qms.mapper;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.ConformanceLine;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ConformanceLineMapper extends BaseMapper<ConformanceLine> {

    @Select("SELECT l.*, h.report_no, " +
            "h.inspection_date as header_inspection_date, " +
            "h.line_name as header_line_name, " +
            "h.production_line as header_production_line, " +
            "h.work_shift as header_work_shift, " +
            "h.customer_code as header_customer_code, " +
            "h.send_qty as header_send_qty, " +
            "h.sample_qty as header_sample_qty, " +
            "h.checker as header_checker, " +
            "h.firmware_version as header_firmware_version, " +
            "h.coating_thickness as header_coating_thickness, " +
            "h.attach_info as header_attach_info, " +
            "h.attachment_code as header_attachment_code, " +
            "h.ecn as header_ecn, " +
            "h.change_desc as header_change_desc, " +
            "h.sample_plan as header_sample_plan, " +
            "h.spec_desc as header_spec_desc, " +
            "h.tool_desc as header_tool_desc, " +
            "h.product_special_req as header_product_special_req, " +
            "h.aql_standard as header_aql_standard " +
            "FROM conformance_lines l " +
            "LEFT JOIN conformance_headers h ON l.header_id = h.id " +
            "${ew.customSqlSegment}")
    Page<ConformanceLine> selectFullPage(Page<ConformanceLine> page, @Param(Constants.WRAPPER) Wrapper<ConformanceLine> queryWrapper);
}

