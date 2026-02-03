package com.qms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DocumentCreateRequest {
  @NotBlank
  @Size(max = 256)
  private String title;
  @NotBlank
  private String content;
  @NotBlank
  @Size(max = 32)
  private String status;
  private Long ownerId;
}

