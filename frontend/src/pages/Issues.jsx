import { useEffect, useState, useRef } from "react";
import { listIssues, deleteIssue, createIssue } from "../services/issueService";
import request from "../utils/request";
import { getToken, getPerms } from "../utils/storage";
import { listFollowups, createFollowup } from "../services/issueFollowupService";
import Modal from "../components/Modal";

const statusLabel = (code) => {
  switch (code) {
    case "OPEN": return "打开";
    case "INVESTIGATING": return "调查中";
    case "RESOLVED": return "已解决";
    case "CLOSED": return "已关闭";
    default: return code || "";
  }
};
const severityLabel = (code) => {
  switch (code) {
    case "LOW": return "低";
    case "MEDIUM": return "中";
    case "HIGH": return "高";
    default: return code || "";
  }
};
const categoryLabel = (code) => {
  switch (code) {
    case "PROCESS": return "生产";
    case "DESIGN": return "设计";
    case "SUPPLIER": return "供应商";
    case "AUDIT": return "审核";
    default: return code || "-";
  }
};
const moduleLabel = (code) => {
  switch (code) {
    case "MFG": return "生产模块";
    case "DESIGN": return "设计模块";
    case "SUPPLIER": return "供应商模块";
    case "QA": return "质量模块";
    default: return code || "-";
  }
};
const deptLabel = (code) => {
  switch (code) {
    case "MFG": return "制造部";
    case "RND": return "研发部";
    case "PROC": return "采购部";
    case "QA": return "质量部";
    default: return code || "-";
  }
};

const nexts = (cur) => {
  switch (cur || "OPEN") {
    case "OPEN": return ["INVESTIGATING"];
    case "INVESTIGATING": return ["RESOLVED"];
    case "RESOLVED": return ["CLOSED"];
    default: return [];
  }
};

