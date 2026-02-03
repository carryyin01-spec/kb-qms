package com.qms.config;

import com.qms.service.SystemLogService;
import com.qms.web.OperationLogInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AuditWebConfig implements WebMvcConfigurer {
  private final SystemLogService logService;

  public AuditWebConfig(SystemLogService logService) {
    this.logService = logService;
  }

  @Bean
  public OperationLogInterceptor operationLogInterceptor() {
    return new OperationLogInterceptor(logService);
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(operationLogInterceptor())
        .addPathPatterns("/**")
        .excludePathPatterns("/files/**");
  }
}

