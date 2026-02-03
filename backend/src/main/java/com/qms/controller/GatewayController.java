package com.qms.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/gateway")
public class GatewayController {
  @PostMapping("/erp/{entity}")
  public Map<String, Object> erp(@PathVariable String entity, @RequestBody Map<String, Object> payload) {
    return Map.of("code", 200, "message", "ok", "entity", entity, "echo", payload);
  }
  @PostMapping("/mes/{entity}")
  public Map<String, Object> mes(@PathVariable String entity, @RequestBody Map<String, Object> payload) {
    return Map.of("code", 200, "message", "ok", "entity", entity, "echo", payload);
  }
  @PostMapping("/sap/rfc/{func}")
  public Map<String, Object> sap(@PathVariable String func, @RequestBody Map<String, Object> payload) {
    return Map.of("code", 200, "message", "ok", "func", func, "echo", payload);
  }
}

