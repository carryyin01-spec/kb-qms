package com.qms.web;

import com.qms.entity.SystemLog;
import com.qms.security.LoginUser;
import com.qms.service.SystemLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

public class OperationLogInterceptor implements HandlerInterceptor {
  private final SystemLogService logService;

  public OperationLogInterceptor(SystemLogService logService) {
    this.logService = logService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    // 检查前端传递的日志开关请求头
    String enableLogHeader = request.getHeader("X-Enable-Log");
    if (!"true".equals(enableLogHeader)) {
      return true; // 不记录日志，直接放行
    }

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = "anonymous";
    if (auth != null && auth.isAuthenticated()) {
      username = auth.getName();
      if (auth.getPrincipal() instanceof LoginUser) {
        String name = ((LoginUser) auth.getPrincipal()).getName();
        if (name != null && !name.isEmpty()) {
          username = name;
        }
      }
    }
    
    SystemLog log = new SystemLog();
    log.setUsername(username);
    log.setPath(request.getRequestURI());
    log.setMethod(request.getMethod());
    log.setAction("request");
    log.setIp(request.getRemoteAddr());
    log.setCreatedAt(LocalDateTime.now());
    logService.save(log);
    return true;
  }
}

