import { useEffect, useState } from "react";
import { listRoles, createRole, updateRole, deleteRole, listAllPermissions, getRolePermissions, assignRolePermissions } from "../services/roleService";
import { listUsers, listAllRoles as listAllRolesFromUserSvc, addUserRole } from "../services/userService";
import Modal from "../components/Modal";

export default function Roles() {
  const [data, setData] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: "", code: "" });
  const [q, setQ] = useState({ name: "", code: "" });
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState({});
  const [msg, setMsg] = useState("");
  const [userQ, setUserQ] = useState("");
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [assignRoleId, setAssignRoleId] = useState(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  const fetchBase = async () => {
    const r = await listAllPermissions();
    if (r.code === 200) setPermissions(r.data || []);
  };
  const fetchRoles = async () => {
    const res = await listRoles({ page, size: 10, name: q.name, code: q.code });
    if (res.code === 200) {
      setData(res.data.records || []);
      setTotal(res.data.total || 0);
    }
  };
  useEffect(() => { fetchBase(); }, []);
  useEffect(() => { fetchRoles(); }, [page]);
  const fetchUsersPanel = async () => {
    const r = await listUsers({ page: 1, size: 50, username: userQ });
    if (r.code === 200) setUserList(r.data.records || []);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return;
    await createRole(form);
    setForm({ name: "", code: "" });
    setPage(1);
    fetchRoles();
    setMsg("角色已新增");
  };
  const saveEdit = async () => {
    if (!editing || !editing.id) return;
    await updateRole(editing.id, { name: editing.name, code: editing.code });
    setEditing(null);
    fetchRoles();
    setMsg("角色已保存");
  };
  const remove = async (id) => {
    await deleteRole(id);
    fetchRoles();
    setMsg("角色已删除");
  };
  const openAssign = async (roleId) => {
    const r = await getRolePermissions(roleId);
    const ids = r.code === 200 ? r.data || [] : [];
    setAssigning({ ...assigning, [roleId]: new Set(ids) });
    setAssignRoleId(roleId);
  };
  const togglePerm = (roleId, permId) => {
    const s = new Set(assigning[roleId] || []);
    if (s.has(permId)) s.delete(permId); else s.add(permId);
    setAssigning({ ...assigning, [roleId]: s });
  };
  const saveAssign = async (roleId) => {
    const ids = Array.from(assigning[roleId] || []);
    await assignRolePermissions(roleId, ids);
    const a = { ...assigning };
    delete a[roleId];
    setAssigning(a);
    setAssignRoleId(null);
    setMsg("权限点分配已保存");
  };
  const applyTemplate = (roleId, template) => {
    const codeSets = {
      reviewer: ["DOC_WORKFLOW","ISSUE_WORKFLOW","DOC_UPDATE","ISSUE_UPDATE","DOC_EXPORT","ISSUE_EXPORT"],
      approver: ["DOC_WORKFLOW","ISSUE_WORKFLOW","DOC_UPDATE","ISSUE_UPDATE","DOC_DELETE","ISSUE_DELETE","DOC_EXPORT","ISSUE_EXPORT"],
      viewer: ["DOC_EXPORT","ISSUE_EXPORT"],
      doc_admin: ["DOC_CREATE","DOC_UPDATE","DOC_DELETE","DOC_EXPORT","DOC_WORKFLOW"]
    };
    const targetCodes = codeSets[template] || [];
    const idMap = new Map(permissions.map(p => [p.code, p.id]));
    const next = new Set(assigning[roleId] || []);
    for (const c of targetCodes) {
      const pid = idMap.get(c);
      if (pid) next.add(pid);
    }
    setAssigning({ ...assigning, [roleId]: next });
    const nameMap = { reviewer: "审核人", approver: "批准人", viewer: "只读用户", doc_admin: "文件管理员" };
    setMsg(`已应用${nameMap[template] || template}权限模板`);
  };
  const toggleUserSelect = (userId) => {
    const s = new Set(selectedUsers);
    if (s.has(userId)) s.delete(userId); else s.add(userId);
    setSelectedUsers(s);
  };
  const ensureRoleAndAssign = async (code, name) => {
    const all = await listAllRolesFromUserSvc();
    let roleId = null;
    if (all.code === 200) {
      const found = (all.data || []).find(r => r.code === code);
      if (found) roleId = found.id;
    }
    if (!roleId) {
      const cr = await createRole({ name, code });
      if (cr.code !== 200) { setMsg("创建角色失败"); return; }
      const all2 = await listAllRolesFromUserSvc();
      if (all2.code === 200) {
        const found2 = (all2.data || []).find(r => r.code === code);
        roleId = found2 ? found2.id : null;
      }
    }
    if (!roleId) { setMsg("未找到角色ID"); return; }
    for (const uid of Array.from(selectedUsers)) {
      await addUserRole(uid, roleId);
    }
    setMsg(`已为选中用户分配 ${code}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">角色管理</h1>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      <form onSubmit={submit} className="mb-4 grid grid-cols-4 gap-2 items-center">
        <input className="border p-2 rounded" placeholder="角色名称" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        <input className="border p-2 rounded" placeholder="编码" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} />
        <button className="bg-green-600 text-white px-4 py-2 rounded">新增</button>
      </form>
      <div className="mb-4 border rounded p-3">
        <div className="mb-2 font-semibold">快捷分配审批角色给选中用户</div>
        <div className="flex gap-2 mb-2">
          <input className="border p-2 rounded" placeholder="按用户名筛选" value={userQ} onChange={e=>setUserQ(e.target.value)} />
          <button className="px-3 py-1 border rounded" onClick={fetchUsersPanel}>加载用户</button>
          <button className="px-3 py-1 border rounded bg-purple-600 text-white" onClick={()=>ensureRoleAndAssign("ROLE_REVIEWER","审核人")}>创建并分配 审核人</button>
          <button className="px-3 py-1 border rounded bg-purple-600 text-white" onClick={()=>ensureRoleAndAssign("ROLE_APPROVER","批准人")}>创建并分配 批准人</button>
        </div>
        <div className="flex flex-wrap gap-3">
          {userList.map(u => (
            <label key={u.id} className="inline-flex items-center gap-1">
              <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={()=>toggleUserSelect(u.id)} />
              <span>{u.username}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3 flex gap-2">
        <input className="border p-2 rounded" placeholder="名称筛选" value={q.name} onChange={e=>setQ({...q, name: e.target.value})} />
        <input className="border p-2 rounded" placeholder="编码筛选" value={q.code} onChange={e=>setQ({...q, code: e.target.value})} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={fetchRoles}>查询</button>
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
          {data.map(r => (
            <tr key={r.id}>
              <td className="border p-2">{r.id}</td>
              <td className="border p-2">
                {editing && editing.id === r.id ? (
                  <input className="border p-1 rounded" value={editing.name} onChange={e=>setEditing({...editing, name: e.target.value})} />
                ) : r.name}
              </td>
              <td className="border p-2">
                {editing && editing.id === r.id ? (
                  <input className="border p-1 rounded" value={editing.code} onChange={e=>setEditing({...editing, code: e.target.value})} />
                ) : r.code}
              </td>
              <td className="border p-2">
                {editing && editing.id === r.id ? (
                  <>
                    <button className="px-3 py-1 border rounded mr-2" onClick={saveEdit}>保存</button>
                    <button className="px-3 py-1 border rounded" onClick={()=>setEditing(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <button className="px-3 py-1 border rounded mr-2" onClick={()=>setEditing({ id: r.id, name: r.name, code: r.code })}>编辑</button>
                    <button className="px-3 py-1 border rounded mr-2" onClick={()=>remove(r.id)}>删除</button>
                  </>
                )}
                <button className="ml-2 px-3 py-1 border rounded" onClick={()=>openAssign(r.id)}>分配权限点</button>
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
      <Modal
        open={assignRoleId != null}
        title="分配权限点"
        onClose={()=>{ setAssignRoleId(null); }}
        footer={
          <>
            <button className="px-3 py-1 border rounded mr-2" onClick={()=>saveAssign(assignRoleId)}>保存权限</button>
            <button className="px-3 py-1 border rounded" onClick={()=>setTemplateOpen(true)}>模板与批量分配</button>
            <button className="px-3 py-1 border rounded" onClick={()=>{ const a = { ...assigning }; if(assignRoleId){ delete a[assignRoleId]; } setAssigning(a); setAssignRoleId(null); }}>取消</button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {permissions.map(p => (
            <label key={p.id} className="inline-flex items-center gap-1">
              <input type="checkbox" checked={assigning[assignRoleId || -1]?.has(p.id) || false} onChange={()=>togglePerm(assignRoleId, p.id)} />
              <span>{p.name || p.code}</span>
            </label>
          ))}
        </div>
      </Modal>
      <Modal
        open={templateOpen}
        title="模板选择与批量分配"
        onClose={()=>setTemplateOpen(false)}
        footer={
          <>
            <button className="px-3 py-1 border rounded" onClick={()=>setTemplateOpen(false)}>关闭</button>
          </>
        }
      >
        <div className="mb-3 flex gap-2">
          <button className="px-3 py-1 border rounded bg-indigo-600 text-white" onClick={()=>applyTemplate(assignRoleId,"reviewer")}>应用“审核人”模板</button>
          <button className="px-3 py-1 border rounded bg-indigo-600 text-white" onClick={()=>applyTemplate(assignRoleId,"approver")}>应用“批准人”模板</button>
          <button className="px-3 py-1 border rounded bg-indigo-600 text-white" onClick={()=>applyTemplate(assignRoleId,"viewer")}>应用“只读用户”模板</button>
          <button className="px-3 py-1 border rounded bg-indigo-600 text-white" onClick={()=>applyTemplate(assignRoleId,"doc_admin")}>应用“文件管理员”模板</button>
        </div>
        <div className="mb-2 font-semibold">批量分配给选中用户</div>
        <div className="mb-2 flex gap-2">
          <input className="border p-2 rounded" placeholder="按用户名筛选" value={userQ} onChange={e=>setUserQ(e.target.value)} />
          <button className="px-3 py-1 border rounded" onClick={fetchUsersPanel}>加载用户</button>
        </div>
        <div className="flex flex-wrap gap-3 mb-3">
          {userList.map(u => (
            <label key={u.id} className="inline-flex items-center gap-1">
              <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={()=>toggleUserSelect(u.id)} />
              <span>{u.username}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded bg-purple-600 text-white" onClick={()=>ensureRoleAndAssign("ROLE_REVIEWER","审核人")}>创建并分配 审核人</button>
          <button className="px-3 py-1 border rounded bg-purple-600 text-white" onClick={()=>ensureRoleAndAssign("ROLE_APPROVER","批准人")}>创建并分配 批准人</button>
          <button className="px-3 py-1 border rounded bg-purple-600 text-white" onClick={()=>ensureRoleAndAssign("ROLE_VIEWER","只读用户")}>创建并分配 只读用户</button>
          <button className="px-3 py-1 border rounded bg-purple-600 text-white" onClick={()=>ensureRoleAndAssign("ROLE_DOC_ADMIN","文件管理员")}>创建并分配 文件管理员</button>
        </div>
      </Modal>
    </div>
  );
}
