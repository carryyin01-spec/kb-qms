package com.qms.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtil {
  public static String format(LocalDateTime time) {
    return time == null ? null : time.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
  }
}

