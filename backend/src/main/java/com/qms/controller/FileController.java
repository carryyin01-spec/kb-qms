package com.qms.controller;

import com.qms.dto.ApiResponse;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletRequest;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FileController {

  @Value("${file.upload-dir}")
  private String uploadDir;

  @jakarta.annotation.PostConstruct
  public void init() {
    System.out.println("FileController initialized. uploadDir: " + uploadDir);
    System.out.println("Upload absolute path: " + new java.io.File(uploadDir).getAbsolutePath());
  }

  @PostMapping("/upload")
  public ApiResponse<Map<String, String>> upload(HttpServletRequest request, @RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) {
      return ApiResponse.fail(400, "文件为空");
    }
    // Use configured upload directory
    String baseDir = uploadDir;
    String dateDir = LocalDate.now().toString();
    File dir = new File(baseDir, dateDir);
    if (!dir.exists()) {
      boolean created = dir.mkdirs();
      if (!created) {
          System.err.println("CRITICAL: Could not create directory: " + dir.getAbsolutePath());
          return ApiResponse.fail(500, "无法创建上传目录: " + dir.getAbsolutePath());
      }
    }
    String original = StringUtils.cleanPath(file.getOriginalFilename());
    String filename = UUID.randomUUID().toString() + "_" + original;
    File dest = new File(dir, filename);

    System.out.println("Attempting to save file to: " + dest.getAbsolutePath());
    // Use InputStream copy instead of transferTo to avoid temporary file path issues across partitions
    try (java.io.InputStream in = file.getInputStream();
         java.io.FileOutputStream out = new java.io.FileOutputStream(dest)) {
        byte[] buffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = in.read(buffer)) != -1) {
            out.write(buffer, 0, bytesRead);
        }
    }
    String url = request.getContextPath() + "/files/" + dateDir + "/" + filename;
    System.out.println("File saved to: " + dest.getAbsolutePath());
    System.out.println("URL returned: " + url);
    return ApiResponse.ok(Map.of("url", url));
  }

  @org.springframework.web.bind.annotation.GetMapping("/{dateDir}/{filename:.+}")
  public void getFile(@org.springframework.web.bind.annotation.PathVariable("dateDir") String dateDir,
                      @org.springframework.web.bind.annotation.PathVariable("filename") String filename,
                      jakarta.servlet.http.HttpServletResponse response) throws IOException {
    // 规范化路径处理
    File dir = new File(uploadDir);
    File dateFolder = new File(dir, dateDir);
    File file = new File(dateFolder, filename);
    
    if (!file.exists()) {
      System.err.println("File not found at: " + file.getAbsolutePath());
      response.sendError(404, "File not found");
      return;
    }

    // 根据后缀设置 Content-Type
    String name = filename.toLowerCase();
    if (name.endsWith(".png")) response.setContentType("image/png");
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) response.setContentType("image/jpeg");
    else if (name.endsWith(".gif")) response.setContentType("image/gif");
    else response.setContentType("application/octet-stream");

    // 读取文件流
    try (java.io.FileInputStream in = new java.io.FileInputStream(file);
         java.io.OutputStream out = response.getOutputStream()) {
      byte[] buffer = new byte[4096];
      int bytesRead;
      while ((bytesRead = in.read(buffer)) != -1) {
        out.write(buffer, 0, bytesRead);
      }
      out.flush();
    }
  }

  @org.springframework.web.bind.annotation.GetMapping("/debug/**")
  public void debug(HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) throws IOException {
    String path = request.getRequestURI().split("/debug/")[1];
    File file = new File(uploadDir, path);
    response.getWriter().write("Looking for file: " + file.getAbsolutePath() + "\nExists: " + file.exists());
  }
}

