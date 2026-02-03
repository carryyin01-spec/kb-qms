package com.qms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QualityIssueCreateRequest {
  @NotBlank
  @Size(max = 256)
  private String title;
  @NotBlank
  private String description;
  @NotBlank
  @Size(max = 16)
  private String severity;
  private String category;
  private String module;
  private String department;
  @NotBlank
  @Size(max = 32)
  private String status;
  private Long reporterId;
}
