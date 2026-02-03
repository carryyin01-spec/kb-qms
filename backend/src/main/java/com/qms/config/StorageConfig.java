package com.qms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StorageConfig implements WebMvcConfigurer {
    // 暂时移除 ResourceHandler 映射，改由 FileController 统一处理
    // 这样可以彻底解决 Windows 路径映射在 Spring Boot 中的兼容性问题
}
