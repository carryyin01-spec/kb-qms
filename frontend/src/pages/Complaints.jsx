import { useEffect, useState, useRef } from "react";
import { listComplaints, deleteComplaint, createComplaint, updateComplaint } from "../services/complaintService";
import { uploadFile } from "../services/conformanceService";
import request from "../utils/request";
import { getToken, getPerms } from "../utils/storage";
import { listFollowups, createFollowup } from "../services/complaintFollowupService";
import Modal from "../components/Modal";

const statusLabel = (code) => {
  switch (code?.toLowerCase()) {
    case "open": return "open";
    case "on-going": return "on-going";
    case "closed": return "closed";
    default: return code || "";
  }
};

const severityLabel = (code) => {
  switch (code) {
    case "严重": return "严重";
    case "一般": return "一般";
    case "轻微": return "轻微";
    case "HIGH": return "严重";
    case "MEDIUM": return "一般";
    case "LOW": return "轻微";
    default: return code || "";
  }
};

const nexts = (cur) => {
  switch (cur?.toLowerCase() || "open") {
    case "open": return ["on-going"];
    case "on-going": return ["closed"];
    default: return [];
  }
};

// 动态加载 ExcelJS 脚本
const loadExcelJS = () => {
  return new Promise((resolve) => {
    if (window.ExcelJS) {
      resolve(window.ExcelJS);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
    script.onload = () => resolve(window.ExcelJS);
    document.body.appendChild(script);
  });
};

const imageToBase64 = async (url) => {
  if (!url) return null;
  try {
    const fullUrl = resolveImageUrl(url);
    const response = await fetch(fullUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to convert image to base64, URL:", url, e);
    return null;
  }
};

const resolveImageUrl = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  
  let path = u;
  const prefixes = ["/api/files/", "api/files/", "/api/", "api/", "/files/", "files/"];
  for (const p of prefixes) {
    if (path.startsWith(p)) {
      path = path.substring(p.length);
      break;
    }
  }
  if (path.startsWith("/")) path = path.substring(1);

  let baseUrl = process.env.REACT_APP_API_BASE || "";
  if (!baseUrl || baseUrl.startsWith("/")) {
    if (window.location.port === "3000") {
      baseUrl = window.location.origin.replace(":3000", ":8080") + (baseUrl || "/api");
    } else {
      baseUrl = window.location.origin + (baseUrl || "/api");
    }
  }

  if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  if (!baseUrl.endsWith("/api")) baseUrl += "/api";
  
  return `${baseUrl}/files/${path}`;
};

export default function Complaints() {
  const [data, setData] = useState([]);
  const [customerCodeFilter, setCustomerCodeFilter] = useState("");
  const [productModelFilter, setProductModelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [jumpPage, setJumpPage] = useState("");
  const [form, setForm] = useState({
    month: "", cycle: "", customerGrade: "", complaintTime: "", customerCode: "",
    productModel: "", problemSource: "", productionDept: "",
    orderQty: 0, complaintQty: 0, problemNature: "", inspector: "", defectSn: "",
    complaintDescription: "", defectPictures: "", isIncludedInIndicators: "是",
    severityLevel: "一般", problemSubtype: "", rootCause: "", improvementMeasures: "",
    owner: "", lineLeader: "", supervisor: "", responsibleDept: "", remark: "",
    status: "open"
  });
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusComplaintId, setStatusComplaintId] = useState(null);
  const [statusTarget, setStatusTarget] = useState("");
  const [statusCurrent, setStatusCurrent] = useState("open");
  const [attachments, setAttachments] = useState([]);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [attachmentsTotal, setAttachmentsTotal] = useState(0);
  const fileRef = useRef();
  const [currentComplaintId, setCurrentComplaintId] = useState(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [followNote, setFollowNote] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [msg, setMsg] = useState("");
  
  const [statusFilter, setStatusFilter] = useState("");
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [productionDeptFilter, setProductionDeptFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [responsibleDeptFilter, setResponsibleDeptFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [qaInspectors, setQaInspectors] = useState([]);
  const perms = getPerms();
  const canCreate = (perms || []).includes("COMPLAINT_CREATE");
  const canDelete = (perms || []).includes("COMPLAINT_DELETE");
  const canUpdate = (perms || []).includes("COMPLAINT_UPDATE");

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length && data.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(i => i.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const batchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.length} 条记录？`)) return;
    try {
      let successCount = 0;
      let failCount = 0;
      for (const id of selectedIds) {
        const res = await deleteComplaint(id);
        if (res.code === 200) {
          successCount++;
        } else {
          failCount++;
        }
      }
      setSelectedIds([]);
      fetchData();
      if (failCount === 0) {
        alert(`成功删除 ${successCount} 条记录`);
      } else {
        alert(`批量处理完成。成功: ${successCount}, 失败: ${failCount}`);
      }
    } catch (error) {
      alert("批量删除过程中发生错误");
    }
  };

  const fetchData = async () => {
    const res = await listComplaints({ 
      page, 
      size, 
      customerCode: customerCodeFilter || undefined, 
      status: statusFilter || undefined,
      productModel: productModelFilter || undefined,
      inspector: inspectorFilter || undefined,
      productionDept: productionDeptFilter || undefined,
      owner: ownerFilter || undefined,
      responsibleDept: responsibleDeptFilter || undefined
    });
    if (res.code === 200) {
      setData(res.data.records || []);
      setTotal(res.data.total || 0);
    }
  };

  const fetchQaInspectors = async () => {
    const res = await request.get("/users", { params: { page: 1, size: 100, roleCode: "ROLE_QA_INSPECTOR" } });
    if (res.code === 200) {
      setQaInspectors(res.data.records || []);
    }
  };

  useEffect(() => {
    fetchData();
    fetchQaInspectors();
  }, [page, size, statusFilter, inspectorFilter, productionDeptFilter, responsibleDeptFilter]);

  const remove = async (id) => {
    if (!window.confirm("确定删除该客诉记录？")) return;
    const res = await deleteComplaint(id);
    if (res.code === 200) {
      fetchData();
    } else {
      alert("删除失败: " + (res.message || "未知错误"));
    }
  };

  const openAttachments = async (complaintId, pageArg) => {
    setCurrentComplaintId(complaintId);
    const pg = pageArg || attachmentsPage;
    const res = await request.get(`/complaint-attachments`, { params: { complaintId, page: pg, size: 10 } });
    if (res.code === 200) {
      setAttachments(res.data.records || []);
      setAttachmentsTotal(res.data.total || 0);
      setAttachmentsPage(pg);
    } else {
      setAttachments([]);
    }
    const fr = await listFollowups(complaintId);
    if (fr.code === 200) setFollowups(fr.data.records || []);
    setAttachmentsOpen(true);
  };

  const uploadAttachment = async () => {
    const f = fileRef.current.files[0];
    setUploadMsg("");
    if (!f) { setUploadMsg("请选择文件"); return; }
    if (!currentComplaintId) { setUploadMsg("请先选择客诉"); return; }
    const fd = new FormData();
    fd.append("complaintId", currentComplaintId);
    fd.append("file", f);
    const res = await request.post(`/complaint-attachments/upload?token=${encodeURIComponent(getToken() || "")}`, fd, {
      headers: { Authorization: `Bearer ${getToken() || ""}` },
      withCredentials: true
    });
    if (res && res.code === 200) {
      setUploadMsg("上传成功");
    } else {
      setUploadMsg(res?.message || "上传失败");
    }
    fileRef.current.value = "";
    if (currentComplaintId) openAttachments(currentComplaintId, 1);
  };

  const deleteAttachment = async (id) => {
    if(!window.confirm("确定删除附件？")) return;
    await request.delete(`/complaint-attachments/${id}`);
    if (currentComplaintId) openAttachments(currentComplaintId, attachmentsPage);
  };

  const openEdit = (i) => {
    setForm({ ...i });
    setIsEdit(true);
    setComplaintOpen(true);
  };

  const resetForm = () => {
    setForm({
      month: "", cycle: "", customerGrade: "", complaintTime: "", customerCode: "",
      productModel: "", problemSource: "", productionDept: "",
      orderQty: 0, complaintQty: 0, problemNature: "", inspector: "", defectSn: "",
      complaintDescription: "", defectPictures: "", isIncludedInIndicators: "是",
      severityLevel: "一般", problemSubtype: "", rootCause: "", improvementMeasures: "",
      owner: "", lineLeader: "", supervisor: "", responsibleDept: "", remark: "",
      status: "open"
    });
    setIsEdit(false);
  };

  const handleComplaintTimeChange = (val) => {
    if (!val) {
      setForm({ ...form, complaintTime: val, month: "", cycle: "" });
      return;
    }
    const date = new Date(val);
    const month = `${date.getMonth() + 1}月`;
    
    // Calculate ISO Week Number
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
    const cycle = `wk${weekNum}`;

    setForm({ ...form, complaintTime: val, month, cycle });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        const url = typeof res.data === 'string' ? res.data : res.data.url;
        const currentImages = form.defectPictures ? form.defectPictures.split(",") : [];
        const nextImages = [...currentImages, url];
        setForm({ ...form, defectPictures: nextImages.join(",") });
      } else {
        alert("图片上传失败：" + res.message);
      }
    } catch (err) {
      alert("图片上传出错");
    }
  };

  const removeImage = (index) => {
    const currentImages = form.defectPictures ? form.defectPictures.split(",") : [];
    const nextImages = currentImages.filter((_, i) => i !== index);
    setForm({ ...form, defectPictures: nextImages.join(",") });
  };

  const handleSave = async () => {
    if (isEdit) {
      await updateComplaint(form.id, form);
    } else {
      await createComplaint(form);
    }
    resetForm();
    setComplaintOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">客诉问题</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mr-4 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 animate-fade-in">
              <span className="text-sm text-blue-700">已选 {selectedIds.length} 项</span>
              {canDelete && <button className="text-red-600 hover:text-red-700 text-sm font-medium ml-2" onClick={batchDelete}>批量删除</button>}
              <button className="text-gray-500 hover:text-gray-700 text-sm font-medium ml-2" onClick={() => setSelectedIds([])}>取消</button>
            </div>
          )}
          {canCreate && <button className="btn-primary" onClick={() => { resetForm(); setComplaintOpen(true); }}>新增客诉</button>}
          <ComplaintExport />
        </div>
      </div>
      
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">客户代码搜索</label>
            <input className="input w-40" value={customerCodeFilter} onChange={(e)=>setCustomerCodeFilter(e.target.value)} placeholder="输入客户代码" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">产品型号搜索</label>
            <input className="input w-40" value={productModelFilter} onChange={(e)=>setProductModelFilter(e.target.value)} placeholder="输入产品型号" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">状态筛选</label>
            <select className="select w-40" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
              <option value="">所有状态</option>
              <option value="open">open</option>
              <option value="on-going">on-going</option>
              <option value="closed">closed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">QA检验员</label>
            <select className="select w-40" value={inspectorFilter} onChange={(e)=>setInspectorFilter(e.target.value)}>
              <option value="">所有检验员</option>
              {qaInspectors.map(u => (
                <option key={u.id} value={u.name || u.username}>{u.name || u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">生产部门</label>
            <select className="select w-40" value={productionDeptFilter} onChange={(e)=>setProductionDeptFilter(e.target.value)}>
              <option value="">所有部门</option>
              {["SMT", "DIP", "ASSY", "样品", "工程", "客户", "来料"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">责任人</label>
            <input className="input w-40" value={ownerFilter} onChange={(e)=>setOwnerFilter(e.target.value)} placeholder="输入责任人" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">责任部门</label>
            <select className="select w-40" value={responsibleDeptFilter} onChange={(e)=>setResponsibleDeptFilter(e.target.value)}>
              <option value="">所有部门</option>
              {["SMT", "DIP", "ASSY", "样品", "工程", "客户", "来料"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={()=>{ if(page === 1) fetchData(); else setPage(1); }}>查询</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table min-w-[2500px] text-xs">
          <thead>
            <tr>
              <th className="w-10 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <input type="checkbox" checked={selectedIds.length === data.length && data.length > 0} onChange={toggleSelectAll} />
              </th>
              <th className="sticky left-10 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">序号</th>
              <th>创建用户</th>
              <th>创建时间</th>
              <th>月份</th>
              <th>周期</th>
              <th>客户等级</th>
              <th>投诉时间</th>
              <th>客户代码</th>
              <th>产品型号</th>
              <th>问题来源</th>
              <th>生产部门</th>
              <th>订单数量</th>
              <th>投诉数量</th>
              <th>问题性质</th>
              <th>QA检验员</th>
              <th>不良SN</th>
              <th>投诉描述</th>
              <th>不良图片</th>
              <th>计入指标</th>
              <th>严重等级</th>
              <th>问题小类</th>
              <th>原因简述</th>
              <th>改善措施</th>
              <th>责任人</th>
              <th>责任线长</th>
              <th>责任主管</th>
              <th>责任部门</th>
              <th>备注</th>
              <th>状态</th>
              <th className="sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((i, index) => (
              <tr key={i.id}>
                <td className="sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => toggleSelect(i.id)} />
                </td>
                <td className="sticky left-10 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{(page - 1) * size + index + 1}</td>
                <td>{i.createdBy}</td>
                <td>{i.createdAt ? i.createdAt.replace("T", " ").split(".")[0] : ""}</td>
                <td>{i.month}</td>
                <td>{i.cycle?.replace(/^wk0/, 'wk')}</td>
                <td>{i.customerGrade}</td>
                <td>{i.complaintTime ? i.complaintTime.replace("T", " ").split(".")[0] + (i.complaintTime.length <= 16 ? ":00" : "") : ""}</td>
                <td>{i.customerCode}</td>
                <td>{i.productModel}</td>
                <td>{i.problemSource}</td>
                <td>{i.productionDept}</td>
                <td>{i.orderQty}</td>
                <td>{i.complaintQty}</td>
                <td>{i.problemNature}</td>
                <td>{i.inspector}</td>
                <td>{i.defectSn}</td>
                <td title={i.complaintDescription} className="max-w-[200px] truncate">{i.complaintDescription}</td>
                <td>
                  {i.defectPictures ? (
                    <div className="flex gap-1 overflow-x-auto max-w-[100px]">
                      {i.defectPictures.split(",").map((url, idx) => (
                        <img 
                          key={idx} 
                          src={resolveImageUrl(url)} 
                          className="w-8 h-8 object-cover cursor-pointer rounded border" 
                          onClick={() => window.open(resolveImageUrl(url), "_blank")}
                          alt="不良图片"
                        />
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td>{i.isIncludedInIndicators}</td>
                <td>{severityLabel(i.severityLevel)}</td>
                <td>{i.problemSubtype}</td>
                <td title={i.rootCause} className="max-w-[200px] truncate">{i.rootCause}</td>
                <td title={i.improvementMeasures} className="max-w-[200px] truncate">{i.improvementMeasures}</td>
                <td>{i.owner}</td>
                <td>{i.lineLeader}</td>
                <td>{i.supervisor}</td>
                <td>{i.responsibleDept}</td>
                <td>{i.remark}</td>
                <td>{statusLabel(i.status)}</td>
                <td className="sticky right-0 bg-white z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                  <div className="flex gap-1">
                    {canUpdate && <button className="btn-outline text-blue-600 p-1" onClick={() => openEdit(i)}>编辑</button>}
                    {canDelete && <button className="btn-outline text-red-600 p-1" onClick={()=>remove(i.id)}>删除</button>}
                    <button className="btn-secondary p-1" onClick={()=>openAttachments(i.id)}>附件</button>
                    {canUpdate && <button className="btn-outline p-1" onClick={()=>{ setStatusComplaintId(i.id); setStatusCurrent(i.status || "open"); setStatusTarget(""); setStatusOpen(true); }}>流转</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={complaintOpen}
        title={isEdit ? "编辑客诉问题" : "新增客诉问题"}
        onClose={()=>setComplaintOpen(false)}
        className="modal-fullscreen"
        footer={
          <>
            <button className="btn-primary mr-2" onClick={handleSave}>保存</button>
            <button className="btn-outline" onClick={()=>setComplaintOpen(false)}>取消</button>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">客户等级</label>
            <select className="select" value={form.customerGrade || ""} onChange={e=>setForm({...form, customerGrade: e.target.value})}>
              <option value="">请选择</option>
              <option value="S级">S级</option>
              <option value="A级">A级</option>
              <option value="/">/</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">投诉时间</label>
            <input 
              type="datetime-local" 
              className="input" 
              step="1"
              value={form.complaintTime ? (form.complaintTime.replace(" ", "T").split(".")[0] + (form.complaintTime.length <= 16 ? ":00" : "")).substring(0, 19) : ""} 
              onChange={e=>handleComplaintTimeChange(e.target.value)}
              onBlur={e => {
                if (e.target.value) {
                  // 模拟选中并失去焦点时的行为，这里不需要额外操作，input 已经更新了 form
                }
              }}
            />
          </div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">客户代码</label><input className="input" value={form.customerCode || ""} onChange={e=>setForm({...form, customerCode: e.target.value})} /></div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">产品型号</label><input className="input" value={form.productModel || ""} onChange={e=>setForm({...form, productModel: e.target.value})} /></div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">问题来源</label>
            <select className="select" value={form.problemSource || ""} onChange={e=>setForm({...form, problemSource: e.target.value})}>
              <option value="">请选择</option>
              <option value="市场投诉">市场投诉</option>
              <option value="客户投诉">客户投诉</option>
              <option value="客户反馈">客户反馈</option>
              <option value="OBA">OBA</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">生产部门</label>
            <select className="select" value={form.productionDept || ""} onChange={e=>setForm({...form, productionDept: e.target.value})}>
              <option value="">请选择</option>
              <option value="SMT">SMT</option>
              <option value="DIP">DIP</option>
              <option value="ASSY">ASSY</option>
            </select>
          </div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">订单数量</label><input type="number" className="input" value={form.orderQty || 0} onChange={e=>setForm({...form, orderQty: parseInt(e.target.value || "0")})} /></div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">投诉数量</label><input type="number" className="input" value={form.complaintQty || 0} onChange={e=>setForm({...form, complaintQty: parseInt(e.target.value || "0")})} /></div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">问题性质</label>
            <select className="select" value={form.problemNature || ""} onChange={e=>setForm({...form, problemNature: e.target.value})}>
              <option value="">请选择</option>
              <option value="批量">批量</option>
              <option value="零星">零星</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">QA检验员</label>
            <select className="select" value={form.inspector || ""} onChange={e=>setForm({...form, inspector: e.target.value})}>
              <option value="">请选择</option>
              {qaInspectors.map(u => (
                <option key={u.id} value={u.name || u.username}>{u.name || u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">不良图片</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.defectPictures && form.defectPictures.split(",").map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={resolveImageUrl(url)} className="w-16 h-16 object-cover rounded border" alt="preview" />
                  <button 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">不良SN</label><input className="input" value={form.defectSn || ""} onChange={e=>setForm({...form, defectSn: e.target.value})} /></div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">是否计入指标</label><select className="select" value={form.isIncludedInIndicators || "是"} onChange={e=>setForm({...form, isIncludedInIndicators: e.target.value})}><option value="是">是</option><option value="否">否</option></select></div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">严重等级</label>
            <select className="select" value={form.severityLevel || "一般"} onChange={e=>setForm({...form, severityLevel: e.target.value})}>
              <option value="严重">严重</option>
              <option value="一般">一般</option>
              <option value="轻微">轻微</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">问题小类</label>
            <select className="select" value={form.problemSubtype || ""} onChange={e=>setForm({...form, problemSubtype: e.target.value})}>
              <option value="">请选择</option>
              {["螺钉未打紧", "螺钉打花", "滑牙", "螺钉打歪", "错漏装", "装配位置错误", "反向", "接线不良", "标签不良", "浮高", "金属异物", "非金属异物", "划伤", "段差", "撞件", "破损", "弯针", "掉漆", "色差", "立碑", "漏焊", "虚焊", "拉尖", "针孔", "堆锡", "锡珠、锡渣", "偏位", "连锡", "冷焊", "连锡 / 桥接", "变形", "不出脚", "焊盘脱落", "锡桥"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">责任人</label><input className="input" value={form.owner || ""} onChange={e=>setForm({...form, owner: e.target.value})} /></div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">责任线长</label><input className="input" value={form.lineLeader || ""} onChange={e=>setForm({...form, lineLeader: e.target.value})} /></div>
          <div className="flex flex-col"><label className="text-sm font-medium text-gray-700 mb-1">责任主管</label><input className="input" value={form.supervisor || ""} onChange={e=>setForm({...form, supervisor: e.target.value})} /></div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">责任部门</label>
            <select className="select" value={form.responsibleDept || ""} onChange={e=>setForm({...form, responsibleDept: e.target.value})}>
              <option value="">请选择</option>
              {["SMT", "DIP", "ASSY", "样品", "工程", "客户", "来料"].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col col-span-2"><label className="text-sm font-medium text-gray-700 mb-1">备注</label><input className="input" value={form.remark || ""} onChange={e=>setForm({...form, remark: e.target.value})} /></div>
          
          <div className="flex flex-col col-span-4"><label className="text-sm font-medium text-gray-700 mb-1">投诉问题描述</label><textarea className="input" rows={2} value={form.complaintDescription || ""} onChange={e=>setForm({...form, complaintDescription: e.target.value})} /></div>
          <div className="flex flex-col col-span-4"><label className="text-sm font-medium text-gray-700 mb-1">原因(简述)</label><textarea className="input" rows={2} value={form.rootCause || ""} onChange={e=>setForm({...form, rootCause: e.target.value})} /></div>
          <div className="flex flex-col col-span-4"><label className="text-sm font-medium text-gray-700 mb-1">改善措施</label><textarea className="input" rows={2} value={form.improvementMeasures || ""} onChange={e=>setForm({...form, improvementMeasures: e.target.value})} /></div>
        </div>
      </Modal>

      <Modal
        open={statusOpen}
        title="客诉流转"
        onClose={()=>setStatusOpen(false)}
        footer={
          <>
            <button className="btn-primary mr-2" onClick={async ()=>{ 
              if(!statusComplaintId || !statusTarget) return; 
              await request.post(`/complaint-workflow/transition`, null, { params: { id: statusComplaintId, targetStatus: statusTarget } }); 
              setStatusOpen(false); 
              setStatusTarget(""); 
              fetchData(); 
            }}>执行</button>
            <button className="btn-outline" onClick={()=>setStatusOpen(false)}>取消</button>
          </>
        }
      >
        <div className="space-y-2">
          <select className="select w-full" value={statusTarget} onChange={e=>setStatusTarget(e.target.value)}>
            <option value="">选择流转</option>
            {nexts(statusCurrent || "open").map(s=> <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <div className="text-sm text-gray-600">选择目标状态后点击“执行”完成流转</div>
        </div>
      </Modal>

      <Modal
        open={attachmentsOpen}
        title={currentComplaintId ? `客诉 ${currentComplaintId} 的附件` : "附件"}
        onClose={()=>setAttachmentsOpen(false)}
        footer={<button className="btn-outline" onClick={()=>setAttachmentsOpen(false)}>关闭</button>}
      >
        <input type="file" ref={fileRef} className="mb-2 input" />
        <button className="btn-primary ml-2" onClick={uploadAttachment}>上传</button>
        {uploadMsg && <div className="mt-1 text-sm text-gray-700">{uploadMsg}</div>}
        <ul className="list-disc pl-5 mt-2">
          {attachments.map(a => (
            <li key={a.id} className="flex items-center gap-2 mb-1">
              <a className="text-blue-600 underline" href={`${process.env.REACT_APP_API_BASE.replace('/api','')}${a.url}`} target="_blank" rel="noreferrer">{a.filename}</a>
              <button className="text-red-500 text-sm hover:underline" onClick={()=>deleteAttachment(a.id)}>删除</button>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <div className="font-semibold mb-2">跟进记录</div>
          <form onSubmit={async (e)=>{ 
            e.preventDefault(); 
            if(!followNote) return; 
            await createFollowup({ complaintId: currentComplaintId, note: followNote }); 
            setFollowNote(""); 
            const fr = await listFollowups(currentComplaintId); 
            if (fr.code === 200) setFollowups(fr.data.records || []); 
          }}>
            <textarea className="w-full input mb-2" rows={3} value={followNote} onChange={e=>setFollowNote(e.target.value)} />
            <button className="btn-secondary">新增跟进</button>
          </form>
          <ul className="list-disc pl-5 mt-2">
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
        <button 
          className="btn-outline" 
          disabled={page <= 1}
          onClick={()=>setPage(p=>Math.max(1, p-1))}
        >
          上一页
        </button>
        <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total/size))} 页</span>
        <button 
          className="btn-outline" 
          disabled={page >= Math.ceil(total/size)}
          onClick={()=>setPage(p=>p+1)}
        >
          下一页
        </button>

        <div className="flex items-center gap-1 ml-4">
          <span className="text-sm text-gray-600">跳至</span>
          <input 
            type="text" 
            className="input w-12 text-center py-1 px-1" 
            value={jumpPage} 
            onChange={e => setJumpPage(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const p = parseInt(jumpPage, 10);
                const maxPage = Math.ceil(total/size);
                if (p >= 1 && p <= maxPage) {
                  setPage(p);
                  setJumpPage("");
                } else {
                  alert(`请输入 1 到 ${maxPage} 之间的页码`);
                }
              }
            }}
          />
          <span className="text-sm text-gray-600">页</span>
          <button 
            className="btn-secondary py-1 px-3 text-sm"
            onClick={() => {
              const p = parseInt(jumpPage, 10);
              const maxPage = Math.ceil(total/size);
              if (p >= 1 && p <= maxPage) {
                setPage(p);
                setJumpPage("");
              } else {
                alert(`请输入 1 到 ${maxPage} 之间的页码`);
              }
            }}
          >
            跳转
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintExport() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [productModel, setProductModel] = useState("");
  const [status, setStatus] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const doExport = async (type) => {
    if (type === "csv") {
      const params = new URLSearchParams();
      if (customerCode) params.set("customerCode", customerCode);
      if (productModel) params.set("productModel", productModel);
      if (status) params.set("status", status);
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      params.set("token", getToken() || "");
      const url = `${process.env.REACT_APP_API_BASE}/export/complaints.${type}?${params.toString()}`;
      window.open(url);
    } else if (type === "xlsx") {
      setMsg("正在准备导出 Excel (包含图片)，请稍候...");
      try {
        const ExcelJS = await loadExcelJS();
        
        // 获取所有符合条件的记录
        const res = await listComplaints({
          page: 1,
          size: 1000, // 假设最大1000条
          customerCode,
          productModel,
          status,
          start,
          end
        });
        
        const allRecords = res.data.records || [];
        if (allRecords.length === 0) {
          alert("没有可导出的数据");
          setMsg("");
          return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("客诉问题明细");

        const columns = [
          { header: "ID", key: "id", width: 10 },
          { header: "月份", key: "month", width: 10 },
          { header: "周期", key: "cycle", width: 10 },
          { header: "客户等级", key: "customerGrade", width: 12 },
          { header: "投诉时间", key: "complaintTime", width: 20 },
          { header: "客户代码", key: "customerCode", width: 15 },
          { header: "产品型号", key: "productModel", width: 20 },
          { header: "问题来源", key: "problemSource", width: 15 },
          { header: "生产部门", key: "productionDept", width: 15 },
          { header: "订单数量", key: "orderQty", width: 12 },
          { header: "投诉数量", key: "complaintQty", width: 12 },
          { header: "问题性质", key: "problemNature", width: 15 },
          { header: "QA检验员", key: "inspector", width: 12 },
          { header: "不良SN", key: "defectSn", width: 20 },
          { header: "投诉描述", key: "complaintDescription", width: 30 },
          { header: "不良图片", key: "defectPictures", width: 40 },
          { header: "计入指标", key: "isIncludedInIndicators", width: 12 },
          { header: "严重等级", key: "severityLevel", width: 12 },
          { header: "问题小类", key: "problemSubtype", width: 15 },
          { header: "原因简述", key: "rootCause", width: 30 },
          { header: "改善措施", key: "improvementMeasures", width: 30 },
          { header: "责任人", key: "owner", width: 12 },
          { header: "责任线长", key: "lineLeader", width: 12 },
          { header: "责任主管", key: "supervisor", width: 12 },
          { header: "责任部门", key: "responsibleDept", width: 15 },
          { header: "备注", key: "remark", width: 20 },
          { header: "状态", key: "status", width: 10 }
        ];

        worksheet.columns = columns;

        for (const i of allRecords) {
          const rowData = {
            ...i,
            complaintTime: i.complaintTime ? i.complaintTime.replace("T", " ").split(".")[0] + (i.complaintTime.length <= 16 ? ":00" : "") : "",
            cycle: i.cycle?.replace(/^wk0/, 'wk')
          };
          const row = worksheet.addRow(rowData);
          row.height = 60; // 设置默认行高

          if (i.defectPictures) {
            const imgList = i.defectPictures.split(',').filter(Boolean);
            for (let j = 0; j < imgList.length; j++) {
              const imgUrl = imgList[j].trim();
              const base64 = await imageToBase64(imgUrl);
              if (base64) {
                try {
                  const extension = imgUrl.split('.').pop().toLowerCase() || 'png';
                  const imageId = workbook.addImage({
                    base64: base64,
                    extension: extension === 'jpg' ? 'jpeg' : extension,
                  });
                  
                  const colIndex = columns.findIndex(c => c.key === "defectPictures");
                  worksheet.addImage(imageId, {
                    tl: { col: colIndex + (j * 0.3), row: row.number - 0.9 },
                    ext: { width: 50, height: 50 },
                    editAs: 'oneCell'
                  });
                } catch (imgErr) {
                  console.error("Failed to add image to excel:", imgErr);
                }
              }
            }
          }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `客诉问题报表-${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setMsg("导出成功");
        setTimeout(() => setMsg(""), 3000);
      } catch (err) {
        console.error("Excel Export failed:", err);
        setMsg("导出失败，请重试");
      }
    }
    setShow(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        {msg && <span className="text-xs text-blue-600 animate-pulse whitespace-nowrap">{msg}</span>}
        <button className="btn-secondary" onClick={() => setShow(!show)}>
          导出数据
        </button>
      </div>

      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)}></div>
          <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-xl z-50 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">导出客诉数据</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShow(false)}>×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">客户代码筛选</label>
                <input className="input" value={customerCode} onChange={e => setCustomerCode(e.target.value)} placeholder="客户代码" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">产品型号筛选</label>
                <input className="input" value={productModel} onChange={e => setProductModel(e.target.value)} placeholder="产品型号" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">状态筛选</label>
                <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="">所有状态</option>
                  <option value="open">open</option>
                  <option value="on-going">on-going</option>
                  <option value="closed">closed</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">开始日期</label>
                <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">结束日期</label>
                <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => doExport('csv')}>导出 CSV</button>
              <button className="btn-primary flex-1" onClick={() => doExport('xlsx')}>导出 XLSX</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