export default function Issues() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ title: "", description: "", severity: "MEDIUM", category: "PROCESS", status: "OPEN", reporterId: 1 });
  const [issueOpen, setIssueOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusIssueId, setStatusIssueId] = useState(null);
  const [statusTarget, setStatusTarget] = useState("");
  const [statusCurrent, setStatusCurrent] = useState("OPEN");
  const [attachments, setAttachments] = useState([]);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [attachmentsTotal, setAttachmentsTotal] = useState(0);
  const fileRef = useRef();
  const [currentIssueId, setCurrentIssueId] = useState(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [followNote, setFollowNote] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sevFilter, setSevFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const perms = getPerms();
  const canCreate = (perms || []).includes("ISSUE_CREATE");
  const canDelete = (perms || []).includes("ISSUE_DELETE");
  const canUpdate = (perms || []).includes("ISSUE_UPDATE");
  const [optsCat, setOptsCat] = useState([]);
  const [optsMod, setOptsMod] = useState([]);
  const [optsDep, setOptsDep] = useState([]);

  const fetchData = async () => {
    const res = await listIssues({ page, size, title: q, severity: sevFilter || undefined, status: statusFilter || undefined, category: catFilter || undefined, module: moduleFilter || undefined, department: deptFilter || undefined });
    if (res.code === 200) setData(res.data.records || []);
    if (res.code === 200) setTotal(res.data.total || 0);
  };
  useEffect(() => {
    fetchData();
  }, [page]);
  useEffect(() => {
    (async () => {
      const cat = await request.get("/dicts/issues/categories");
      const mod = await request.get("/dicts/issues/modules");
      const dep = await request.get("/dicts/issues/departments");
      if (cat.code === 200) setOptsCat(cat.data || []);
      if (mod.code === 200) setOptsMod(mod.data || []);
      if (dep.code === 200) setOptsDep(dep.data || []);
    })();
  }, []);
  const remove = async (id) => {
    await deleteIssue(id);
    fetchData();
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    await createIssue(form);
    setForm({ title: "", description: "", severity: "MEDIUM", category: "PROCESS", status: "OPEN", reporterId: 1 });
    setPage(1);
    fetchData();
  };
  const openAttachments = async (issueId, pageArg) => {
    setCurrentIssueId(issueId);
    const pg = pageArg || attachmentsPage;
    const res = await request.get(`/issue-attachments`, { params: { issueId, page: pg, size: 10 } });
    if (res.code === 200) {
      setAttachments(res.data.records || []);
      setAttachmentsTotal(res.data.total || 0);
      setAttachmentsPage(pg);
    }
    else setAttachments([]);
    const fr = await listFollowups(issueId);
    if (fr.code === 200) setFollowups(fr.data.records || []);
    setAttachmentsOpen(true);
  };
  const uploadAttachment = async () => {
    const f = fileRef.current.files[0];
    setUploadMsg("");
    if (!f) { setUploadMsg("请选择文件"); return; }
    if (!currentIssueId) { setUploadMsg("请先选择问题"); return; }
    const fd = new FormData();
    fd.append("issueId", currentIssueId);
    fd.append("file", f);
    const res = await request.post(`/issue-attachments/upload?token=${encodeURIComponent(getToken() || "")}`, fd, {
      headers: {
        Authorization: `Bearer ${getToken() || ""}`
      },
      withCredentials: true
    });
    if (res && res.code === 200) {
      setUploadMsg("上传成功");
    } else {
      setUploadMsg(res?.message || "上传失败");
    }
    fileRef.current.value = "";
    if (currentIssueId) openAttachments(currentIssueId, 1);
  };
  const deleteAttachment = async (id) => {
    if(!window.confirm("确定删除附件？")) return;
    await request.delete(`/issue-attachments/${id}`);
    if (currentIssueId) openAttachments(currentIssueId, attachmentsPage);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-4">质量问题</h1>
      <div className="mb-4">
        {canCreate && <button className="btn-primary" onClick={()=>setIssueOpen(true)}>新增问题</button>}
      </div>
      <div className="mb-3 flex gap-2">
        <input className="input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="标题搜索" />
        <select className="select" value={sevFilter} onChange={(e)=>setSevFilter(e.target.value)}>
          <option value="">所有严重度</option>
          <option value="LOW">低</option>
          <option value="MEDIUM">中</option>
          <option value="HIGH">高</option>
        </select>
        <select className="select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
          <option value="">所有状态</option>
          <option value="OPEN">打开</option>
          <option value="INVESTIGATING">调查中</option>
          <option value="RESOLVED">已解决</option>
          <option value="CLOSED">已关闭</option>
        </select>
        <select className="select" value={catFilter} onChange={(e)=>setCatFilter(e.target.value)}>
          <option value="">所有类别</option>
          {optsCat.length === 0 ? (
            <>
              <option value="PROCESS">生产</option>
              <option value="DESIGN">设计</option>
              <option value="SUPPLIER">供应商</option>
              <option value="AUDIT">审核</option>
            </>
          ) : optsCat.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
        <select className="select" value={moduleFilter} onChange={(e)=>setModuleFilter(e.target.value)}>
          <option value="">所有模块</option>
          {optsMod.length === 0 ? (
            <>
              <option value="MFG">生产模块</option>
              <option value="DESIGN">设计模块</option>
              <option value="SUPPLIER">供应商模块</option>
              <option value="QA">质量模块</option>
            </>
          ) : optsMod.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
        <select className="select" value={deptFilter} onChange={(e)=>setDeptFilter(e.target.value)}>
          <option value="">所有责任部门</option>
          {optsDep.length === 0 ? (
            <>
              <option value="MFG">制造部</option>
              <option value="RND">研发部</option>
              <option value="PROC">采购部</option>
              <option value="QA">质量部</option>
            </>
          ) : optsDep.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
        <button className="btn-primary" onClick={()=>{ setPage(1); fetchData(); }}>查询</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>严重度</th>
            <th>类别</th>
            <th>模块</th>
            <th>责任部门</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map(i => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>{i.title}</td>
              <td>{severityLabel(i.severity)}</td>
              <td>{categoryLabel(i.category)}</td>
              <td>{moduleLabel(i.module)}</td>
              <td>{deptLabel(i.department)}</td>
              <td>{statusLabel(i.status)}</td>
              <td>
                {canDelete && <button className="btn-outline text-red-600" onClick={()=>remove(i.id)}>删除</button>}
                <button className="btn-secondary ml-2" onClick={()=>openAttachments(i.id)}>附件</button>
                {canUpdate && <button className="btn-outline ml-2" onClick={()=>{ setStatusIssueId(i.id); setStatusCurrent(i.status || "OPEN"); setStatusTarget(""); setStatusOpen(true); }}>流转</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <IssueExport />
      </div>
      <Modal
        open={issueOpen}
        title="新增质量问题"
        onClose={()=>setIssueOpen(false)}
        footer={
          <>
            <button className="btn-primary mr-2" onClick={async ()=>{ await createIssue(form); setForm({ title: "", description: "", severity: "MEDIUM", category: "PROCESS", status: "OPEN", reporterId: 1 }); setIssueOpen(false); setPage(1); fetchData(); }}>保存</button>
            <button className="btn-outline" onClick={()=>setIssueOpen(false)}>取消</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <input className="input col-span-2" placeholder="标题" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
          <select className="select" value={form.severity} onChange={e=>setForm({...form, severity: e.target.value})}>
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
          </select>
          <select className="select" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
            <option value="OPEN">打开</option>
            <option value="INVESTIGATING">调查中</option>
            <option value="RESOLVED">已解决</option>
            <option value="CLOSED">已关闭</option>
          </select>
          <select className="select" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
            {optsCat.length === 0 ? (
              <>
                <option value="PROCESS">生产</option>
                <option value="DESIGN">设计</option>
                <option value="SUPPLIER">供应商</option>
                <option value="AUDIT">审核</option>
              </>
            ) : optsCat.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
          <select className="select" value={form.module} onChange={e=>setForm({...form, module: e.target.value})}>
            {optsMod.length === 0 ? (
              <>
                <option value="MFG">生产模块</option>
                <option value="DESIGN">设计模块</option>
                <option value="SUPPLIER">供应商模块</option>
                <option value="QA">质量模块</option>
              </>
            ) : optsMod.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
          <select className="select" value={form.department} onChange={e=>setForm({...form, department: e.target.value})}>
            {optsDep.length === 0 ? (
              <>
                <option value="MFG">制造部</option>
                <option value="RND">研发部</option>
                <option value="PROC">采购部</option>
                <option value="QA">质量部</option>
              </>
            ) : optsDep.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
          <textarea className="input col-span-2" placeholder="描述" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={4} />
        </div>
      </Modal>
      <Modal
        open={statusOpen}
        title="问题流转"
        onClose={()=>setStatusOpen(false)}
        footer={
          <>
            <button className="btn-primary mr-2" onClick={async ()=>{ if(!statusIssueId || !statusTarget) return; await request.post(`/issue-workflow/transition`, null, { params: { id: statusIssueId, targetStatus: statusTarget } }); setStatusOpen(false); setStatusTarget(""); fetchData(); }}>执行</button>
            <button className="btn-outline" onClick={()=>setStatusOpen(false)}>取消</button>
          </>
        }
      >
        <div className="space-y-2">
          <select className="select w-full" value={statusTarget} onChange={e=>setStatusTarget(e.target.value)}>
            <option value="">选择流转</option>
            {nexts(statusCurrent || "OPEN").map(s=> <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <div className="text-sm text-gray-600">选择目标状态后点击“执行”完成流转</div>
        </div>
      </Modal>
      <Modal
        open={attachmentsOpen}
        title={currentIssueId ? `问题 ${currentIssueId} 的附件` : "附件"}
        onClose={()=>setAttachmentsOpen(false)}
        footer={
          <>
            <button className="btn-outline" onClick={()=>setAttachmentsOpen(false)}>关闭</button>
          </>
        }
      >
        <input type="file" ref={fileRef} className="mb-2 input" />
        <button className="btn-primary ml-2" onClick={uploadAttachment}>上传到当前问题</button>
        {uploadMsg && <div className="mt-1 text-sm text-gray-700">{uploadMsg}</div>}
        <ul className="list-disc pl-5">
          {attachments.map(a => (
            <li key={a.id} className="flex items-center gap-2 mb-1">
              <a className="text-blue-600 underline" href={`${process.env.REACT_APP_API_BASE.replace('/api','')}${a.url}`} target="_blank" rel="noreferrer">{a.filename}</a>
              <button className="text-red-500 text-sm hover:underline" onClick={()=>deleteAttachment(a.id)}>删除</button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center gap-3">
          <button className="btn-outline" onClick={()=>{ const p = Math.max(1, attachmentsPage-1); openAttachments(currentIssueId, p); }}>上一页</button>
          <span>第 {attachmentsPage} 页 / 共 {Math.max(1, Math.ceil(attachmentsTotal/10))} 页</span>
          <button className="btn-outline" onClick={()=>{ const p = attachmentsPage+1; openAttachments(currentIssueId, p); }}>下一页</button>
        </div>
        <div className="mt-4">
          <div className="font-semibold mb-2">跟进记录</div>
          <form onSubmit={async (e)=>{ e.preventDefault(); if(!followNote) return; await createFollowup({ issueId: currentIssueId, note: followNote }); setFollowNote(""); const fr = await listFollowups(currentIssueId); if (fr.code === 200) setFollowups(fr.data.records || []); }}>
            <textarea className="w-full input mb-2" rows={3} value={followNote} onChange={e=>setFollowNote(e.target.value)} />
            <button className="btn-secondary">新增跟进</button>
          </form>
          <ul className="list-disc pl-5">
            {followups.map(f => (<li key={f.id}>{f.createdAt}：{f.note}</li>))}
          </ul>
        </div>
      </Modal>
      <div className="mt-3 flex items-center gap-3">
        <select className="select" value={size} onChange={e=>{ setSize(parseInt(e.target.value || "10", 10)); setPage(1); }}>
          <option value={10}>每页10</option>
          <option value={20}>每页20</option>
          <option value={50}>每页50</option>
        </select>
        <button className="btn-outline" onClick={()=>setPage(p=>Math.max(1, p-1))}>上一页</button>
        <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total/size))} 页</span>
        <button className="btn-outline" onClick={()=>setPage(p=>p+1)}>下一页</button>
      </div>
    </div>
  );
}

function IssueStatusSelect({ issue, onChanged }) {
  const [v, setV] = useState("");
  const change = async (target) => {
    if (!target) return;
    await request.post(`/issue-workflow/transition`, null, { params: { id: issue.id, targetStatus: target } });
    setV("");
    onChanged && onChanged();
  };
  return (
    <select className="ml-2 border p-1 rounded" onChange={(e)=>change(e.target.value)} value={v}>
      <option value="" disabled>选择流转</option>
      {nexts(issue.status).map(s=> <option key={s} value={s}>{statusLabel(s)}</option>)}
    </select>
  );
}

function IssueExport() {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [module, setModule] = useState("");
  const [department, setDepartment] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const base = process.env.REACT_APP_API_BASE;
  return (
    <div className="flex items-center gap-2">
      <input className="border p-2 rounded" placeholder="标题筛选" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <select className="border p-2 rounded" value={severity} onChange={(e)=>setSeverity(e.target.value)}>
        <option value="">所有严重度</option>
        <option value="LOW">低</option>
        <option value="MEDIUM">中</option>
        <option value="HIGH">高</option>
      </select>
      <select className="border p-2 rounded" value={status} onChange={(e)=>setStatus(e.target.value)}>
        <option value="">所有状态</option>
        <option value="OPEN">打开</option>
        <option value="INVESTIGATING">调查中</option>
        <option value="RESOLVED">已解决</option>
        <option value="CLOSED">已关闭</option>
      </select>
      <select className="border p-2 rounded" value={category} onChange={(e)=>setCategory(e.target.value)}>
        <option value="">所有类别</option>
        <option value="PROCESS">生产</option>
        <option value="DESIGN">设计</option>
        <option value="SUPPLIER">供应商</option>
        <option value="AUDIT">审核</option>
      </select>
      <select className="border p-2 rounded" value={module} onChange={(e)=>setModule(e.target.value)}>
        <option value="">所有模块</option>
        <option value="MFG">生产模块</option>
        <option value="DESIGN">设计模块</option>
        <option value="SUPPLIER">供应商模块</option>
        <option value="QA">质量模块</option>
      </select>
      <select className="border p-2 rounded" value={department} onChange={(e)=>setDepartment(e.target.value)}>
        <option value="">所有责任部门</option>
        <option value="MFG">制造部</option>
        <option value="RND">研发部</option>
        <option value="PROC">采购部</option>
        <option value="QA">质量部</option>
      </select>
      <input type="date" className="border p-2 rounded" value={start} onChange={(e)=>setStart(e.target.value)} />
      <input type="date" className="border p-2 rounded" value={end} onChange={(e)=>setEnd(e.target.value)} />
      <a className="text-blue-600 underline" href={`${base}/export/issues.csv?title=${encodeURIComponent(title)}&severity=${encodeURIComponent(severity)}&status=${encodeURIComponent(status)}&category=${encodeURIComponent(category)}&module=${encodeURIComponent(module)}&department=${encodeURIComponent(department)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&token=${encodeURIComponent(getToken() || "")}`} target="_blank" rel="noreferrer">导出CSV</a>
      <a className="text-blue-600 underline" href={`${base}/export/issues.xlsx?title=${encodeURIComponent(title)}&severity=${encodeURIComponent(severity)}&status=${encodeURIComponent(status)}&category=${encodeURIComponent(category)}&module=${encodeURIComponent(module)}&department=${encodeURIComponent(department)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&token=${encodeURIComponent(getToken() || "")}`} target="_blank" rel="noreferrer">导出Excel</a>
    </div>
  );
}
