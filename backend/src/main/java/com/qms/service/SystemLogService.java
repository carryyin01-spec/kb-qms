package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.SystemLog;
import com.qms.mapper.SystemLogMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SystemLogService {
  private final SystemLogMapper mapper;

  public SystemLogService(SystemLogMapper mapper) {
    this.mapper = mapper;
  }

  public void save(SystemLog log) {
    mapper.insert(log);
  }

  public Page<SystemLog> page(long current, long size, String username) {
    LambdaQueryWrapper<SystemLog> wrapper = new LambdaQueryWrapper<>();
    if (StringUtils.hasText(username)) {
      wrapper.like(SystemLog::getUsername, username);
    }
    wrapper.orderByDesc(SystemLog::getCreatedAt);
    return mapper.selectPage(new Page<>(current, size), wrapper);
  }
}

