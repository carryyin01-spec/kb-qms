package com.qms.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qms.entity.WorkflowHistory;
import com.qms.entity.WorkflowInstance;
import com.qms.entity.WorkflowTemplate;
import com.qms.mapper.WorkflowHistoryMapper;
import com.qms.mapper.RoleMapper;
import com.qms.mapper.WorkflowInstanceMapper;
import com.qms.mapper.WorkflowTemplateMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class WorkflowService {
  private final WorkflowTemplateMapper templateMapper;
  private final WorkflowInstanceMapper instanceMapper;
  private final WorkflowHistoryMapper historyMapper;
  private final RoleMapper roleMapper;

  public WorkflowService(WorkflowTemplateMapper templateMapper, WorkflowInstanceMapper instanceMapper, WorkflowHistoryMapper historyMapper, RoleMapper roleMapper) {
    this.templateMapper = templateMapper;
    this.instanceMapper = instanceMapper;
    this.historyMapper = historyMapper;
    this.roleMapper = roleMapper;
  }

  public void createTemplate(WorkflowTemplate t) {
    templateMapper.insert(t);
  }

  public WorkflowTemplate getTemplateByCode(String code) {
    return templateMapper.selectOne(new LambdaQueryWrapper<WorkflowTemplate>().eq(WorkflowTemplate::getTemplateCode, code));
  }

  public WorkflowInstance start(String templateCode, Long entityId, String entityType, Long starterId, String variablesJson) {
    WorkflowTemplate t = getTemplateByCode(templateCode);
    if (t == null || t.getIsActive() != null && t.getIsActive() == 0) return null;
    String startNode = "start";
    try {
      Map<?,?> cfg = new com.fasterxml.jackson.databind.ObjectMapper().readValue(t.getConfig(), Map.class);
      List<Map<String,Object>> nodes = (List<Map<String,Object>>) cfg.get("nodes");
      for (Map<String,Object> n : nodes) {
        if ("start".equals(n.get("nodeType"))) { startNode = (String) n.get("nodeId"); break; }
      }
    } catch (Exception ignored) {}
    WorkflowInstance ins = new WorkflowInstance();
    ins.setTemplateId(t.getId());
    ins.setEntityId(entityId);
    ins.setEntityType(entityType);
    ins.setCurrentNode(startNode);
    ins.setStatus("running");
    ins.setVariables(variablesJson);
    ins.setStarterId(starterId);
    ins.setStartedAt(LocalDateTime.now());
    instanceMapper.insert(ins);
    WorkflowHistory h = new WorkflowHistory();
    h.setInstanceId(ins.getId());
    h.setFromNode(null);
    h.setToNode(startNode);
    h.setAction("start");
    h.setComment("");
    h.setOperatorId(starterId);
    h.setCreatedAt(LocalDateTime.now());
    historyMapper.insert(h);
    return ins;
  }

  public boolean execute(Long instanceId, String action, Long operatorId, String comment, String variablesJson) {
    WorkflowInstance ins = instanceMapper.selectById(instanceId);
    if (ins == null || !"running".equals(ins.getStatus())) return false;
    WorkflowTemplate t = templateMapper.selectById(ins.getTemplateId());
    if (t == null) return false;
    String cur = ins.getCurrentNode();
    String next = null;
    boolean toEnd = false;
    boolean roleAllowed = true;
    try {
      Map<?,?> cfg = new com.fasterxml.jackson.databind.ObjectMapper().readValue(t.getConfig(), Map.class);
      List<Map<String,Object>> transitions = (List<Map<String,Object>>) cfg.get("transitions");
      for (Map<String,Object> tr : transitions) {
        if (cur.equals(tr.get("fromNode")) && action.equals(tr.get("actionName"))) {
          next = (String) tr.get("toNode");
          break;
        }
      }
      // role check on current node if it is approval node
      List<Map<String,Object>> nodes = (List<Map<String,Object>>) cfg.get("nodes");
      Map<String,Object> currentNode = null;
      for (Map<String,Object> n : nodes) {
        if (cur.equals(n.get("nodeId"))) { currentNode = n; break; }
      }
      if (currentNode != null && "approval".equals(currentNode.get("nodeType"))) {
        List<String> roles = roleMapper.listRoleCodesByUserId(operatorId);
        List<String> required = new java.util.ArrayList<>();
        Object assignees = currentNode.get("assignees");
        if (assignees instanceof List<?>) {
          for (Object a : (List<?>) assignees) {
            String s = String.valueOf(a);
            if (s.startsWith("role:")) {
              String r = s.substring(5).toUpperCase();
              if ("REVIEWER".equals(r)) required.add("ROLE_REVIEWER");
              else if ("APPROVER".equals(r)) required.add("ROLE_APPROVER");
              else required.add("ROLE_" + r);
            }
          }
        }
        roleAllowed = roles.contains("ROLE_ADMIN") || required.isEmpty() || roles.stream().anyMatch(required::contains);
      }
      if (next != null) {
        List<Map<String,Object>> nodes2 = (List<Map<String,Object>>) cfg.get("nodes");
        for (Map<String,Object> n : nodes2) {
          if (next.equals(n.get("nodeId")) && "end".equals(n.get("nodeType"))) { toEnd = true; break; }
        }
      }
    } catch (Exception ignored) {}
    if (next == null || !roleAllowed) return false;
    WorkflowHistory h = new WorkflowHistory();
    h.setInstanceId(ins.getId());
    h.setFromNode(cur);
    h.setToNode(next);
    h.setAction(action);
    h.setComment(comment);
    h.setOperatorId(operatorId);
    h.setCreatedAt(LocalDateTime.now());
    historyMapper.insert(h);
    ins.setCurrentNode(next);
    if (variablesJson != null && !variablesJson.isEmpty()) ins.setVariables(variablesJson);
    if (toEnd) {
      ins.setStatus("completed");
      ins.setCompletedAt(LocalDateTime.now());
    }
    instanceMapper.updateById(ins);
    return true;
  }
}
