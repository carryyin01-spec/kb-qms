import { useEffect, useState } from "react";
import { listUsers, listAllRoles, getUserRoles, assignUserRoles, createUser, updateUserStatus, addUserRole, resetUserPassword, updateUserPassword } from "../services/userService";
import { createRole } from "../services/roleService";
import Modal from "../components/Modal";

export default function Users() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState({ username: "", name: "" });
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState({});
  const [assignUserId, setAssignUserId] = useState(null);
  const [newUser, setNewUser] = useState({ username: "", name: "", password: "", email: "", status: 1 });
  const [msg, setMsg] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [userQ2, setUserQ2] = useState("");
  const [userList2, setUserList2] = useState([]);
  const [selectedBatchUsers, setSelectedBatchUsers] = useState(new Set());
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdUserId, setPwdUserId] = useState(null);
  const [pwdVal, setPwdVal] = useState("");

  const fetchBase = async () => {
    const r = await listAllRoles();
    if (r.code === 200) setRoles(r.data || []);
  };
  const fetchUsers = async () => {
    const r = await listUsers({ page, size: pageSize, username: q.username, name: q.name });
    if (r.code === 200) {
      setData(r.data.records || []);
      setTotal(r.data.total || 0);
    }
  };
  useEffect(() => { fetchBase(); }, []);
  useEffect(() => { fetchUsers(); }, [page, pageSize]);

  const openEdit = async (userId) => {
    const r = await getUserRoles(userId);
    const ids = r.code === 200 ? r.data || [] : [];
    setEditing({ ...editing, [userId]: new Set(ids) });
    setAssignUserId(userId);
  };
  const toggleRole = (userId, roleId) => {
    const s = new Set(editing[userId] || []);
    if (s.has(roleId)) s.delete(roleId); else s.add(roleId);
    setEditing({ ...editing, [userId]: s });
  };
  const saveRoles = async (userId) => {
    const ids = Array.from(editing[userId] || []);
    await assignUserRoles(userId, ids);
    delete editing[userId];
    setEditing({ ...editing });
    setAssignUserId(null);
    setMsg("权限分配已保存");
  };

  const applyTemplate = (userId, template) => {
    const codeSets = {
      reviewer: ["ROLE_REVIEWER","ROLE_APPROVER"], // 会在模板面板里按需处理；此处参考角色编码
      viewer: ["ROLE_VIEWER"],
      doc_admin: ["ROLE_DOC_ADMIN"]
    };
    const targetCodes = codeSets[template] || [];
    const next = new Set(editing[userId] || []);
    for (const c of targetCodes) {
      const role = roles.find(x=>x.code === c);
      if (role) next.add(role.id);
    }
    setEditing({ ...editing, [userId]: next });
    const nameMap = { reviewer: "审核/批准组合", viewer: "只读用户", doc_admin: "文件管理员" };
    setMsg(`已应用${nameMap[template] || template}模板到该用户`);
  };

  const fetchUsersPanel2 = async () => {
    const r = await listUsers({ page: 1, size: 50, username: userQ2 });
    if (r.code === 200) setUserList2(r.data.records || []);
  };
  const toggleBatchUser = (uid) => {
    const s = new Set(selectedBatchUsers);
    if (s.has(uid)) s.delete(uid); else s.add(uid);
    setSelectedBatchUsers(s);
  };
  const ensureRoleAndAssignBatch = async (code, name) => {
    const all = await listAllRoles();
    let roleId = null;
    if (all.code === 200) {
      const found = (all.data || []).find(r => r.code === code);
      if (found) roleId = found.id;
    }
    if (!roleId) {
      const cr = await createRole({ name, code });
      if (cr.code !== 200) { setMsg("创建角色失败"); return; }
      const all2 = await listAllRoles();
      if (all2.code === 200) {
        const found2 = (all2.data || []).find(r => r.code === code);
        roleId = found2 ? found2.id : null;
      }
    }
    if (!roleId) { setMsg("未找到角色ID"); return; }
    for (const uid of Array.from(selectedBatchUsers)) {
      await addUserRole(uid, roleId);
    }
    setMsg(`已为选中用户分配 ${name}`);
  };

  const submitNewUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) { setMsg("请填写用户名与密码"); return; }
    const r = await createUser(newUser);
    if (r.code === 200) {
      setMsg("用户已创建");
      setNewUser({ username: "", password: "", email: "", status: 1 });
      setCreateOpen(false);
      setPage(1);
      fetchUsers();
    } else {
      setMsg(r.message || "创建失败");
    }
  };

  const handleResetPwd = async (uid) => {
    if(!window.confirm("确定重置密码为 12345 吗？")) return;
    const r = await resetUserPassword(uid);
    if (r.code === 200) setMsg("密码已重置为 12345");
    else setMsg(r.message || "重置失败");
  };

  const handleChangePwd = async () => {
    if (!pwdUserId || !pwdVal) return;
    const r = await updateUserPassword(pwdUserId, pwdVal);
    if (r.code === 200) {
      setMsg("密码已修改");
      setPwdOpen(false);
      setPwdVal("");
      setPwdUserId(null);
    } else {
      setMsg(r.message || "修改失败");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">用户管理</h1>
      
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input"
            value={q.username}
            onChange={(e) => setQ({ ...q, username: e.target.value })}
            placeholder="用户登录名"
          />
          <input
            className="input"
            value={q.name || ""}
            onChange={(e) => setQ({ ...q, name: e.target.value })}
            placeholder="用户姓名"
          />
          <button className="btn-primary" onClick={() => { setPage(1); fetchUsers(); }}>查询</button>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>创建用户</button>
      </div>

      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户登录名</th>
            <th>用户姓名</th>
            <th>权限分配</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>启用/停用</th>
          </tr>
        </thead>
        <tbody>
          {data.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.name || "-"}</td>
              <td>
                <button className="btn-secondary mr-2" onClick={()=>openEdit(u.id)}>分配权限</button>
                <button className="btn-outline mr-2" onClick={()=>{ setPwdUserId(u.id); setPwdOpen(true); }}>修改密码</button>
                <button className="btn-outline text-red-600" onClick={()=>handleResetPwd(u.id)}>重置(12345)</button>
              </td>
              <td>{u.status === 1 ? "启用" : "停用"}</td>
              <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
              <td>
                {u.status === 1 ? (
                  <button className="btn-outline" onClick={async ()=>{ await updateUserStatus(u.id, 0); setMsg("用户已停用"); fetchUsers(); }}>停用</button>
                ) : (
                  <button className="btn-primary" onClick={async ()=>{ await updateUserStatus(u.id, 1); setMsg("用户已启用"); fetchUsers(); }}>启用</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">每页显示:</span>
          <select
            className="input py-1 px-2 text-sm bg-white"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 条</option>
            <option value={20}>20 条</option>
            <option value={50}>50 条</option>
            <option value={100}>100 条</option>
          </select>
          <span className="text-sm text-gray-600 ml-2">共 {total} 条记录</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-outline py-1 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          
          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页
          </span>

          <button
            className="btn-outline py-1 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
            disabled={page >= Math.ceil(total / pageSize)}
          >
            下一页
          </button>

          <div className="flex items-center gap-1 ml-4 border-l pl-4 border-gray-300">
            <span className="text-sm text-gray-600">跳至</span>
            <input
              type="number"
              min="1"
              max={Math.ceil(total / pageSize)}
              className="input w-16 py-1 px-2 text-sm text-center"
              defaultValue={page}
              key={page}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const p = parseInt(e.target.value);
                  const maxPage = Math.max(1, Math.ceil(total / pageSize));
                  if (!isNaN(p) && p >= 1 && p <= maxPage) {
                    setPage(p);
                  }
                }
              }}
              onBlur={(e) => {
                 const p = parseInt(e.target.value);
                 const maxPage = Math.max(1, Math.ceil(total / pageSize));
                 if (!isNaN(p) && p >= 1 && p <= maxPage) {
                   setPage(p);
                 } else {
                   e.target.value = page;
                 }
              }}
            />
            <span className="text-sm text-gray-600">页</span>
          </div>
        </div>
      </div>
      <Modal
        open={createOpen}
        title="创建用户"
        onClose={() => setCreateOpen(false)}
        footer={null}
      >
        <form onSubmit={submitNewUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户登录名</label>
            <input className="input w-full" placeholder="用户登录名" value={newUser.username} onChange={e=>setNewUser({ ...newUser, username: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户姓名</label>
            <input className="input w-full" placeholder="用户姓名" value={newUser.name} onChange={e=>setNewUser({ ...newUser, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input className="input w-full" type="password" placeholder="密码" value={newUser.password} onChange={e=>setNewUser({ ...newUser, password: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input className="input w-full" placeholder="邮箱" value={newUser.email} onChange={e=>setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select className="select w-full" value={newUser.status} onChange={e=>setNewUser({ ...newUser, status: parseInt(e.target.value || "1", 10) })}>
              <option value={1}>启用</option>
              <option value={0}>停用</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
             <button type="button" className="btn-outline" onClick={() => setCreateOpen(false)}>取消</button>
             <button type="submit" className="btn-primary">创建</button>
          </div>
        </form>
      </Modal>
      <Modal
        open={assignUserId != null}
        title="分配权限"
        onClose={()=>{ setAssignUserId(null); }}
        footer={
          <>
            <button className="btn-primary mr-2" onClick={()=>{ if(assignUserId) saveRoles(assignUserId); }}>保存</button>
            <button className="btn-outline mr-2" onClick={()=>setTemplateOpen(true)}>模板与批量分配</button>
            <button className="btn-outline" onClick={()=>{ setAssignUserId(null); }}>取消</button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {roles.map(r => (
            <label key={r.id} className="inline-flex items-center gap-1">
              <input type="checkbox" checked={assignUserId ? (editing[assignUserId]?.has(r.id) || false) : false} onChange={()=>{ if(assignUserId) toggleRole(assignUserId, r.id); }} />
              <span>{r.name || r.code || r.id}</span>
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
            <button className="btn-outline" onClick={()=>setTemplateOpen(false)}>关闭</button>
          </>
        }
      >
        <div className="mb-3 flex gap-2">
          <button className="btn-outline" onClick={()=>{ if(assignUserId) applyTemplate(assignUserId,"reviewer"); }}>应用“审核/批准组合”</button>
          <button className="btn-outline" onClick={()=>{ if(assignUserId) applyTemplate(assignUserId,"viewer"); }}>应用“只读用户”</button>
          <button className="btn-outline" onClick={()=>{ if(assignUserId) applyTemplate(assignUserId,"doc_admin"); }}>应用“文件管理员”</button>
        </div>
        <div className="mb-2 font-semibold">批量分配给选中用户</div>
        <div className="mb-2 flex gap-2">
          <input className="input" placeholder="按用户名筛选" value={userQ2} onChange={e=>setUserQ2(e.target.value)} />
          <button className="btn-outline" onClick={fetchUsersPanel2}>加载用户</button>
        </div>
        <div className="flex flex-wrap gap-3 mb-3">
          {userList2.map(u => (
            <label key={u.id} className="inline-flex items-center gap-1">
              <input type="checkbox" checked={selectedBatchUsers.has(u.id)} onChange={()=>toggleBatchUser(u.id)} />
              <span>{u.username}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={()=>ensureRoleAndAssignBatch("ROLE_REVIEWER","审核人")}>创建并分配 审核人</button>
          <button className="btn-primary" onClick={()=>ensureRoleAndAssignBatch("ROLE_APPROVER","批准人")}>创建并分配 批准人</button>
          <button className="btn-primary" onClick={()=>ensureRoleAndAssignBatch("ROLE_VIEWER","只读用户")}>创建并分配 只读用户</button>
          <button className="btn-primary" onClick={()=>ensureRoleAndAssignBatch("ROLE_DOC_ADMIN","文件管理员")}>创建并分配 文件管理员</button>
        </div>
      </Modal>

      <Modal
        open={pwdOpen}
        title="修改用户密码"
        onClose={()=>{ setPwdOpen(false); setPwdUserId(null); }}
        footer={
          <>
            <button className="btn-primary mr-2" onClick={handleChangePwd}>确认修改</button>
            <button className="btn-outline" onClick={()=>{ setPwdOpen(false); setPwdUserId(null); }}>取消</button>
          </>
        }
      >
        <input 
          type="password" 
          className="input w-full" 
          placeholder="输入新密码" 
          value={pwdVal} 
          onChange={e=>setPwdVal(e.target.value)} 
        />
      </Modal>
    </div>
  );
}
