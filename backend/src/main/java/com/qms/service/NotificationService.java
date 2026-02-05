package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qms.entity.Notification;
import com.qms.mapper.NotificationMapper;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
  private final NotificationMapper mapper;

  public NotificationService(NotificationMapper mapper) {
    this.mapper = mapper;
  }

  public Page<Notification> page(long page, long size, String title, String status, String recipient) {
    LambdaQueryWrapper<Notification> w = new LambdaQueryWrapper<>();
    w.like(title != null && !title.isEmpty(), Notification::getTitle, title);
    w.eq(status != null && !status.isEmpty(), Notification::getStatus, status);
    w.like(recipient != null && !recipient.isEmpty(), Notification::getRecipient, recipient);
    return mapper.selectPage(Page.of(page, size), w);
  }

  public Notification get(Long id) {
    return mapper.selectById(id);
  }

  public void create(Notification n) {
    n.setDeleted(0);
    mapper.insert(n);
  }

  public void update(Notification n) {
    mapper.updateById(n);
  }

  public void delete(Long id) {
    mapper.deleteById(id);
  }
}
