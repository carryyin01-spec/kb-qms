import { useEffect, useState } from "react";
import { listNotifications, createNotification, deleteNotification } from "../services/notificationService";
import { listUsers } from "../services/userService";

export default function Notifications() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [recipient, setRecipient] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ title: "", content: "", recipient: "", status: "PENDING" });
  const [userOptions, setUserOptions] = useState([]);
  
  const STATUS_MAP = {
    "PENDING": "待发送",
    "SENT": "已发送",
    "READ": "已读"
  };

  const fetchData = async () => {
    const res = await listNotifications({ page, size: 10, title: q, status, recipient });
    if (res.code === 200) {
      setData(res.data.records || []);
      setTotal(res.data.total || 0);
    }
  };
  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => {
    (async () => {
      const r = await listUsers({ page: 1, size: 1000 });
      if (r.code === 200) {
        const arr = (r.data.records || []).map(u => ({ value: u.username, label: u.name || u.username }));
        setUserOptions(arr);
      }
    })();
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    await createNotification(form);
    setForm({ title: "", content: "", recipient: "", status: "PENDING" });
    setPage(1);
    fetchData();
  };
  const remove = async (id) => {
    await deleteNotification(id);
    fetchData();
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">通知中心</h1>
      <form onSubmit={submit} className="mb-4 grid grid-cols-5 gap-2 items-center">
        <input className="border p-2 rounded" placeholder="标题" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
        <select multiple className="border p-2 rounded" value={(form.recipient ? form.recipient.split(",") : [])} onChange={e=>{
          const vals = Array.from(e.target.selectedOptions).map(o=>o.value);
          setForm({ ...form, recipient: vals.join(",") });
        }}>
          <option value="">选择接收人</option>
          {userOptions.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
        <select className="border p-2 rounded" value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
          <option value="PENDING">待发送</option>
          <option value="SENT">已发送</option>
          <option value="READ">已读</option>
        </select>
        <input className="border p-2 rounded" placeholder="内容" value={form.content} onChange={e=>setForm({...form, content: e.target.value})} />
        <button className="bg-green-600 text-white px-4 py-2 rounded">新增</button>
      </form>
      <div className="mb-3 flex gap-2">
        <input className="border p-2 rounded" value={q} onChange={e=>setQ(e.target.value)} placeholder="标题搜索" />
        <select className="border p-2 rounded" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">所有状态</option>
          <option value="PENDING">待发送</option>
          <option value="SENT">已发送</option>
          <option value="READ">已读</option>
        </select>
        <select className="border p-2 rounded" value={recipient} onChange={e=>setRecipient(e.target.value)}>
          <option value="">接收人筛选</option>
          {userOptions.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchData}>查询</button>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">标题</th>
            <th className="border p-2">接收人</th>
            <th className="border p-2">状态</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map(n => (
            <tr key={n.id}>
              <td className="border p-2">{n.id}</td>
              <td className="border p-2">{n.title}</td>
              <td className="border p-2">{n.recipient}</td>
              <td className="border p-2">{STATUS_MAP[n.status] || n.status}</td>
              <td className="border p-2">
                <button className="text-red-600" onClick={()=>remove(n.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-3">
        <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1, p-1))}>上一页</button>
        <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total/10))} 页</span>
        <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>p+1)}>下一页</button>
      </div>
    </div>
  );
}
