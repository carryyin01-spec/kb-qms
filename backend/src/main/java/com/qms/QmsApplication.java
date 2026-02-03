package com.qms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class QmsApplication {
  @jakarta.annotation.PostConstruct
  public void init() {
    // 设置默认时区为泰国时区
    java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Bangkok"));
  }

  public static void main(String[] args) {
    SpringApplication.run(QmsApplication.class, args);
  }
}

