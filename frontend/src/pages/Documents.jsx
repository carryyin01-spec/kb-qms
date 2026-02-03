import { useEffect, useState } from "react";
import { listDocuments, deleteDocument, createDocument, listVersions, updateDocument } from "../services/documentService";
import request from "../utils/request";
import { getToken, getPerms } from "../utils/storage";
import Modal from "../components/Modal";
import { Link } from "react-router-dom";

export default function Documents() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ title: "", content: "", status: "DRAFT", ownerId: 1 });
  const [docOpen, setDocOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [wfOpen, setWfOpen] = useState(false);
  const [wfDocId, setWfDocId] = useState(null);
  const [wfTarget, setWfTarget] = useState("");
  const [wfCurrent, setWfCurrent] = useState("DRAFT");
  const [versions, setVersions] = useState([]);
  const [showVersionsFor, setShowVersionsFor] = useState(null);
  const [versionForm, setVersionForm] = useState({ content: "" });
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportTitle, setExportTitle] = useState("");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("documents");
  const perms = getPerms();
  const canCreate = (perms || []).includes("DOC_CREATE");
  const canDelete = (perms || []).includes("DOC_DELETE");
  const canUpdate = (perms || []).includes("DOC_UPDATE");
  const nextStatuses = (cur) => {
    switch (cur || "DRAFT") {
      case "DRAFT": return ["REVIEW"];
      case "REVIEW": return ["APPROVED","DRAFT"];
      case "APPROVED": return ["ACTIVE"];
      case "ACTIVE": return ["ARCHIVED"];
      default: return [];
    }
  };
  const statusLabel = (code) => {
    switch (code) {
      case "DRAFT": return "草稿";
      case "REVIEW": return "审核中";
      case "APPROVED": return "已批准";
      case "ACTIVE": return "生效";
      case "ARCHIVED": return "已归档";
      default: return code || "";
    }
  };
  const changeStatus = async (id, target) => {
    if (!target) return;
    await request.post(`/document-workflow/transition`, null, { params: { id, targetStatus: target } });
    fetchData();
  };
  const fetchData = async () => {
    const res = await listDocuments({ page, size, title: q });
    if (res.code === 200) setData(res.data.records || []);
    if (res.code === 200) setTotal(res.data.total || 0);
  };
  useEffect(() => {
    fetchData();
  }, [page]);
  const remove = async (id) => {
    await deleteDocument(id);
    fetchData();
  };
  const openVersions = async (docId) => {
    const res = await listVersions(docId);
    if (res.code === 200) {
      setVersions(res.data.records || []);
      setShowVersionsFor(docId);
      setVersionsOpen(true);
    }
  };
  const saveDoc = async () => {
    if (!form.title) { setMsg("请填写标题"); return; }
    if (editId) {
      await updateDocument(editId, { ...form, content: form.content || "" });
      setMsg("文档已保存");
    } else {
      await createDocument({ ...form, content: form.content || "" });
      setMsg("文档已新增");
    }
    setForm({ title: "", content: "", status: "DRAFT", ownerId: 1 });
    setEditId(null);
    setDocOpen(false);
    setPage(1);
    fetchData();
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">文档管理</h1>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      
      {/* 文档管理 & 质量管理导航 */}
      <div className="mb-6 flex gap-3 border-b">
        <button 
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-3 font-semibold border-b-2 ${activeTab === "documents" ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-blue-600"}`}
        >
          进入文档管理
        </button>
        <button 
          onClick={() => setActiveTab("quality")}
          className={`px-4 py-3 font-semibold border-b-2 ${activeTab === "quality" ? "text-blue-600 border-blue-600" : "text-gray-600 border-transparent hover:text-blue-600"}`}
        >
          进入质量管理
        </button>
      </div>

      {/* 文档管理标签页内容 */}
      {activeTab === "documents" && (
        <>
          <div className="mb-4">
            {canCreate && <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={()=>{ setEditId(null); setForm({ title: "", content: "", status: "DRAFT", ownerId: 1 }); setDocOpen(true); }}>新增文档</button>}
          </div>
          <div className="mb-3 flex gap-2">
            <input className="border p-2 rounded" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="标题搜索" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchData}>查询</button>
          </div>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">ID</th>
                <th className="border p-2">标题</th>
                <th className="border p-2">状态</th>
                <th className="border p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td className="border p-2">{d.id}</td>
                  <td className="border p-2">{d.title}</td>
                  <td className="border p-2">{statusLabel(d.status)}</td>
                  <td className="border p-2">
                    {canDelete && <button className="text-red-600" onClick={()=>remove(d.id)}>删除</button>}
                    <button className="ml-3 text-blue-600" onClick={()=>openVersions(d.id)}>查看版本</button>
                    {canUpdate && <button className="ml-2 px-3 py-1 border rounded" onClick={()=>{ setEditId(d.id); setForm({ title: d.title, content: d.content || "", status: d.status || "DRAFT", ownerId: d.ownerId || 1 }); setDocOpen(true); }}>编辑</button>}
                    {canUpdate && <button className="ml-2 px-3 py-1 border rounded" onClick={()=>{ setWfDocId(d.id); setWfCurrent(d.status || "DRAFT"); setWfTarget(""); setWfOpen(true); }}>流转</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <select className="px-3 py-1 border rounded" value={size} onChange={e=>{ setSize(parseInt(e.target.value || "10", 10)); setPage(1); }}>
              <option value={10}>每页10</option>
              <option value={20}>每页20</option>
              <option value={50}>每页50</option>
            </select>
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1, p-1))}>上一页</button>
            <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total/size))} 页</span>
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>p+1)}>下一页</button>
          </div>
          <div className="mt-4">
            <input className="border p-2 rounded mr-2" placeholder="导出标题筛选" value={exportTitle} onChange={e=>setExportTitle(e.target.value)} />
            <select className="border p-2 rounded mr-2" value={exportStatus} onChange={e=>setExportStatus(e.target.value)}>
              <option value="">所有状态</option>
              <option value="DRAFT">草稿</option>
              <option value="REVIEW">审核中</option>
              <option value="APPROVED">已批准</option>
              <option value="ACTIVE">生效</option>
              <option value="ARCHIVED">已归档</option>
            </select>
            <input type="date" className="border p-2 rounded mr-2" value={exportStart} onChange={e=>setExportStart(e.target.value)} />
            <input type="date" className="border p-2 rounded mr-2" value={exportEnd} onChange={e=>setExportEnd(e.target.value)} />
            <a className="text-blue-600 underline mr-4" href={`${process.env.REACT_APP_API_BASE}/export/documents.csv?title=${encodeURIComponent(exportTitle)}&status=${encodeURIComponent(exportStatus)}&start=${encodeURIComponent(exportStart)}&end=${encodeURIComponent(exportEnd)}&token=${encodeURIComponent(getToken() || "")}`} target="_blank" rel="noreferrer">导出文档CSV</a>
            <a className="text-blue-600 underline" href={`${process.env.REACT_APP_API_BASE}/export/documents.xlsx?title=${encodeURIComponent(exportTitle)}&status=${encodeURIComponent(exportStatus)}&start=${encodeURIComponent(exportStart)}&end=${encodeURIComponent(exportEnd)}&token=${encodeURIComponent(getToken() || "")}`} target="_blank" rel="noreferrer">导出文档Excel</a>
          </div>
        </>
      )}

      {/* 质量管理标签页内容 */}
      {activeTab === "quality" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
              <Link to="/conformance" className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">符合性检验</h3>
                    <p className="text-sm text-gray-600">管理产品符合性检验登记记录，包括检验单、检验明细、不良跟踪等</p>
                  </div>
                  <div className="text-3xl text-blue-500">→</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 版本记录模态框 */}
      <Modal
        open={versionsOpen}
        title={showVersionsFor ? `文档 ${showVersionsFor} 的版本记录` : "版本记录"}
        onClose={()=>{ setVersionsOpen(false); }}
        footer={
          <>
            <button className="px-3 py-1 border rounded" onClick={()=>setVersionsOpen(false)}>关闭</button>
          </>
        }
      >
        <form onSubmit={async (e)=>{e.preventDefault(); if(!versionForm.content) return; await request.post(`/document-versions`, { documentId: showVersionsFor, content: versionForm.content }); setVersionForm({ content: "" }); openVersions(showVersionsFor); }}>
          <div className="flex gap-2 mb-2">
            <input className="border p-2 rounded flex-1" placeholder="新增版本内容" value={versionForm.content} onChange={e=>setVersionForm({ content: e.target.value })} />
            <button className="bg-green-600 text-white px-4 py-2 rounded">新增版本</button>
          </div>
        </form>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">版本号</th>
              <th className="border p-2">内容</th>
              <th className="border p-2">时间</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {versions.map(v => (
              <tr key={v.id}>
                <td className="border p-2">{v.versionNo}</td>
                <td className="border p-2">{v.content}</td>
                <td className="border p-2">{v.createdAt}</td>
                <td className="border p-2">
                  <button className="text-blue-600" onClick={async ()=>{ await request.post(`/document-versions/rollback`, null, { params: { documentId: showVersionsFor, versionId: v.id } }); openVersions(showVersionsFor); fetchData(); }}>回滚到此版本</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* 编辑文档模态框 */}
      <Modal
        open={docOpen}
        title={editId ? "编辑文档" : "新增文档"}
        onClose={()=>{ setDocOpen(false); setEditId(null); }}
        footer={
          <>
            <button className="px-3 py-1 border rounded bg-green-600 text-white mr-2" onClick={saveDoc}>保存</button>
            <button className="px-3 py-1 border rounded" onClick={()=>{ setDocOpen(false); setEditId(null); }}>取消</button>
          </>
        }
      >
        <div className="space-y-2">
          <input className="border p-2 rounded w-full" placeholder="标题" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
          <select className="border p-2 rounded w-full" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
            <option value="DRAFT">草稿</option>
            <option value="REVIEW">审核中</option>
            <option value="APPROVED">已批准</option>
            <option value="ACTIVE">生效</option>
            <option value="ARCHIVED">已归档</option>
          </select>
          <textarea className="border p-2 rounded w-full h-32" placeholder="内容（可选）" value={form.content} onChange={e=>setForm({...form, content: e.target.value})} />
        </div>
      </Modal>

      {/* 文档流转模态框 */}
      <Modal
        open={wfOpen}
        title="文档流转"
        onClose={()=>setWfOpen(false)}
        footer={
          <>
            <button className="px-3 py-1 border rounded mr-2" onClick={async ()=>{ if(wfDocId && wfTarget){ await changeStatus(wfDocId, wfTarget); setWfOpen(false); } }}>执行</button>
            <button className="px-3 py-1 border rounded" onClick={()=>setWfOpen(false)}>取消</button>
          </>
        }
      >
        <div className="space-y-2">
          <select className="border p-2 rounded w-full" value={wfTarget} onChange={e=>setWfTarget(e.target.value)}>
            <option value="">选择流转</option>
            {nextStatuses(wfCurrent || "DRAFT").map(s=> <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <div className="text-sm text-gray-600">选择目标状态后点击"执行"完成流转</div>
        </div>
      </Modal>
    </div>
  );
}
