package com.qms.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
@lombok.extern.slf4j.Slf4j
public class MyMetaObjectHandler implements MetaObjectHandler {
  @Override
  public void insertFill(MetaObject metaObject) {
    LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Bangkok"));
    log.info("MyMetaObjectHandler insertFill: setting createdAt/updatedAt to {}", now);
    strictInsertFill(metaObject, "createdAt", LocalDateTime.class, now);
    strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, now);
  }

  @Override
  public void updateFill(MetaObject metaObject) {
    LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Bangkok"));
    log.info("MyMetaObjectHandler updateFill: setting updatedAt to {}", now);
    strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, now);
  }
}

