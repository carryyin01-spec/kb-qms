import { useEffect, useState } from "react";
import request from "../utils/request";

export default function Audits() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ title: "", auditDate: "", status: "PLANNED", approver: "" });
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState({});
  
  const STATUS_MAP = {
    "PLANNED": "计划中",
    "IN_PROGRESS": "执行中",
    "COMPLETED": "已完成",
    "CANCELLED": "已取消"
  };
  const nextStatuses = (cur) => {
    switch (cur || "PLANNED") {
      case "PLANNED": return ["IN_PROGRESS","CANCELLED"];
      case "IN_PROGRESS": return ["COMPLETED","CANCELLED"];
      default: return [];
    }
  };
  const statusLabel = (code) => STATUS_MAP[code] || code;
  const changeStatus = async (id, target) => {
    if (!target) return;
    await request.post(`/audit-workflow/transition`, null, { params: { id, targetStatus: target, note: notes[id] || "" } });
    fetchData();
  };

  const fetchData = async () => {
    const res = await request.get("/audits", { params: { page, size, title: q || undefined, status: status || undefined } });
    if (res.code === 200) {
      setData(res.data.records || []);
      setTotal(res.data.total || 0);
    }
  };
  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => {
    (async () => {
      const u = await request.get("/users", { params: { page: 1, size: 100 } });
      if (u.code === 200) setUsers(u.data.records || []);
    })();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.auditDate) return;
    await request.post("/audits", form);
    setForm({ title: "", auditDate: "", status: "PLANNED", approver: "" });
    setPage(1);
    fetchData();
  };
  const remove = async (id) => {
    await request.delete(`/audits/${id}`);
    fetchData();
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">审核计划</h1>
      <form onSubmit={submit} className="mb-4 grid grid-cols-4 gap-2 items-center">
        <input className="border p-2 rounded" placeholder="标题" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
        <input type="date" className="border p-2 rounded" value={form.auditDate} onChange={e=>setForm({...form, auditDate: e.target.value})} />
        <select className="border p-2 rounded" value={form.approver} onChange={e=>setForm({...form, approver: e.target.value})}>
          <option value="">选择审批人</option>
          {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
        </select>
        <select className="border p-2 rounded" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
          <option value="PLANNED">计划中</option>
          <option value="IN_PROGRESS">执行中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <button className="bg-green-600 text-white px-4 py-2 rounded">新增</button>
      </form>
      <div className="mb-3 flex gap-2">
        <input className="border p-2 rounded" value={q} onChange={e=>setQ(e.target.value)} placeholder="标题搜索" />
        <select className="border p-2 rounded" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">所有状态</option>
          <option value="PLANNED">计划中</option>
          <option value="IN_PROGRESS">执行中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={()=>{ setPage(1); fetchData(); }}>查询</button>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">标题</th>
            <th className="border p-2">日期</th>
            <th className="border p-2">审批人</th>
            <th className="border p-2">状态</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map(a => (
            <tr key={a.id}>
              <td className="border p-2">{a.id}</td>
              <td className="border p-2">{a.title}</td>
              <td className="border p-2">{a.auditDate}</td>
              <td className="border p-2">{a.approver || "-"}</td>
              <td className="border p-2">{statusLabel(a.status)}</td>
              <td className="border p-2">
                <button className="text-red-600" onClick={()=>remove(a.id)}>删除</button>
                <input className="ml-2 border p-1 rounded" placeholder="备注" value={notes[a.id] || ""} onChange={e=>setNotes(prev=>({ ...prev, [a.id]: e.target.value }))} />
                <select className="ml-2 border p-1 rounded" onChange={(e)=>changeStatus(a.id, e.target.value)} defaultValue="">
                  <option value="" disabled>选择流转</option>
                  {nextStatuses(a.status).map(s=> <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
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
    </div>
  );
}
