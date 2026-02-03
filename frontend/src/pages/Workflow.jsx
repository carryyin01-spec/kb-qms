import { useEffect, useState } from "react";
import { listWorkflowTemplates, createWorkflowTemplate, listWorkflowInstances, startWorkflowInstance, executeWorkflowInstance, getWorkflowHistory, listUsersByRole } from "../services/api";
import request from "../utils/request";
import { getUser } from "../utils/storage";

export default function Workflow() {
  const [templates, setTemplates] = useState([]);
  const [tmpl, setTmpl] = useState({ templateCode: "", templateName: "", entityType: "document", config: defaultConfig() });
  const [instances, setInstances] = useState([]);
  const [q, setQ] = useState({ entityType: "", status: "" });
  const [startForm, setStartForm] = useState({ templateCode: "", entityId: "", entityType: "document", starterId: 1, variables: { priority: "high" } });
  const [hist, setHist] = useState([]);
  const [exec, setExec] = useState({ id: "", action: "", comment: "", variables: {} });
  const [roleCode, setRoleCode] = useState("ROLE_REVIEWER");
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [operatorId, setOperatorId] = useState("");

  const loadTemplates = async () => {
    const res = await listWorkflowTemplates();
    if (res.code === 200) setTemplates(res.data || []);
  };
  const loadInstances = async () => {
    const res = await listWorkflowInstances({ entityType: q.entityType || undefined, status: q.status || undefined });
    if (res.code === 200) setInstances(res.data || []);
  };

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { loadInstances(); }, [q.entityType, q.status]);
  useEffect(() => {
    (async () => {
      const r = await listUsersByRole(roleCode);
      if (r.code === 200) setCandidateUsers((r.data?.records) || []);
    })();
  }, [roleCode]);

  const createT = async (e) => {
    e.preventDefault();
    if (!tmpl.templateCode || !tmpl.templateName) return;
    await createWorkflowTemplate({ ...tmpl, isActive: 1, createdBy: 1 });
    setTmpl({ templateCode: "", templateName: "", entityType: "document", config: defaultConfig() });
    loadTemplates();
  };

  const startIns = async (e) => {
    e.preventDefault();
    if (!startForm.templateCode || !startForm.entityId) return;
    const res = await startWorkflowInstance({ ...startForm });
    if (res.code === 200) {
      setStartForm({ templateCode: "", entityId: "", entityType: "document", starterId: 1, variables: { priority: "high" } });
      loadInstances();
    }
  };

  const openHist = async (id) => {
    const r = await getWorkflowHistory(id);
    if (r.code === 200) setHist(r.data || []);
  };
  const execAction = async (e) => {
    e.preventDefault();
    if (!exec.id || !exec.action || !operatorId) return;
    await executeWorkflowInstance(exec.id, { action: exec.action, operatorId: Number(operatorId), comment: exec.comment || "", variables: exec.variables || {} });
    setExec({ id: "", action: "", comment: "", variables: {} });
    setOperatorId("");
    loadInstances();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">工作流管理</h1>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">创建工作流模板</h2>
          <form onSubmit={createT} className="space-y-2">
            <input className="border p-2 rounded w-full" placeholder="模板编码" value={tmpl.templateCode} onChange={e=>setTmpl({...tmpl, templateCode: e.target.value})} />
            <input className="border p-2 rounded w-full" placeholder="模板名称" value={tmpl.templateName} onChange={e=>setTmpl({...tmpl, templateName: e.target.value})} />
            <input className="border p-2 rounded w-full" placeholder="实体类型" value={tmpl.entityType} onChange={e=>setTmpl({...tmpl, entityType: e.target.value})} />
            <textarea className="border p-2 rounded w-full h-40 font-mono" value={tmpl.config} onChange={e=>setTmpl({...tmpl, config: e.target.value})} />
            <div className="text-sm text-gray-600">
              审批角色字典：支持 <code>role:reviewer</code>（审核人）与 <code>role:approver</code>（批准人）；请在节点的 <code>assignees</code> 中配置，如 <code>["role:reviewer"]</code>。
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded">保存模板</button>
          </form>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">模板列表</h3>
            <ul className="list-disc pl-5">
              {templates.map(t => (<li key={t.id}>{t.templateCode} - {t.templateName} - {t.entityType}</li>))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">启动实例</h2>
          <form onSubmit={startIns} className="space-y-2">
            <select className="border p-2 rounded w-full" value={startForm.templateCode} onChange={e=>setStartForm({...startForm, templateCode: e.target.value})}>
              <option value="">选择模板</option>
              {templates.map(t => (<option key={t.id} value={t.templateCode}>{t.templateName}</option>))}
            </select>
            <input className="border p-2 rounded w-full" placeholder="实体ID" value={startForm.entityId} onChange={e=>setStartForm({...startForm, entityId: e.target.value})} />
            <input className="border p-2 rounded w-full" placeholder="实体类型" value={startForm.entityType} onChange={e=>setStartForm({...startForm, entityType: e.target.value})} />
            <input className="border p-2 rounded w-full" placeholder="发起人ID" value={startForm.starterId} onChange={e=>setStartForm({...startForm, starterId: Number(e.target.value || 1)})} />
            <textarea className="border p-2 rounded w-full h-24 font-mono" placeholder='变量JSON' value={JSON.stringify(startForm.variables)} onChange={e=>{ try{ setStartForm({...startForm, variables: JSON.parse(e.target.value || "{}")}); } catch{ } }} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">启动</button>
          </form>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="font-semibold mb-2">实例与状态追踪</h2>
        <div className="mb-2 flex gap-2">
          <input className="border p-2 rounded" placeholder="实体类型" value={q.entityType} onChange={e=>setQ({...q, entityType: e.target.value})} />
          <select className="border p-2 rounded" value={q.status} onChange={e=>setQ({...q, status: e.target.value})}>
            <option value="">所有状态</option>
            <option value="running">运行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <button className="px-3 py-1 border rounded" onClick={loadInstances}>查询</button>
        </div>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">模板</th>
              <th className="border p-2">实体</th>
              <th className="border p-2">当前节点</th>
              <th className="border p-2">状态</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {instances.map(i => (
              <tr key={i.id}>
                <td className="border p-2">{i.id}</td>
                <td className="border p-2">{i.templateId}</td>
                <td className="border p-2">{i.entityType}#{i.entityId}</td>
                <td className="border p-2">{i.currentNode}</td>
                <td className="border p-2">{i.status}</td>
                <td className="border p-2">
                  <button className="text-blue-600" onClick={()=>openHist(i.id)}>查看历史</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hist.length > 0 && (
          <div className="mt-3">
            <h3 className="font-semibold">流转历史</h3>
            <ul className="list-disc pl-5">
              {hist.map(h => (<li key={h.id}>{h.createdAt}：{h.fromNode || "-"} → {h.toNode}，动作：{h.action}，备注：{h.comment || "-"}</li>))}
            </ul>
          </div>
        )}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">执行动作（审批人选择/备注）</h3>
          <form onSubmit={execAction} className="flex items-center gap-2">
            <input className="border p-2 rounded" placeholder="实例ID" value={exec.id} onChange={e=>setExec({...exec, id: e.target.value})} />
            <input className="border p-2 rounded" placeholder="动作名，如 提交审核/批准/驳回" value={exec.action} onChange={e=>setExec({...exec, action: e.target.value})} />
            <input className="border p-2 rounded" placeholder="备注/审批意见" value={exec.comment} onChange={e=>setExec({...exec, comment: e.target.value})} />
            <select className="border p-2 rounded" value={roleCode} onChange={e=>setRoleCode(e.target.value)}>
              <option value="ROLE_REVIEWER">审批人角色：审核人</option>
              <option value="ROLE_APPROVER">审批人角色：批准人</option>
            </select>
            <select className="border p-2 rounded" value={operatorId} onChange={e=>setOperatorId(e.target.value)}>
              <option value="">选择审批人</option>
              {candidateUsers.map(u => (<option key={u.id} value={u.id}>{u.username}</option>))}
            </select>
            <button className="bg-purple-600 text-white px-4 py-2 rounded">执行</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function defaultConfig() {
  return JSON.stringify({
    nodes: [
      { nodeId: "start", nodeName: "开始", nodeType: "start" },
      { nodeId: "draft", nodeName: "起草", nodeType: "task", assignType: "creator" },
      { nodeId: "review", nodeName: "审核", nodeType: "approval", assignees: ["role:reviewer"], properties: { requireAllApproval: false } },
      { nodeId: "approve", nodeName: "批准", nodeType: "approval", assignees: ["role:approver"] },
      { nodeId: "end", nodeName: "完成", nodeType: "end" }
    ],
    transitions: [
      { transitionId: "t1", fromNode: "draft", toNode: "review", actionName: "提交审核" },
      { transitionId: "t2", fromNode: "review", toNode: "approve", actionName: "审核通过" },
      { transitionId: "t3", fromNode: "review", toNode: "draft", actionName: "驳回" },
      { transitionId: "t4", fromNode: "approve", toNode: "end", actionName: "批准" }
    ],
    notifications: {
      review: { recipients: ["assignee"], recipientType: "role", template: "您有新的文档需要审核：${entityType} #${entityId}", channels: ["system", "email"] }
    }
  }, null, 2);
}
