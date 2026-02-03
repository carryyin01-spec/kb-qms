import { useEffect, useState } from "react";
import { listPermissions, createPermission, updatePermission, deletePermission } from "../services/permissionService";

export default function Permissions() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: "", code: "" });
  const [q, setQ] = useState({ name: "", code: "" });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    const res = await listPermissions({ page, size: 10, name: q.name, code: q.code });
    if (res.code === 200) {
      setData(res.data.records || []);
      setTotal(res.data.total || 0);
    }
  };
  useEffect(() => { fetchData(); }, [page]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    await createPermission(form);
    setForm({ name: "", code: "" });
    setPage(1);
    fetchData();
    setMsg("权限点已新增");
  };
  const saveEdit = async () => {
    if (!editing || !editing.id) return;
    await updatePermission(editing.id, { name: editing.name, code: editing.code });
    setEditing(null);
    fetchData();
    setMsg("权限点已保存");
  };
  const remove = async (id) => {
    await deletePermission(id);
    fetchData();
    setMsg("权限点已删除");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">权限点管理</h1>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      <form onSubmit={submit} className="mb-4 grid grid-cols-4 gap-2 items-center">
        <input className="border p-2 rounded" placeholder="权限名称" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        <input className="border p-2 rounded" placeholder="编码" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} />
        <button className="bg-green-600 text-white px-4 py-2 rounded">新增</button>
      </form>
      <div className="mb-3 flex gap-2">
        <input className="border p-2 rounded" placeholder="名称筛选" value={q.name} onChange={e=>setQ({...q, name: e.target.value})} />
        <input className="border p-2 rounded" placeholder="编码筛选" value={q.code} onChange={e=>setQ({...q, code: e.target.value})} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchData}>查询</button>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">名称</th>
            <th className="border p-2">编码</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map(p => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2">
                {editing && editing.id === p.id ? (
                  <input className="border p-1 rounded" value={editing.name} onChange={e=>setEditing({...editing, name: e.target.value})} />
                ) : p.name}
              </td>
              <td className="border p-2">
                {editing && editing.id === p.id ? (
                  <input className="border p-1 rounded" value={editing.code} onChange={e=>setEditing({...editing, code: e.target.value})} />
                ) : p.code}
              </td>
              <td className="border p-2">
                {editing && editing.id === p.id ? (
                  <>
                    <button className="px-3 py-1 border rounded mr-2" onClick={saveEdit}>保存</button>
                    <button className="px-3 py-1 border rounded" onClick={()=>setEditing(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <button className="px-3 py-1 border rounded mr-2" onClick={()=>setEditing({ id: p.id, name: p.name, code: p.code })}>编辑</button>
                    <button className="px-3 py-1 border rounded" onClick={()=>remove(p.id)}>删除</button>
                  </>
                )}
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
