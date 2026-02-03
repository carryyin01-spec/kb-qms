package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.Notification;
import com.qms.mapper.NotificationMapper;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@EnableScheduling
public class ScheduledTaskService {
  private final NotificationMapper notificationMapper;

  public ScheduledTaskService(NotificationMapper notificationMapper) {
    this.notificationMapper = notificationMapper;
  }

  @Scheduled(fixedRate = 3600000)
  public void autoCompletePending() {
    java.util.List<Notification> list = notificationMapper.selectList(
        new LambdaQueryWrapper<Notification>().eq(Notification::getStatus, "PENDING").eq(Notification::getDeleted, 0));
    for (Notification n : list) {
      n.setStatus("SENT");
      notificationMapper.updateById(n);
    }
  }
}

