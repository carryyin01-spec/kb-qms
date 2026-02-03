import { useEffect, useState, useRef } from "react";
import {
  listConformanceHeaders,
  saveConformanceHeader,
  deleteConformanceHeader,
  listConformanceLines,
  saveConformanceLine,
  deleteConformanceLine,
  getConformanceStats,
  getConformanceGlobalStats,
  getConformanceHeader,
  findHeaderBySn,
} from "../services/conformanceService";
import Modal from "../components/Modal";
import { getUser } from "../utils/storage";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadFile } from "../services/conformanceService";

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

const apiRoot = process.env.REACT_APP_API_BASE || "";

const resolveFileUrl = (u) => {
  if (!u) return "";
  // 如果已经是完整路径且包含 /files/，则直接返回或修正
  if (/^https?:\/\//i.test(u)) {
    if (u.includes("/files/")) return u;
    // 如果是外部链接则原样返回
    return u;
  }
  
  // 提取路径部分，去掉所有可能的前缀
  let path = u;
  const prefixes = ["/api/files/", "api/files/", "/api/", "api/", "/files/", "files/"];
  for (const p of prefixes) {
    if (path.startsWith(p)) {
      path = path.substring(p.length);
      break;
    }
  }
  if (path.startsWith("/")) path = path.substring(1);

  // 智能解析 baseUrl
  let baseUrl = process.env.REACT_APP_API_BASE || "";
  
  // 如果 baseUrl 是相对路径或为空，且当前在 3000 端口，自动指向 8080
  if (!baseUrl || baseUrl.startsWith("/")) {
    if (window.location.port === "3000") {
      baseUrl = window.location.origin.replace(":3000", ":8080") + (baseUrl || "/api");
    } else {
      baseUrl = window.location.origin + (baseUrl || "/api");
    }
  }

  if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  if (!baseUrl.endsWith("/api")) baseUrl += "/api";
  
  const finalUrl = `${baseUrl}/files/${path}`;
  console.log("Image Resolution Debug:", { original: u, path, baseUrl, finalUrl });
  return finalUrl;
};

