import { useEffect, useState, useRef } from "react";
import {
  listConformanceFullRecords,
  listConformanceLines,
} from "../services/conformanceService";
import { listUsersByRole } from "../services/api";
import Modal from "../components/Modal";
import { getUser } from "../utils/storage";
import { useNavigate, useLocation } from "react-router-dom";

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

const resolveFileUrl = (u) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) {
    if (u.includes("/files/")) return u;
    return u;
  }
  
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

const imageToBase64 = async (url) => {
  if (!url) return null;
  try {
    const fullUrl = resolveFileUrl(url);
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

const ISSUE_SUBTYPES = [
  "螺钉未打紧", "螺钉打花", "滑牙", "螺钉打歪", "错漏装", "装配位置错误", "反向", "接线不良", "标签不良",
  "浮高",
  "金属异物", "非金属异物", "划伤", "段差", "撞件", "破损", "弯针", "掉漆", "色差", "立碑", "漏焊",
  "虚焊", "拉尖", "针孔", "堆锡", "锡珠、锡渣", "偏位", "连锡", "冷焊", "连锡 / 桥接", "变形", "不出脚",
  "焊盘脱落", "锡桥"
];
const ISSUE_TYPES = ["操作不良", "来料不良", "焊接不良", "首件不良", "外观不良"];

export default function AllConformanceRecords() {
  const navigate = useNavigate();
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [jumpPage, setJumpPage] = useState("");
  const [q, setQ] = useState({ 
    startDate: "", 
    endDate: "", 
    qaInspector: "", 
    issueType: "",
    issueSubtype: "", 
    issueNature: "",
    ownerDept: "", 
    owner: "",
    result: "",
    productNo: ""
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [msg, setMsg] = useState("");
  const [qaUsers, setQaUsers] = useState([]);

  const handleJump = () => {
    const p = parseInt(jumpPage);
    const maxPage = Math.ceil(total / pageSize);
    if (p > 0 && p <= maxPage) {
      setPage(p);
      setJumpPage("");
    } else {
      setMsg(`请输入有效的页码 (1-${maxPage})`);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const fetchRecordsWith = async (nextQ, nextPage = page, nextSize = pageSize) => {
    setLoading(true);
    try {
      const res = await listConformanceFullRecords({
        page: nextPage,
        size: nextSize,
        ...nextQ
      });
      if (res.code === 200) {
        setRecords(res.data.records || []);
        setTotal(res.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  // 统一的获取逻辑
  useEffect(() => {
    // 只有当没有 URL 参数时，才执行基于状态的初始查询
    const params = new URLSearchParams(location.search);
    if (params.toString().length === 0) {
      fetchRecordsWith(q, page, pageSize);
    }
  }, [page, pageSize]);

  // 当下拉框筛选条件变化时，重置页码为1
  // 如果当前页已经是1，则直接触发 fetchRecordsWith
  // 如果当前页不是1，setPage(1) 会触发上面的 useEffect
  useEffect(() => {
    // 只有当没有 URL 参数时，才响应状态变化
    const params = new URLSearchParams(location.search);
    if (params.toString().length === 0) {
      if (page === 1) {
        fetchRecordsWith(q, 1, pageSize);
      } else {
        setPage(1);
      }
    }
  }, [q.qaInspector, q.issueType, q.issueSubtype, q.issueNature, q.ownerDept, q.result, q.startDate, q.endDate, q.productNo, q.owner]);

  useEffect(() => {
    listUsersByRole("ROLE_QA_INSPECTOR").then(res => {
      if (res.code === 200) setQaUsers(res.data?.records || []);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.toString().length === 0) return;
    
    // 关键修复：基于初始状态重置，防止旧参数残留
    const nextQ = { 
      startDate: params.get("startDate") || "", 
      endDate: params.get("endDate") || "", 
      qaInspector: params.get("qaInspector") || "", 
      issueType: params.get("issueType") || "",
      issueSubtype: params.get("issueSubtype") || "", 
      issueNature: params.get("issueNature") || "",
      ownerDept: params.get("ownerDept") || "", 
      owner: params.get("owner") || "",
      result: params.get("result") || "",
      productNo: params.get("productNo") || ""
    };
    
    setQ(nextQ);
    
    // 强制触发一次查询，不管当前页码
    fetchRecordsWith(nextQ, 1, pageSize);
    if (page !== 1) setPage(1);
  }, [location.search]);

  const handleSearch = () => {
    setPage(1);
    fetchRecordsWith(q, 1, pageSize);
  };

  const handleReset = () => {
    setQ({ 
      startDate: "", 
      endDate: "", 
      qaInspector: "", 
      issueType: "",
      issueSubtype: "", 
      issueNature: "",
      ownerDept: "", 
      owner: "",
      result: "",
      productNo: ""
    });
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length && records.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  const fetchAllFiltered = async () => {
    const size = 1000;
    let pageIndex = 1;
    let all = [];
    let totalCount = 0;
    while (true) {
      const res = await listConformanceFullRecords({ page: pageIndex, size, ...q });
      const pageRecords = res.data?.records || [];
      totalCount = res.data?.total || totalCount;
      all = all.concat(pageRecords);
      if (pageRecords.length === 0 || (totalCount && all.length >= totalCount)) break;
      pageIndex += 1;
    }
    return all;
  };

  const selectAllFiltered = async () => {
    setMsg("正在获取所有筛选结果的 ID...");
    try {
      const allRecords = await fetchAllFiltered();
      const allIds = allRecords.map(r => r.id);
      setSelectedIds(allIds);
      setMsg(`已选择全部 ${allIds.length} 条筛选结果`);
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg("获取失败");
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const exportExcel = async () => {
    setMsg("正在准备导出 Excel (包含图片)，请稍候...");
    try {
      const ExcelJS = await loadExcelJS();
      
      let allRecords = [];
      if (selectedIds.length > 0) {
        const allFiltered = await fetchAllFiltered();
        allRecords = allFiltered.filter(r => selectedIds.includes(r.id));
      } else {
        allRecords = await fetchAllFiltered();
      }

      if (allRecords.length === 0) {
        setMsg("没有可导出的数据");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("全部检验SN记录");

      const columns = [
        { header: "序号", key: "seq", width: 8 },
        { header: "报告编号", key: "reportNo", width: 20 },
        { header: "产品SN", key: "productSn", width: 25 },
        { header: "检验日期", key: "inspectedAt", width: 20 },
        { header: "结果", key: "result", width: 10 },
        { header: "QA检验员", key: "qaInspector", width: 12 },
        { header: "问题类型", key: "issueType", width: 12 },
        { header: "问题小类", key: "issueSubtype", width: 15 },
        { header: "问题性质", key: "issueNature", width: 12 },
        { header: "责任人", key: "owner", width: 12 },
        { header: "责任部门", key: "ownerDept", width: 15 },
        { header: "不良描述", key: "defectDesc", width: 30 },
        { header: "原因分析", key: "rootCause", width: 30 },
        { header: "改善对策", key: "action", width: 30 },
        { header: "订单号", key: "orderNo", width: 15 },
        { header: "产品编号", key: "productNo", width: 15 },
        { header: "检验日期(头)", key: "headerInspectionDate", width: 20 },
        { header: "送检区域", key: "lineName", width: 20 },
        { header: "生产线体", key: "productionLine", width: 20 },
        { header: "班次", key: "workShift", width: 12 },
        { header: "客户编码", key: "customerCode", width: 15 },
        { header: "送检数量", key: "sendQty", width: 12 },
        { header: "抽样数量", key: "sampleQty", width: 12 },
        { header: "生产总检", key: "checker", width: 12 },
        { header: "固件版本", key: "firmwareVersion", width: 20 },
        { header: "三防漆厚度", key: "coatingThickness", width: 15 },
        { header: "性能测试值", key: "performanceTest", width: 15 },
        { header: "有无附件", key: "attachInfo", width: 15 },
        { header: "附件编码", key: "attachmentCode", width: 20 },
        { header: "ECN", key: "ecn", width: 15 },
        { header: "变更内容", key: "changeDesc", width: 30 },
        { header: "抽样计划", key: "samplePlan", width: 15 },
        { header: "检验标准", key: "specDesc", width: 30 },
        { header: "检验工具", key: "toolDesc", width: 30 },
        { header: "特殊要求", key: "productSpecialReq", width: 30 },
        { header: "AQL", key: "headerAqlStandard", width: 10 },
        { header: "初检图片", key: "defectImages", width: 30 },
        { header: "复检图片", key: "secondCheckImages", width: 30 }
      ];

      worksheet.columns = columns;
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9EEF5' }
      };

      for (let i = 0; i < allRecords.length; i++) {
        const r = allRecords[i];
        setMsg(`正在处理第 ${i + 1}/${allRecords.length} 条记录...`);
        const row = worksheet.addRow({
          seq: i + 1,
          ...r,
          inspectedAt: r.inspectedAt?.replace('T', ' '),
          lineName: r.headerLineName || r.lineName,
          productionLine: r.headerProductionLine || r.productionLine,
          workShift: r.headerWorkShift || r.workShift,
          customerCode: r.headerCustomerCode || r.customerCode,
          sendQty: r.headerSendQty || r.sendQty,
          sampleQty: r.headerSampleQty || r.sampleQty,
          checker: r.headerChecker || r.checker,
          firmwareVersion: r.headerFirmwareVersion || r.firmwareVersion,
          coatingThickness: r.headerCoatingThickness || r.coatingThickness,
          attachInfo: r.headerAttachInfo || r.attachInfo,
          attachmentCode: r.headerAttachmentCode || r.attachmentCode,
          ecn: r.headerEcn || r.ecn,
          changeDesc: r.headerChangeDesc || r.changeDesc,
          samplePlan: r.headerSamplePlan || r.samplePlan,
          specDesc: r.headerSpecDesc || r.specDesc,
          toolDesc: r.headerToolDesc || r.toolDesc,
          productSpecialReq: r.headerProductSpecialReq || r.productSpecialReq,
          defectImages: "",
          secondCheckImages: ""
        });

        const handleImages = async (imgField, colKey) => {
          const imgData = r[imgField];
          if (!imgData) return;
          const imgList = imgData.split(',').filter(Boolean);
          for (let j = 0; j < imgList.length; j++) {
            const base64 = await imageToBase64(imgList[j]);
            if (base64) {
              try {
                const extension = imgList[j].split('.').pop().toLowerCase() || 'png';
                const imageId = workbook.addImage({
                  base64,
                  extension: extension === 'jpg' ? 'jpeg' : extension,
                });
                const colIndex = columns.findIndex(c => c.key === colKey);
                worksheet.addImage(imageId, {
                  tl: { col: colIndex + (j * 0.2), row: row.number - 0.9 },
                  ext: { width: 50, height: 50 },
                  editAs: 'oneCell'
                });
                row.height = 60;
              } catch (e) { console.error(e); }
            }
          }
        };

        await handleImages("defectImages", "defectImages");
        await handleImages("secondCheckImages", "secondCheckImages");
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `全部检验SN记录-${new Date().getTime()}.xlsx`;
      a.click();
      setMsg("导出成功");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setMsg("导出失败");
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">全部检验SN记录表</h2>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button className="btn-outline text-red-600 border-red-600 hover:bg-red-50" onClick={() => setSelectedIds([])}>取消选择 ({selectedIds.length})</button>
          )}
          <button className="btn-secondary" onClick={selectAllFiltered}>全选所有筛选结果</button>
          <button className="btn-primary" onClick={exportExcel}>
            {selectedIds.length > 0 ? `导出选中记录 (${selectedIds.length})` : "导出全部筛选结果"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">检验开始日期</label>
          <input
            type="date"
            className="input w-full"
            value={q.startDate}
            onChange={(e) => setQ({ ...q, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">检验结束日期</label>
          <input
            type="date"
            className="input w-full"
            value={q.endDate}
            onChange={(e) => setQ({ ...q, endDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">QA检验员</label>
          <select
            className="input w-full"
            value={q.qaInspector}
            onChange={(e) => setQ({ ...q, qaInspector: e.target.value })}
          >
            <option value="">全部</option>
            {qaUsers.map(u => (
              <option key={u.id} value={u.name || u.username}>{u.name || u.username}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">产品编号</label>
          <input
            type="text"
            className="input w-full"
            placeholder="产品编号"
            value={q.productNo}
            onChange={(e) => setQ({ ...q, productNo: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">问题性质</label>
          <select
            className="input w-full"
            value={q.issueNature}
            onChange={(e) => setQ({ ...q, issueNature: e.target.value })}
          >
            <option value="">全部</option>
            <option value="批量问题">批量问题</option>
            <option value="零星问题">零星问题</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">问题类型</label>
          <select
            className="input w-full"
            value={q.issueType}
            onChange={(e) => setQ({ ...q, issueType: e.target.value })}
          >
            <option value="">全部</option>
            {ISSUE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">问题小类</label>
          <select
            className="input w-full"
            value={q.issueSubtype}
            onChange={(e) => setQ({ ...q, issueSubtype: e.target.value })}
          >
            <option value="">全部</option>
            {ISSUE_SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">责任部门</label>
          <select
            className="input w-full"
            value={q.ownerDept}
            onChange={(e) => setQ({ ...q, ownerDept: e.target.value })}
          >
            <option value="">全部</option>
            <option value="SMT">SMT</option>
            <option value="DIP">DIP</option>
            <option value="组装">组装</option>
            <option value="工程部">工程部</option>
            <option value="供应商">供应商</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">责任人</label>
          <input
            type="text"
            className="input w-full"
            value={q.owner}
            onChange={(e) => setQ({ ...q, owner: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">结果</label>
          <select
            className="input w-full"
            value={q.result}
            onChange={(e) => setQ({ ...q, result: e.target.value })}
          >
            <option value="">全部</option>
            <option value="OK">OK</option>
            <option value="NG">NG</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button className="btn-primary" onClick={handleSearch}>查询</button>
        <button className="btn-outline" onClick={handleReset}>重置</button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded text-sm ${msg.includes("失败") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
          {msg}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-60 z-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <table className="table w-full text-xs whitespace-nowrap">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="w-10 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <input
                  type="checkbox"
                  checked={records.length > 0 && selectedIds.length === records.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="sticky left-10 bg-gray-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">序号</th>
              <th>报告编号</th>
              <th>产品SN</th>
              <th>检验日期</th>
              <th>结果</th>
              <th>QA检验员</th>
              <th>问题类型</th>
              <th>问题小类</th>
              <th>问题性质</th>
              <th>责任人</th>
              <th>责任部门</th>
              <th>不良描述</th>
              <th>订单号</th>
              <th>产品编号</th>
              <th>检验日期(头)</th>
              <th>送检区域</th>
              <th>生产线体</th>
              <th>班次</th>
              <th>客户编码</th>
              <th>送检数量</th>
              <th>抽样数量</th>
              <th>生产总检</th>
              <th>固件版本</th>
              <th>三防漆厚度</th>
              <th>性能测试值</th>
              <th>有无附件</th>
              <th>附件编码</th>
              <th>ECN</th>
              <th>变更内容</th>
              <th>抽样计划</th>
              <th>检验标准</th>
              <th>检验工具</th>
              <th>特殊要求</th>
              <th>AQL</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, index) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                  />
                </td>
                <td className="sticky left-10 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{(page - 1) * pageSize + index + 1}</td>
                <td className="font-mono">{r.reportNo}</td>
                <td className="font-mono">{r.productSn}</td>
                <td>{r.inspectedAt?.replace('T', ' ')}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.result === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.result}
                  </span>
                </td>
                <td>{r.qaInspector}</td>
                <td>{r.issueType || '-'}</td>
                <td>{r.issueSubtype || '-'}</td>
                <td>{r.issueNature || '-'}</td>
                <td>{r.owner || '-'}</td>
                <td>{r.ownerDept || '-'}</td>
                <td className="max-w-[200px] truncate" title={r.defectDesc}>{r.defectDesc || '-'}</td>
                <td>{r.orderNo}</td>
                <td>{r.productNo}</td>
                <td>{r.headerInspectionDate || '-'}</td>
                <td>{r.headerLineName || r.lineName || '-'}</td>
                <td>{r.headerProductionLine || r.productionLine || '-'}</td>
                <td>{r.headerWorkShift || r.workShift || '-'}</td>
                <td>{r.headerCustomerCode || r.customerCode || '-'}</td>
                <td>{r.headerSendQty || r.sendQty || '-'}</td>
                <td>{r.headerSampleQty || r.sampleQty || '-'}</td>
                <td>{r.headerChecker || r.checker || '-'}</td>
                <td>{r.headerFirmwareVersion || r.firmwareVersion || '-'}</td>
                <td>{r.headerCoatingThickness || r.coatingThickness || '-'}</td>
                <td>{r.performanceTest || '-'}</td>
                <td>{r.headerAttachInfo || r.attachInfo || '-'}</td>
                <td>{r.headerAttachmentCode || r.attachmentCode || '-'}</td>
                <td>{r.headerEcn || r.ecn || '-'}</td>
                <td>{r.headerChangeDesc || r.changeDesc || '-'}</td>
                <td>{r.headerSamplePlan || r.samplePlan || '-'}</td>
                <td>{r.headerSpecDesc || r.specDesc || '-'}</td>
                <td>{r.headerToolDesc || r.toolDesc || '-'}</td>
                <td>{r.headerProductSpecialReq || r.productSpecialReq || '-'}</td>
                <td>{r.headerAqlStandard || '-'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="34" className="text-center py-8 text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">共 {total} 条记录</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每页显示</span>
            <select 
              className="input py-1 px-2 text-sm" 
              value={pageSize} 
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">条</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn-secondary py-1 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span className="flex items-center px-4 py-1 bg-gray-100 rounded text-sm font-medium">第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页</span>
          <button className="btn-secondary py-1 px-3" disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>下一页</button>
          
          <div className="flex items-center gap-1 ml-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">跳转至</span>
            <input 
              type="number" 
              className="input py-1 px-2 w-16 text-center text-sm" 
              value={jumpPage} 
              onChange={e => setJumpPage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJump()}
              min="1"
              max={Math.ceil(total / pageSize)}
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">页</span>
            <button className="btn-outline py-1 px-2 text-sm" onClick={handleJump}>确定</button>
          </div>
        </div>
      </div>
    </div>
  );
}