// 辅助函数：将图片 URL 转换为 base64
const imageToBase64 = async (url) => {
  if (!url) return null;
  try {
    const fullUrl = resolveFileUrl(url);
    // 增加 cache: 'no-cache' 避免缓存导致的跨域问题
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

const ISSUE_TYPES = ["操作不良", "来料不良", "焊接不良", "首件不良", "外观不良"];
const ISSUE_SUBTYPES = [
  "螺钉未打紧", "螺钉打花", "滑牙", "螺钉打歪", "错漏装", "装配位置错误", "反向", "接线不良", "标签不良",
  "浮高",
  "金属异物", "非金属异物", "划伤", "段差", "撞件", "破损", "弯针", "掉漆", "色差", "立碑", "漏焊",
  "虚焊", "拉尖", "针孔", "堆锡", "锡珠、锡渣", "偏位", "连锡", "冷焊", "连锡 / 桥接", "变形", "不出脚",
  "焊盘脱落", "锡桥"
];

function MultiSelect({ placeholder, options, value, onChange, className, single = false }) {
  const [open, setOpen] = useState(false);
  const selected = value ? value.split(",").filter(Boolean) : [];
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (single) {
      onChange(option);
      setOpen(false);
      return;
    }
    let next;
    if (selected.includes(option)) {
      next = selected.filter(s => s !== option);
    } else {
      next = [...selected, option];
    }
    onChange(next.join(","));
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className="input min-h-[38px] h-auto flex flex-wrap gap-1 items-center cursor-pointer pr-8 py-1.5"
        onClick={() => setOpen(!open)}
      >
        {selected.length > 0 ? (
          selected.map(s => (
            <span key={s} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
              {s}
            </span>
          ))
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {open && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto p-2">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded">
              <input
                type={single ? "radio" : "checkbox"}
                name={single ? placeholder : undefined}
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                onClick={(e) => e.stopPropagation()}
                className={single ? "text-blue-600 focus:ring-blue-500" : "rounded border-gray-300 text-blue-600 focus:ring-blue-500"}
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Conformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectHandled, setRedirectHandled] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState({ orderNo: "", productNo: "", sn: "", startDate: "", endDate: "" });
  const [headerForm, setHeaderForm] = useState({});
  const [headerOpen, setHeaderOpen] = useState(false);
  const [lines, setLines] = useState([]);
  const [linePage, setLinePage] = useState(1);
  const [lineTotal, setLineTotal] = useState(0);
  const [lineForm, setLineForm] = useState({ result: "OK" });
  const [lineOpen, setLineOpen] = useState(false);
  const [currentHeaderId, setCurrentHeaderId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState({
    dayTotal: 0,
    dayFail: 0,
    dayPassRate: 0,
    weekTotal: 0,
    weekFail: 0,
    weekPassRate: 0,
  });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewHeader, setViewHeader] = useState({});
  const { getRole } = require("../utils/storage");
  const userRole = getRole();
  const snInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scanResultOpen, setScanResultOpen] = useState(false);
  const [scanResultMsg, setScanResultMsg] = useState("");
  const [pendingScan, setPendingScan] = useState(null);

  const view = async (id) => {
    const h = await getConformanceHeader(id);
    if (h.code === 200) setViewHeader(h.data || {});
    setViewOpen(true);
  };

  const [statsPos, setStatsPos] = useState({
    top: 80,
    left: typeof window !== "undefined" ? window.innerWidth - 430 : 800,
  });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const onDragMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      setStatsPos((p) => ({
        top: Math.max(0, p.top + (e.clientY - dragStart.y)),
        left: Math.max(0, p.left + (e.clientX - dragStart.x)),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragStart.x, dragStart.y]);

  const [quickSn, setQuickSn] = useState("");
  const [quickResult, setQuickResult] = useState("OK");
  const [quickDefect, setQuickDefect] = useState("");
  const [quickThickness, setQuickThickness] = useState("");
  const [batchText, setBatchText] = useState("");
  const colKeys = ["productSn", "inspectedAt", "result", "defectDesc", "customerCode", "orderNo", "lineName"];

  const fetchHeaders = async () => {
    if (q.sn && q.sn.trim()) {
      const fr = await findHeaderBySn(q.sn.trim());
      if (fr.code === 200 && fr.data) {
        setHeaders([fr.data]);
        setTotal(1);
      } else {
        setHeaders([]);
        setTotal(0);
      }
    } else {
      const res = await listConformanceHeaders({
        page,
        size: pageSize,
        orderNo: q.orderNo,
        productNo: q.productNo,
        startDate: q.startDate,
        endDate: q.endDate,
      });
      if (res.code === 200) {
        setHeaders(res.data.records || []);
        setTotal(res.data.total || 0);
      }
    }
    const gs = await getConformanceGlobalStats();
    if (gs.code === 200)
      setStats(
        gs.data || {
          dayTotal: 0,
          dayFail: 0,
          dayPassRate: 0,
          weekTotal: 0,
          weekFail: 0,
          weekPassRate: 0,
        }
      );
  };

  useEffect(() => {
    fetchHeaders();
  }, [page, pageSize]);

  useEffect(() => {
    if (!redirectHandled) {
      const state = location.state || {};
      if (state.openForOrder) {
        const h = headers.find((x) => x.orderNo === state.openForOrder);
        if (h && h.id) {
          openLines(h.id);
          setRedirectHandled(true);
        }
      }
    }
  }, [headers, redirectHandled, location.state]);

  const lineOptions = {
    "SMT": ["SMT1线", "SMT2线", "SMT3线", "SMT4线"],
    "DIP": ["DIP1线", "DIP2线", "DIP3线", "DIP4线"]
  };

  const handleLineNameChange = (e) => {
    const newLineName = e.target.value;
    setHeaderForm({
      ...headerForm,
      lineName: newLineName,
      productionLine: "" // 重置生产线体
    });
  };

  const openHeader = (h) => {
    // Only allow edit if creating new or if user is admin
    if (h && h.id) {
      const role = getRole();
      if (role !== "admin" && role !== "ROLE_ADMIN" && role !== "系统管理员") {
        setMsg("只有系统管理员才有编辑权限");
        return;
      }
    }
    if (h) setHeaderForm(h);
    else
      setHeaderForm({
        inspectionDate: new Date().toISOString().slice(0, 10),
        qaInspector: getUser() || "",
        lineName: "",
        productionLine: "",
        attachInfo: "",
        attachmentCode: "",
        ecn: "",
        changeDesc: "",
        customerCode: "",
        sendQty: 0,
        workShift: "",
        sampleQty: 0,
        reportNo: "",
        orderNo: "",
        productNo: "",
        checker: "",
        firmwareVersion: "",
        coatingThickness: "",
        samplePlan: "GB/T2828.1-2012",
        productSpecialReq: "N/A",
        specDesc: "IPC-A-610 Class 2",
        toolDesc: ""
      });
    setHeaderOpen(true);
  };

  const handleDeleteHeader = async (id) => {
    if (!window.confirm("确定要删除该检验单及其所有明细吗？此操作不可撤销。")) return;
    try {
      const res = await deleteConformanceHeader(id);
      if (res.code === 200) {
        alert("删除成功");
        fetchHeaders();
      } else {
        alert("删除失败: " + res.message);
      }
    } catch (error) {
      console.error(error);
      alert("删除时发生错误");
    }
  };

  const handleDeleteLine = async (id) => {
    if (!window.confirm("确定要删除该行记录吗？")) return;
    try {
      const res = await deleteConformanceLine(id);
      if (res.code === 200) {
        alert("删除成功");
        openLines(currentHeaderId); // 刷新明细列表
      } else {
        alert("删除失败: " + res.message);
      }
    } catch (error) {
      console.error(error);
      alert("删除时发生错误");
    }
  };

  const saveHeader = async () => {
    // 验证必填字段
    const errors = [];
    if (!headerForm.workShift) errors.push("班次");
    if (!headerForm.lineName) errors.push("送检区域");
    if (!headerForm.productionLine) errors.push("生产线体");
    if (!headerForm.productNo) errors.push("产品编号");
    if (!headerForm.customerCode) errors.push("客户编码");
    if (!headerForm.orderNo) errors.push("订单编号");
    
    if (errors.length > 0) {
      alert(`以下字段为必填：\n${errors.join("、")}`);
      return;
    }
    
    const payload = { ...headerForm };
    if (!payload.qaInspector) payload.qaInspector = getUser() || "";
    await saveConformanceHeader(payload);
    setHeaderOpen(false);
    setHeaderForm({});
    setPage(1);
    fetchHeaders();
    alert("符合性检验单已保存");
  };

  const openLines = async (headerId) => {
    setCurrentHeaderId(headerId);
    const res = await listConformanceLines({
      page: linePage,
      size: 10,
      headerId,
    });
    if (res.code === 200) {
      setLines(res.data.records || []);
      setLineTotal(res.data.total || 0);
    }
    const st = await getConformanceStats(headerId);
    if (st.code === 200)
      setStats(
        st.data || {
          dayTotal: 0,
          dayFail: 0,
          dayPassRate: 0,
          weekTotal: 0,
          weekFail: 0,
          weekPassRate: 0,
        }
      );
    setLineOpen(true);
  };

  const saveLine = async () => {
    if (!currentHeaderId) return;
    const payload = {
      ...lineForm,
      headerId: currentHeaderId,
      // Inject defaults if missing
      productionLine: lineForm.productionLine || headerForm.productionLine || "",
      workShift: lineForm.workShift || headerForm.workShift || "",
      productNo: lineForm.productNo || headerForm.productNo || "",
      customerCode: lineForm.customerCode || headerForm.customerCode || "",
      sendQty: lineForm.sendQty ?? headerForm.sendQty ?? 0,
      sampleQty: lineForm.sampleQty ?? headerForm.sampleQty ?? 0,
      qaInspector: lineForm.qaInspector || headerForm.qaInspector || "",
      checker: lineForm.checker || headerForm.checker || "",
      orderNo: lineForm.orderNo || headerForm.orderNo || "",
      firmwareVersion: lineForm.firmwareVersion || headerForm.firmwareVersion || "",
      coatingThickness: lineForm.coatingThickness || headerForm.coatingThickness || "",
      attachInfo: lineForm.attachInfo || headerForm.attachInfo || "",
      attachmentCode: lineForm.attachmentCode || headerForm.attachmentCode || "",
      ecn: lineForm.ecn || headerForm.ecn || "",
      changeDesc: lineForm.changeDesc || headerForm.changeDesc || "",
      samplePlan: lineForm.samplePlan || headerForm.samplePlan || "",
      specDesc: lineForm.specDesc || headerForm.specDesc || "",
      toolDesc: lineForm.toolDesc || headerForm.toolDesc || "",
      productSpecialReq: lineForm.productSpecialReq || headerForm.productSpecialReq || "",
    };
    await saveConformanceLine(payload);
    setLineForm({ result: "OK" });
    setLinePage(1);
    openLines(currentHeaderId);
  };

  const quickAdd = async () => {
    if (!currentHeaderId || !quickSn) return;
    // 保留秒
    const now = new Date().toISOString().slice(0, 19);
    const payload = {
      headerId: currentHeaderId,
      productSn: quickSn,
      inspectedAt: now,
      lineName: headerForm.lineName || "",
      productionLine: headerForm.productionLine || "",
      workShift: headerForm.workShift || "",
      productNo: headerForm.productNo || "",
      customerCode: headerForm.customerCode || "",
      sendQty: headerForm.sendQty || 0,
      sampleQty: headerForm.sampleQty || 0,
      qaInspector: headerForm.qaInspector || "",
      checker: headerForm.checker || "",
      orderNo: headerForm.orderNo || "",
      firmwareVersion: headerForm.firmwareVersion || "",
      coatingThickness: quickThickness || headerForm.coatingThickness || "",
      attachInfo: headerForm.attachInfo || "",
      attachmentCode: headerForm.attachmentCode || "",
      ecn: headerForm.ecn || "",
      changeDesc: headerForm.changeDesc || "",
      samplePlan: headerForm.samplePlan || "",
      specDesc: headerForm.specDesc || "",
      toolDesc: headerForm.toolDesc || "",
      productSpecialReq: headerForm.productSpecialReq || "",
      defectDesc: quickResult === "NG" ? quickDefect || "" : "",
      result: quickResult,
    };
    setPendingScan(payload);
    setScanResultMsg(`确认录入 SN: ${payload.productSn}，结果：${payload.result}${payload.result === "NG" ? `，不良：${payload.defectDesc || "-"}` : ""}`);
    setScanResultOpen(true);
  };
  const confirmScanSave = async () => {
    if (!pendingScan) return;
    await saveConformanceLine(pendingScan);
    setScanResultOpen(false);
    setPendingScan(null);
    setQuickSn("");
    setQuickDefect("");
    openLines(currentHeaderId);
    if (snInputRef && snInputRef.current) snInputRef.current.focus();
  };
  const cancelScan = () => {
    setScanResultOpen(false);
    setPendingScan(null);
    if (snInputRef && snInputRef.current) snInputRef.current.focus();
  };

  const [ngSn, setNgSn] = useState("");
  const [ngOpen, setNgOpen] = useState(false);
  const [ngForm, setNgForm] = useState({
    defectDesc: "",
    issueType: "",
    issueSubtype: "",
    coatingThickness: "",
    owner: "",
    ownerManager: "",
    ownerDept: "",
    rootCause: "",
    action: "",
    remark: "",
  });

  const openNg = () => {
    if (!currentHeaderId || !ngSn) return;
    setNgOpen(true);
  };

  const saveNg = async () => {
    if (!currentHeaderId || !ngSn) return;
    // 保留秒
    const now = new Date().toISOString().slice(0, 19);
    const payload = {
      headerId: currentHeaderId,
      productSn: ngSn,
      inspectedAt: now,
      lineName: headerForm.lineName || "",
      productionLine: headerForm.productionLine || "",
      workShift: headerForm.workShift || "",
      productNo: headerForm.productNo || "",
      customerCode: headerForm.customerCode || "",
      sendQty: headerForm.sendQty || 0,
      sampleQty: headerForm.sampleQty || 0,
      qaInspector: headerForm.qaInspector || "",
      checker: headerForm.checker || "",
      orderNo: headerForm.orderNo || "",
      firmwareVersion: headerForm.firmwareVersion || "",
      coatingThickness: ngForm.coatingThickness || "",
      attachInfo: headerForm.attachInfo || "",
      attachmentCode: headerForm.attachmentCode || "",
      ecn: headerForm.ecn || "",
      changeDesc: headerForm.changeDesc || "",
      samplePlan: headerForm.samplePlan || "",
      specDesc: headerForm.specDesc || "",
      toolDesc: headerForm.toolDesc || "",
      productSpecialReq: headerForm.productSpecialReq || "",
      result: "NG",
      ...ngForm,
    };
    await saveConformanceLine(payload);
    setNgOpen(false);
    setNgSn("");
    setNgForm({
      defectDesc: "",
      issueType: "",
      issueSubtype: "",
      coatingThickness: "",
      owner: "",
      ownerManager: "",
      ownerDept: "",
      rootCause: "",
    action: "",
    remark: "",
    defectImages: "",
  });
    openLines(currentHeaderId);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        // 关键修复：从 res.data 中提取 url 字符串
        const url = typeof res.data === 'string' ? res.data : res.data.url;
        const currentImages = ngForm.defectImages ? ngForm.defectImages.split(",") : [];
        const nextImages = [...currentImages, url];
        setNgForm({ ...ngForm, defectImages: nextImages.join(",") });
        setMsg("图片上传成功");
      } else {
        setMsg("图片上传失败：" + res.message);
      }
    } catch (err) {
      setMsg("图片上传出错");
    }
  };

  const removeImage = (index) => {
    const currentImages = ngForm.defectImages.split(",");
    currentImages.splice(index, 1);
    setNgForm({ ...ngForm, defectImages: currentImages.join(",") });
  };

  const batchAdd = async () => {
    if (!currentHeaderId || !batchText.trim()) return;
    const sns = batchText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 200);
    for (const sn of sns) {
      const now = new Date().toISOString().slice(0, 16);
      const payload = {
        headerId: currentHeaderId,
        productSn: sn,
        inspectedAt: now,
        lineName: headerForm.lineName || "",
        productionLine: headerForm.productionLine || "",
        workShift: headerForm.workShift || "",
        productNo: headerForm.productNo || "",
        customerCode: headerForm.customerCode || "",
        sendQty: headerForm.sendQty || 0,
        sampleQty: headerForm.sampleQty || 0,
        qaInspector: headerForm.qaInspector || "",
        checker: headerForm.checker || "",
        orderNo: headerForm.orderNo || "",
        firmwareVersion: headerForm.firmwareVersion || "",
        attachInfo: headerForm.attachInfo || "",
        attachmentCode: headerForm.attachmentCode || "",
        ecn: headerForm.ecn || "",
        changeDesc: headerForm.changeDesc || "",
        samplePlan: headerForm.samplePlan || "",
        specDesc: headerForm.specDesc || "",
        toolDesc: headerForm.toolDesc || "",
        productSpecialReq: headerForm.productSpecialReq || "",
        result: "OK",
      };
      await saveConformanceLine(payload);
    }
    setBatchText("");
    openLines(currentHeaderId);
  };

  const exportCsv = () => {
    const rows = [
      [
        "序号",
        "SN",
        "检验时间",
        "结果",
        "不良描述",
        "初检图片",
        "复检图片",
        "客户编码",
        "订单号",
        "作业员/线别",
      ],
    ];
    lines.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.productSn || "",
        l.inspectedAt || "",
        l.result || "",
        l.defectDesc || "",
        l.defectImages || "",
        l.secondCheckImages || "",
        l.customerCode || "",
        l.orderNo || "",
        l.lineName || "",
      ]);
    });
    const csv = rows
      .map((r) =>
        r
          .map((x) => String(x).replace(/\"/g, '""'))
          .map((x) => `"${x}"`)
          .join(",")
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conformance-lines-${currentHeaderId || "temp"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentHeaderId) return;
    const text = await file.text();
    const linesText = text.split(/\r?\n/).filter(Boolean);
    for (let i = 1; i < linesText.length; i++) {
      const cols = linesText[i]
        .split(",")
        .map((s) => s.replace(/^\"|\"$/g, "").replace(/\"\"/g, '"'));
      const payload = {
        headerId: currentHeaderId,
        productSn: cols[1] || "",
        inspectedAt: cols[2] || new Date().toISOString().slice(0, 16),
        result: cols[3] || "OK",
        defectDesc: cols[4] || "",
        customerCode: cols[5] || "",
        orderNo: cols[6] || "",
        lineName: cols[7] || "",
        productionLine: headerForm.productionLine || "",
        workShift: headerForm.workShift || "",
        productNo: headerForm.productNo || "",
        sendQty: headerForm.sendQty || 0,
        sampleQty: headerForm.sampleQty || 0,
        qaInspector: headerForm.qaInspector || "",
        checker: headerForm.checker || "",
        firmwareVersion: headerForm.firmwareVersion || "",
        attachInfo: headerForm.attachInfo || "",
        attachmentCode: headerForm.attachmentCode || "",
        ecn: headerForm.ecn || "",
        changeDesc: headerForm.changeDesc || "",
        samplePlan: headerForm.samplePlan || "",
        specDesc: headerForm.specDesc || "",
        toolDesc: headerForm.toolDesc || "",
        productSpecialReq: headerForm.productSpecialReq || "",
      };
      await saveConformanceLine(payload);
    }
    openLines(currentHeaderId);
    e.target.value = "";
  };

  const onCellKey = (e, ri, ci, line) => {
    if (e.key === "F2") {
      const val = line.result === "OK" ? "NG" : "OK";
      const next = { ...line, result: val };
      updateLine(next);
      e.preventDefault();
    } else if (e.key === "Delete") {
      removeLine(line.id);
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === "Tab") {
      const nti = e.shiftKey ? ci - 1 : ci + 1;
      const el = document.querySelector(`[data-rc="${ri}-${nti}"]`);
      if (el) el.focus();
    }
  };

  const updateLine = async (next) => {
    const arr = lines.map((x) => (x.id === next.id ? next : x));
    setLines(arr);
    await saveConformanceLine(next);
  };

  const removeLine = async (id) => {
    if (!window.confirm("确定要删除该行记录吗？")) return;
    try {
      const res = await deleteConformanceLine(id);
      if (res.code === 200) {
        setMsg("删除成功");
        openLines(currentHeaderId);
      } else {
        setMsg("删除失败: " + res.message);
      }
    } catch (error) {
      console.error(error);
      setMsg("删除时发生错误");
    }
  };

  return (
    <div className="w-full px-4 py-6 space-y-4">
      <div>
        <div className="sheet-title">符合性检验登记记录表</div>
        <div className="sheet-title-en">Conformance Inspection Record</div>
      </div>
      {msg && <div className="text-green-700 mt-1">{msg}</div>}
      <div className="flex flex-wrap gap-2 mb-2 mt-2">
        <input
          className="input min-w-[120px]"
          placeholder="订单号"
          value={q.orderNo}
          onChange={(e) => setQ({ ...q, orderNo: e.target.value })}
        />
        <input
          className="input min-w-[120px]"
          placeholder="产品号"
          value={q.productNo}
          onChange={(e) => setQ({ ...q, productNo: e.target.value })}
        />
        <input
          className="input min-w-[120px]"
          placeholder="SN"
          value={q.sn}
          onChange={(e) => setQ({ ...q, sn: e.target.value })}
        />
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">从</span>
          <input
            type="date"
            className="input"
            value={q.startDate}
            onChange={(e) => setQ({ ...q, startDate: e.target.value })}
          />
          <span className="text-sm text-gray-500">至</span>
          <input
            type="date"
            className="input"
            value={q.endDate}
            onChange={(e) => setQ({ ...q, endDate: e.target.value })}
          />
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setPage(1);
            fetchHeaders();
          }}
        >
          查询
        </button>
        <button className="btn-primary" onClick={() => navigate("/conformance/new")}>
          新增检验单
        </button>
      </div>
      

      {/* 订单列表表格 */}
      <div className="overflow-x-auto w-full">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={headers.length > 0 && selectedIds.length === headers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(headers.map(h => h.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </th>
              <th className="whitespace-nowrap">ID</th>
              <th className="whitespace-nowrap">订单号</th>
              <th className="whitespace-nowrap">客户编码</th>
              <th className="whitespace-nowrap">产品编号</th>
              <th className="whitespace-nowrap">报告编号</th>
              <th className="whitespace-nowrap">检验日期</th>
              <th className="whitespace-nowrap">QA检验员</th>
              <th className="whitespace-nowrap">送检区域</th>
              <th className="whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h) => (
              <tr key={h.id} className={selectedIds.includes(h.id) ? "bg-blue-50" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(h.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, h.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== h.id));
                      }
                    }}
                  />
                </td>
                <td className="whitespace-nowrap">{h.id}</td>
                <td className="whitespace-nowrap">{h.orderNo}</td>
                <td className="whitespace-nowrap">{h.customerCode}</td>
                <td className="whitespace-nowrap">{h.productNo}</td>
                <td className="whitespace-nowrap">{h.reportNo}</td>
                <td className="whitespace-nowrap">{h.inspectionDate}</td>
                <td className="whitespace-nowrap">{h.qaInspector}</td>
                <td className="whitespace-nowrap">{h.lineName}</td>
                <td className="whitespace-nowrap">
                <button className="btn-outline mr-2" onClick={() => view(h.id)}>
                  查看
                </button>
                {(userRole === "admin" || userRole === "ROLE_ADMIN" || userRole === "系统管理员") && (
                  <>
                    <button className="btn-outline mr-2" onClick={() => openHeader(h)}>
                      编辑
                    </button>
                    <button className="btn-outline text-red-600 border-red-600 hover:bg-red-50 mr-2" onClick={() => handleDeleteHeader(h.id)}>
                      删除
                    </button>
                  </>
                )}
                <button
                  className="btn-outline mr-2"
                  onClick={() => navigate(`/conformance/ng-detail/${h.id}`)}
                >
                  查看NG
                </button>
                <button
                  className="btn-secondary mr-2"
                  onClick={() => navigate(`/conformance/detail/${h.id}`)}
                >
                  明细
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/conformance/entry/${h.id}`)}
                >
                  条码录入
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

      {/* 导出Excel按钮 */}
      <div className="mt-4">
        <button
          className="btn-secondary"
          onClick={async () => {
            setMsg("正在准备导出 Excel (包含图片)，请稍候...");
            try {
              const ExcelJS = await loadExcelJS();
              
              let allHeaders = [];
              if (selectedIds.length > 0) {
                allHeaders = headers.filter(h => selectedIds.includes(h.id));
              } else {
                const resHeaders = await listConformanceHeaders({
                  page: 1, size: 100, orderNo: q.orderNo, productNo: q.productNo,
                  startDate: q.startDate, endDate: q.endDate,
                });
                allHeaders = resHeaders.data?.records || [];
              }

              if (allHeaders.length === 0) {
                setMsg("没有可导出的数据");
                return;
              }

              // 定义表头模板
              const columnsTemplate = [
                { header: "报告编号", key: "reportNo", width: 20 },
                { header: "检验日期", key: "inspectionDate", width: 12 },
                { header: "订单号", key: "orderNo", width: 15 },
                { header: "客户编码", key: "customerCode", width: 15 },
                { header: "产品编号", key: "productNo", width: 15 },
                { header: "送检数量", key: "sendQty", width: 10 },
                { header: "抽样数量", key: "sampleQty", width: 10 },
                { header: "QA检验员", key: "qaInspector", width: 12 },
                { header: "生产总检", key: "checker", width: 12 },
                { header: "班次", key: "workShift", width: 10 },
                { header: "送检区域", key: "lineName", width: 12 },
                { header: "生产线体", key: "productionLine", width: 12 },
                { header: "有无附件", key: "attachInfo", width: 10 },
                { header: "附件编码", key: "attachmentCode", width: 15 },
                { header: "ECN/子件ECN", key: "ecn", width: 15 },
                { header: "变更内容", key: "changeDesc", width: 20 },
                { header: "固件版本", key: "firmwareVersion", width: 12 },
                { header: "抽样计划", key: "samplePlan", width: 20 },
                { header: "检验标准", key: "specDesc", width: 20 },
                { header: "检验工具/仪器", key: "toolDesc", width: 20 },
                { header: "产品特殊要求", key: "productSpecialReq", width: 20 },
                { header: "允收水准/AQL", key: "aqlStandard", width: 30 },
                { header: "产品SN", key: "productSn", width: 25 },
                { header: "检验时间", key: "inspectedAt", width: 20 },
                { header: "结果", key: "result", width: 10 },
                { header: "不良描述", key: "defectDesc", width: 30 },
                { header: "问题类型", key: "issueType", width: 15 },
                { header: "问题小类", key: "issueSubtype", width: 15 },
                { header: "责任人", key: "owner", width: 12 },
                { header: "责任人主管", key: "ownerManager", width: 12 },
                { header: "责任部门", key: "ownerDept", width: 15 },
                { header: "原因分析", key: "rootCause", width: 30 },
                { header: "改善对策", key: "action", width: 30 },
                { header: "备注", key: "remark", width: 20 },
                { header: "初检图片", key: "defectImages", width: 30 },
                { header: "复检图片", key: "secondCheckImages", width: 30 }
              ];

              for (let index = 0; index < allHeaders.length; index++) {
                const h = allHeaders[index];
                setMsg(`正在导出第 ${index + 1}/${allHeaders.length} 份: ${h.reportNo}`);
                
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("检验单报告");
                worksheet.columns = columnsTemplate;

                // 样式设置
                worksheet.getRow(1).font = { bold: true };
                worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.getRow(1).fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFE9EEF5' }
                };

                const resLines = await listConformanceLines({ page: 1, size: 5000, headerId: h.id });
                const lines = resLines.data?.records || [];
                
                for (const l of lines) {
                  const rowData = {
                    reportNo: h.reportNo || "",
                    inspectionDate: h.inspectionDate || "",
                    orderNo: h.orderNo || "",
                    customerCode: h.customerCode || "",
                    productNo: h.productNo || "",
                    sendQty: h.sendQty || 0,
                    sampleQty: h.sampleQty || 0,
                    qaInspector: h.qaInspector || "",
                    checker: h.checker || "",
                    workShift: h.workShift || "",
                    lineName: h.lineName || "",
                    productionLine: h.productionLine || "",
                    attachInfo: h.attachInfo || "",
                    attachmentCode: h.attachmentCode || "",
                    ecn: h.ecn || "",
                    changeDesc: h.changeDesc || "",
                    firmwareVersion: h.firmwareVersion || "",
                    samplePlan: h.samplePlan || "",
                    specDesc: h.specDesc || "",
                    toolDesc: h.toolDesc || "",
                    productSpecialReq: h.productSpecialReq || "",
                    aqlStandard: h.aqlStandard || "",
                    productSn: l.productSn || "",
                    inspectedAt: l.inspectedAt || "",
                    result: l.result || "",
                    defectDesc: l.defectDesc || "",
                    issueType: l.issueType || "",
                    issueSubtype: l.issueSubtype || "",
                    owner: l.owner || "",
                    ownerManager: l.ownerManager || "",
                    ownerDept: l.ownerDept || "",
                    rootCause: l.rootCause || "",
                    action: l.action || "",
                    remark: l.remark || "",
                    defectImages: "", 
                    secondCheckImages: ""
                  };
                  const row = worksheet.addRow(rowData);

                  // 处理图片
                  const handleRowImages = async (imgField, colKey) => {
                    const imgData = l[imgField] || h[imgField]; 
                    if (!imgData) return;
                    const imgList = imgData.split(',').filter(Boolean);
                    if (imgList.length === 0) return;
                    
                    for (let i = 0; i < imgList.length; i++) {
                      const imgUrl = imgList[i];
                      const base64 = await imageToBase64(imgUrl);
                      if (base64) {
                        try {
                          const extension = imgUrl.split('.').pop().toLowerCase() || 'png';
                          const imageId = workbook.addImage({
                            base64: base64,
                            extension: extension === 'jpg' ? 'jpeg' : extension,
                          });
                          
                          const colIndex = columnsTemplate.findIndex(c => c.key === colKey);
                          if (colIndex !== -1) {
                            worksheet.addImage(imageId, {
                              tl: { col: colIndex + (i * 0.2), row: row.number - 0.9 },
                              ext: { width: 50, height: 50 },
                              editAs: 'oneCell'
                            });
                            row.height = 60; 
                          }
                        } catch (imgErr) {
                          console.error("Failed to add image to excel:", imgErr);
                        }
                      }
                    }
                  };

                  await handleRowImages("defectImages", "defectImages");
                  await handleRowImages("secondCheckImages", "secondCheckImages");
                }

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `检验单报告-${h.reportNo}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }

              setMsg(`导出成功，共 ${allHeaders.length} 份文件`);
              setTimeout(() => setMsg(""), 3000);
            } catch (err) {
              console.error("Excel Export failed:", err);
              setMsg("导出失败，请重试");
            }
          }}
        >
          导出检验单明细Excel (包含图片)
        </button>
      </div>

      {/* 查看检验单详情模态框 */}
      <Modal
        open={viewOpen}
        title="订单检验信息"
        onClose={() => setViewOpen(false)}
        footer={
          <button className="btn-outline" onClick={() => setViewOpen(false)}>
            关闭
          </button>
        }
      >
        <div className="space-y-4">
          {/* 订单信息部分 - 按照Excel截图样式 */}
          <div>
            <h3 className="text-sm font-bold bg-red-50 px-4 py-2 border-b-2 border-red-600 mb-3">
              订单信息 (Order information)
            </h3>
            <table className="w-full border-collapse text-xs border border-gray-300">
              <thead>
                <tr>
                  <th className="table-header-excel">检验日期</th>
                  <th className="table-header-excel">产品编号</th>
                  <th className="table-header-excel">送检数量</th>
                  <th className="table-header-excel">抽样数量</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-info-cell">{viewHeader.inspectionDate || "-"}</td>
                  <td className="table-info-cell">{viewHeader.productNo || "-"}</td>
                  <td className="table-info-cell">{viewHeader.sendQty ?? "-"}</td>
                  <td className="table-info-cell">{viewHeader.sampleQty ?? "-"}</td>
                </tr>
              </tbody>
              </table>
              <table className="w-full border-collapse text-xs border border-gray-300 mt-4">
              <thead>
                <tr>
                  <th className="table-header-excel">QA检验员</th>
                  <th className="table-header-excel">客户编码</th>
                  <th className="table-header-excel">班次 <span className="text-red-500">*</span></th>
                  <th className="table-header-excel">报告编号</th>
                  <th className="table-header-excel">生产总检</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-info-cell">{viewHeader.qaInspector || "-"}</td>
                  <td className="table-info-cell">{viewHeader.customerCode || "-"}</td>
                  <td className="table-info-cell">{viewHeader.workShift || "-"}</td>
                  <td className="table-info-cell">{viewHeader.reportNo || "-"}</td>
                  <td className="table-info-cell">{viewHeader.orderNo || "-"}</td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse text-xs border border-gray-300 mt-4">
              <thead>
                <tr>
                  <th className="table-header-excel">送检区域</th>
                  <th className="table-header-excel">生产线体</th>
                  <th className="table-header-excel">有无附件</th>
                  <th className="table-header-excel">附件编码</th>
                  <th className="table-header-excel">变更内容</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-info-cell">{viewHeader.lineName || "-"}</td>
                  <td className="table-info-cell">{viewHeader.productionLine || "-"}</td>
                  <td className="table-info-cell">{viewHeader.attachInfo || "-"}</td>
                  <td className="table-info-cell">{viewHeader.attachmentCode || "-"}</td>
                  <td className="table-info-cell">{viewHeader.changeDesc || "-"}</td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse text-xs border border-gray-300 mt-4">
              <thead>
                <tr>
                  <th className="table-header-excel">订单编号</th>
                  <th className="table-header-excel">固件版本</th>
                  <th className="table-header-excel">ECN/子件ECN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-info-cell">{viewHeader.orderNo || "-"}</td>
                  <td className="table-info-cell">{viewHeader.firmwareVersion || "-"}</td>
                  <td className="table-info-cell">{viewHeader.ecn || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 抽样计划及检验标准 */}
          <div>
            <h3 className="text-sm font-bold bg-blue-50 px-4 py-2 border-b-2 border-blue-600 mb-3">
              抽样计划及检验标准 (Sampling plan and inspection standard)
            </h3>
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="table-header-label">抽样计划</td>
                  <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                    {viewHeader.samplePlan || "-"}
                  </td>
                  <td className="table-header-label">产品特殊要求</td>
                  <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                    {viewHeader.productSpecialReq || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="table-header-label">检验标准</td>
                  <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                    {viewHeader.specDesc || "-"}
                  </td>
                  <td className="table-header-label">检验工具/仪器</td>
                  <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                    {viewHeader.toolDesc || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="table-header-label">允收水准/AQL</td>
                  <td colSpan="7" className="table-info-cell whitespace-pre-wrap font-mono text-xs">
                    {viewHeader.aqlStandard || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 编辑检验单模态框 */}
      <Modal
        open={headerOpen}
        title={headerForm.id ? "编辑检验单" : "新增检验单"}
        onClose={() => setHeaderOpen(false)}
        footer={
          <>
            <button className="btn-primary mr-2" onClick={saveHeader}>
              保存
            </button>
            <button className="btn-outline" onClick={() => setHeaderOpen(false)}>
              取消
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 订单信息表格 - 按照Excel截图样式 */}
          <div>
            <h3 className="text-sm font-bold bg-red-50 px-4 py-2 border-b-2 border-red-600 mb-3">
              订单信息 (Order information)
            </h3>
            <table className="w-full border-collapse text-xs border border-gray-300">
              <thead>
                <tr>
                  <th className="table-header-excel">检验日期</th>
                  <th className="table-header-excel">产品编号</th>
                  <th className="table-header-excel">送检数量</th>
                  <th className="table-header-excel">抽样数量</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-input-cell">
                    <input
                      type="date"
                      className="input w-full"
                      value={headerForm.inspectionDate || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          inspectionDate: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.productNo || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          productNo: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="number"
                      className="input w-full"
                      value={headerForm.sendQty ?? ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          sendQty: Number(e.target.value || 0),
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="number"
                      className="input w-full"
                      value={headerForm.sampleQty ?? ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          sampleQty: Number(e.target.value || 0),
                        })
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse text-xs border border-gray-300 mt-4">
              <thead>
                <tr>
                  <th className="table-header-excel">QA检验员</th>
                  <th className="table-header-excel">客户编码</th>
                  <th className="table-header-excel">班次 <span className="text-red-500">*</span></th>
                  <th className="table-header-excel">报告编号</th>
                  <th className="table-header-excel">生产总检</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.qaInspector || ""}
                      readOnly
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.customerCode || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          customerCode: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <select
                      className="input w-full"
                      value={headerForm.workShift || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          workShift: e.target.value,
                        })
                      }
                    >
                      <option value="">请选择</option>
                      <option value="白班">白班</option>
                      <option value="中班">中班</option>
                      <option value="夜班">夜班</option>
                    </select>
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.reportNo || ""}
                      readOnly
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.orderNo || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          orderNo: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse text-xs border border-gray-300 mt-4">
              <thead>
                <tr>
                  <th className="table-header-excel">送检区域</th>
                  <th className="table-header-excel">生产线体</th>
                  <th className="table-header-excel">有无附件</th>
                  <th className="table-header-excel">附件编码</th>
                  <th className="table-header-excel">变更内容</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-input-cell">
                    <select
                      className="input w-full"
                      value={headerForm.lineName || ""}
                      onChange={handleLineNameChange}
                    >
                      <option value="">请选择</option>
                      <option value="SMT">SMT</option>
                      <option value="DIP">DIP</option>
                    </select>
                  </td>
                  <td className="table-input-cell">
                    <select
                      className="input w-full"
                      value={headerForm.productionLine || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          productionLine: e.target.value,
                        })
                      }
                      disabled={!headerForm.lineName}
                    >
                      <option value="">请选择</option>
                      {headerForm.lineName && lineOptions[headerForm.lineName]?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.attachInfo || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          attachInfo: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.attachmentCode || ""}
                      onChange={(e) =>
                        setHeaderForm({ ...headerForm, attachmentCode: e.target.value })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.changeDesc || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          changeDesc: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse text-xs border border-gray-300 mt-4">
              <thead>
                <tr>
                  <th className="table-header-excel">订单编号</th>
                  <th className="table-header-excel">固件版本</th>
                  <th className="table-header-excel">ECN/子件ECN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.orderNo || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          orderNo: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.firmwareVersion || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          firmwareVersion: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="table-input-cell">
                    <input
                      type="text"
                      className="input w-full"
                      value={headerForm.ecn || ""}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          ecn: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 抽样计划及检验标准表格 */}
          <div className="mt-4 px-2">
            <h3 className="text-sm font-bold bg-blue-50 px-4 py-2 border-b-2 border-blue-600 mb-3">
              抽样计划及检验标准 (Sampling plan and inspection standard)
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">抽样计划 (Sampling Plan)</label>
                <textarea
                  className="input w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  rows={4}
                  value={headerForm.samplePlan || ""}
                  onChange={(e) =>
                    setHeaderForm({
                      ...headerForm,
                      samplePlan: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">检验标准 (Inspection Standard)</label>
                <select
                  className="input w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  value={headerForm.specDesc || ""}
                  onChange={(e) =>
                    setHeaderForm({
                      ...headerForm,
                      specDesc: e.target.value,
                    })
                  }
                >
                  <option value="IPC-A-610 Class 1">IPC-A-610 Class 1</option>
                  <option value="IPC-A-610 Class 2">IPC-A-610 Class 2</option>
                  <option value="IPC-A-610 Class 3">IPC-A-610 Class 3</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">产品特殊要求 (Special Requirements)</label>
                <textarea
                  className="input w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  rows={2}
                  value={headerForm.productSpecialReq || ""}
                  onChange={(e) =>
                    setHeaderForm({
                      ...headerForm,
                      productSpecialReq: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">检验工具/仪器 (Inspection Tools)</label>
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50 flex flex-wrap gap-3">
                  {[
                    "放大镜","卡尺","菲林片","塞尺","膜厚仪","通止规","塞规","螺纹环规","色卡","客户限度样","CCD","X-RAY","二次元","三次元"
                  ].map(opt => (
                    <label key={opt} className="inline-flex items-center gap-1 text-xs cursor-pointer hover:text-blue-600">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 focus:ring-blue-500"
                        checked={(headerForm.toolDesc || "").split(/[，,]/).map(s=>s.trim()).filter(Boolean).includes(opt)}
                        onChange={(e) => {
                          const cur = new Set((headerForm.toolDesc || "").split(/[ Phoen，,]/).map(s=>s.trim()).filter(Boolean));
                          if (e.target.checked) cur.add(opt); else cur.delete(opt);
                          setHeaderForm({ ...headerForm, toolDesc: Array.from(cur).join(",") });
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">允收水准/AQL (AQL Standard)</label>
                <textarea
                  className="input w-full font-mono text-xs border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-gray-50"
                  rows={3}
                  value={headerForm.aqlStandard || ""}
                  onChange={(e) =>
                    setHeaderForm({
                      ...headerForm,
                      aqlStandard: e.target.value,
                    })
                  }
                  placeholder="CR:0 ( Acc Q'ty: 0  Rej Q'ty: 0 )&#10;Maj:0.25( Acc Q'ty: 0  Rej Q'ty: 1 )&#10;Min:0.65( Acc Q'ty: 0  Rej Q'ty: 1 )"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 条码录入明细模态框 */}
      <Modal
        open={lineOpen}
        title={currentHeaderId ? `检验明细 - 单号 ${currentHeaderId}` : "检验明细"}
        onClose={() => setLineOpen(false)}
        footer={
          <>
            <button className="btn-outline" onClick={() => setLineOpen(false)}>
              关闭
            </button>
          </>
        }
      >
        <div className="mb-3 sn-bar">
          <input
            ref={snInputRef}
            className="sn-input"
            placeholder="扫描/输入SN"
            value={quickSn}
            onChange={(e) => setQuickSn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") quickAdd();
            }}
          />
          <button className="big-btn-ok" onClick={() => setQuickResult("OK")}>
            合格
          </button>
          <button className="big-btn-ng" onClick={() => setQuickResult("NG")}>
            不合格
          </button>
          <input
            className="input w-48"
            placeholder="不良描述(NG)"
            value={quickDefect}
            onChange={(e) => setQuickDefect(e.target.value)}
          />
          <input
            className="input w-36"
            placeholder="三防漆厚度"
            value={quickThickness}
            onChange={(e) => setQuickThickness(e.target.value)}
          />
          <button className="btn-primary" onClick={quickAdd}>
            录入
          </button>
        </div>
        <div className="mb-3 sn-bar">
          <input
            className="sn-input"
            placeholder="不合格条码录入 SN"
            value={ngSn}
            onChange={(e) => setNgSn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openNg();
            }}
          />
          <button className="big-btn-ng" onClick={openNg}>
            录入不合格
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveLine();
          }}
          className="mb-3 grid grid-cols-4 gap-2"
        >
          <input
            className="input"
            placeholder="产品SN"
            value={lineForm.productSn || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, productSn: e.target.value })
            }
          />
          <input
            type="datetime-local"
            className="input"
            value={lineForm.inspectedAt || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, inspectedAt: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="生产线/作业员"
            value={lineForm.lineName || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, lineName: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="批次/箱号"
            value={lineForm.lotNo || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, lotNo: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="送检数量"
            value={lineForm.shipQty || ""}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                shipQty: Number(e.target.value || 0),
              })
            }
          />
          <input
            className="input"
            placeholder="抽样数"
            value={lineForm.sampleQty || ""}
            onChange={(e) =>
              setLineForm({
                ...lineForm,
                sampleQty: Number(e.target.value || 0),
              })
            }
          />
          <input
            className="input"
            placeholder="不良描述"
            value={lineForm.defectDesc || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, defectDesc: e.target.value })
            }
          />
          <select
            className="input"
            value={lineForm.result || "OK"}
            onChange={(e) =>
              setLineForm({ ...lineForm, result: e.target.value })
            }
          >
            <option value="OK">合格</option>
            <option value="NG">不合格</option>
          </select>
          <input
            className="input"
            placeholder="客户编码"
            value={lineForm.customerCode || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, customerCode: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="订单号"
            value={lineForm.orderNo || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, orderNo: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="固件版本"
            value={lineForm.firmwareVersion || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, firmwareVersion: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="三防漆厚度"
            value={lineForm.coatingThickness || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, coatingThickness: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="问题类型"
            value={lineForm.issueType || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, issueType: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="问题小类"
            value={lineForm.issueSubtype || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, issueSubtype: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="责任人"
            value={lineForm.owner || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, owner: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="责任人主管"
            value={lineForm.ownerManager || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, ownerManager: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="责任部门"
            value={lineForm.ownerDept || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, ownerDept: e.target.value })
            }
          />
          <textarea
            className="input col-span-4"
            rows={2}
            placeholder="原因分析"
            value={lineForm.rootCause || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, rootCause: e.target.value })
            }
          />
          <textarea
            className="input col-span-4"
            rows={2}
            placeholder="改善对策"
            value={lineForm.action || ""}
            onChange={(e) =>
              setLineForm({ ...lineForm, action: e.target.value })
            }
          />
          <button className="btn-primary col-span-1">录入一条</button>
        </form>
        <div className="mb-3 grid grid-cols-4 gap-2">
          <textarea
            className="input col-span-3"
            rows={3}
            placeholder="批量录入：每行一个SN"
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
          />
          <button className="btn-secondary" onClick={batchAdd}>
            批量录入
          </button>
        </div>
        <Modal
          open={ngOpen}
          title="不合格条码详情"
          onClose={() => setNgOpen(false)}
          footer={
            <>
              <button className="btn-primary mr-2" onClick={saveNg}>
                保存
              </button>
              <button className="btn-outline" onClick={() => setNgOpen(false)}>
                取消
              </button>
            </>
          }
        >
          <div className="space-y-4 px-2">
            <div className="flex gap-2 items-start">
              <textarea
                className="input flex-1"
                rows={2}
                placeholder="检验不良描述"
                value={ngForm.defectDesc}
                onChange={(e) =>
                  setNgForm({ ...ngForm, defectDesc: e.target.value })
                }
              />
              <div className="flex flex-col gap-2">
                <button 
                  className="btn-outline whitespace-nowrap py-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  上传图片
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleUpload}
                />
              </div>
          </div>

          {ngForm.defectImages && (
            <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
              {ngForm.defectImages.split(",").map((img, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={img.startsWith("http") ? img : `/api/files/${img}`} 
                    className="w-16 h-16 object-cover rounded border shadow-sm"
                    alt="defect"
                  />
                  <button 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

            <div className="grid grid-cols-2 gap-4">
              <MultiSelect
                placeholder="问题类型"
                options={ISSUE_TYPES}
                value={ngForm.issueType}
                onChange={(val) => setNgForm({ ...ngForm, issueType: val })}
                single={true}
              />
              <MultiSelect
                placeholder="问题小类"
                options={ISSUE_SUBTYPES}
                value={ngForm.issueSubtype}
                onChange={(val) => setNgForm({ ...ngForm, issueSubtype: val })}
              />
              <input
                className="input"
                placeholder="责任人"
                value={ngForm.owner}
                onChange={(e) =>
                  setNgForm({ ...ngForm, owner: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="责任人主管"
                value={ngForm.ownerManager}
                onChange={(e) =>
                  setNgForm({ ...ngForm, ownerManager: e.target.value })
                }
              />
              <select
                className="input"
                value={ngForm.ownerDept}
                onChange={(e) =>
                  setNgForm({ ...ngForm, ownerDept: e.target.value })
                }
              >
                <option value="">请选择责任部门</option>
                <option value="SMT">SMT</option>
                <option value="DIP">DIP</option>
                <option value="组装">组装</option>
                <option value="工程部">工程部</option>
                <option value="供应商">供应商</option>
              </select>
            </div>
            <textarea
              className="input w-full"
              rows={2}
              placeholder="原因分析"
              value={ngForm.rootCause}
              onChange={(e) =>
                setNgForm({ ...ngForm, rootCause: e.target.value })
              }
            />
            <textarea
              className="input w-full"
              rows={2}
              placeholder="改善对策"
              value={ngForm.action}
              onChange={(e) =>
                setNgForm({ ...ngForm, action: e.target.value })
              }
            />
            <textarea
              className="input w-full"
              rows={2}
              placeholder="备注"
              value={ngForm.remark}
              onChange={(e) =>
                setNgForm({ ...ngForm, remark: e.target.value })
              }
            />
          </div>
        </Modal>
        <Modal
          open={scanResultOpen}
          title="录入确认"
          onClose={cancelScan}
          footer={
            <>
              <button className="btn-primary mr-2" onClick={confirmScanSave}>
                确认
              </button>
              <button className="btn-outline" onClick={cancelScan}>
                取消
              </button>
            </>
          }
        >
          <div className="text-sm">{scanResultMsg}</div>
        </Modal>
        <div className="table-scroll">
          <table className="table min-w-[1000px]">
            <thead>
              <tr>
                <th className="sheet-header-yellow sticky-col">序号</th>
                <th className="sheet-header-yellow">SN</th>
                <th className="sheet-header-yellow">三防漆厚度</th>
                <th className="sheet-header-yellow">检验时间</th>
                <th className="sheet-header-yellow">结果</th>
                <th className="sheet-header-yellow">不良描述</th>
                <th className="sheet-header-yellow">客户编码</th>
                <th className="sheet-header-yellow">订单号</th>
                <th className="sheet-header-yellow">作业员/线别</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={l.id}>
                  <td className="sticky-col">{l.seqNo || (idx + 1 + (linePage - 1) * 10)}</td>
                  <td>
                    <input
                      className="input"
                      data-rc={`${idx}-0`}
                      value={l.productSn || ""}
                      onChange={(e) =>
                        updateLine({ ...l, productSn: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 0, l)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={l.coatingThickness || ""}
                      onChange={(e) =>
                        updateLine({ ...l, coatingThickness: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="datetime-local"
                      data-rc={`${idx}-1`}
                      value={(l.inspectedAt || "").slice(0, 16)}
                      onChange={(e) =>
                        updateLine({ ...l, inspectedAt: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 1, l)}
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      data-rc={`${idx}-2`}
                      value={l.result || "OK"}
                      onChange={(e) =>
                        updateLine({ ...l, result: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 2, l)}
                    >
                      <option value="OK">合格</option>
                      <option value="NG">不合格</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      data-rc={`${idx}-3`}
                      value={l.defectDesc || ""}
                      onChange={(e) =>
                        updateLine({ ...l, defectDesc: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 3, l)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      data-rc={`${idx}-4`}
                      value={l.customerCode || ""}
                      onChange={(e) =>
                        updateLine({ ...l, customerCode: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 4, l)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      data-rc={`${idx}-5`}
                      value={l.orderNo || ""}
                      onChange={(e) =>
                        updateLine({ ...l, orderNo: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 5, l)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      data-rc={`${idx}-6`}
                      value={l.lineName || ""}
                      onChange={(e) =>
                        updateLine({ ...l, lineName: e.target.value })
                      }
                      onKeyDown={(e) => onCellKey(e, idx, 6, l)}
                    />
                  </td>
                  <td>
                    {(userRole === "admin" || userRole === "ROLE_ADMIN" || userRole === "系统管理员") && (
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => removeLine(l.id)}
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button className="btn-outline" onClick={exportCsv}>
            导出CSV
          </button>
          <label className="btn-secondary">
            导入CSV
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={importCsv}
            />
          </label>
        </div>
      </Modal>

      {/* 分页 */}
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
              key={page} // Force re-render when page changes to update value
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

      <style>{`
        .table-header-label {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
          width: 12.5%;
        }
        .table-input-cell {
          border: 1px solid #e5e7eb;
          padding: 6px;
        }
        .table-info-cell {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          background-color: #fafafa;
          color: #374151;
        }
        .table-header-excel {
          border: 1px solid #b0b0b0;
          padding: 8px 12px;
          background-color: #c6d9f0;
          font-weight: bold;
          color: #000;
          text-align: center;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
