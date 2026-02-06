import { useEffect, useState, useRef } from "react";
import { getUser } from "../utils/storage";
import { useParams, useNavigate } from "react-router-dom";
import { getConformanceHeader, listConformanceLines, saveConformanceLine, getConformanceStats, lineExists, uploadFile, saveConformanceHeader } from "../services/conformanceService";
import Modal from "../components/Modal";

const ISSUE_TYPES = ["操作不良", "来料不良", "焊接不良", "首件不良", "外观不良"];
const ISSUE_SUBTYPES = [
  "螺钉未打紧", "螺钉打花", "滑牙", "螺钉打歪", "错漏装", "装配位置错误", "反向", "接线不良", "标签不良",
  "浮高",
  "金属异物", "非金属异物", "划伤", "段差", "撞件", "破损", "弯针", "掉漆", "色差", "立碑", "漏焊",
  "虚焊", "拉尖", "针孔", "堆锡", "锡珠、锡渣", "偏位", "连锡", "冷焊", "连锡 / 桥接", "变形", "不出脚",
  "焊盘脱落", "锡桥"
];

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

  // 确保 baseUrl 正确
  let baseUrl = apiRoot; 
  if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  if (!baseUrl.endsWith("/api")) baseUrl += "/api";
  
  const finalUrl = `${baseUrl}/files/${path}`;
  console.log("Image Resolution Debug (Entry):", { original: u, path, apiRoot, finalUrl });
  return finalUrl;
};

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

export default function ConformanceEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const snInputRef = useRef(null);
  const ngInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [header, setHeader] = useState({});
  const [lines, setLines] = useState([]);
  const [recentOk, setRecentOk] = useState([]);
  const [recentNg, setRecentNg] = useState([]);
  const [stats, setStats] = useState({ dayTotal: 0, dayFail: 0, dayPassRate: 0, weekTotal: 0, weekFail: 0, weekPassRate: 0 });
  const [quickSn, setQuickSn] = useState("");
  const [ngSn, setNgSn] = useState("");
  const [ngOpen, setNgOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [ngForm, setNgForm] = useState({
    defectDesc: "",
    issueType: "",
    issueSubtype: "",
    issueNature: "",
    owner: "",
    ownerManager: "",
    ownerDept: "",
    rootCause: "",
    action: "",
    remark: "",
    defectImages: "",
  });
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [alertData, setAlertData] = useState({ clearInput: false, inputType: "" });
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ sendQty: 0, sampleQty: 0 });
  const [entryCoatingThickness, setEntryCoatingThickness] = useState("");
  const [entryPerformanceTest, setEntryPerformanceTest] = useState("");

  const showToast = (m) => {
    setToastMsg(m);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2000);
  };

  const showAlert = (m, clearInput = false, inputType = '') => {
    setAlertMsg(m);
    setAlertOpen(true);
    // 存储需要清空的输入框类型
    setAlertData({ clearInput, inputType });
  };

  const validateSn = async (sn) => {
    if (!sn || !sn.trim()) return { valid: false, reason: 'empty' };
    if (/[\u4e00-\u9fff]/.test(sn)) return { valid: false, reason: 'chinese' };
    if (/[\u0e00-\u0e7f]/.test(sn)) return { valid: false, reason: 'thai' };
    if (/[\u1000-\u109f]/.test(sn)) return { valid: false, reason: 'burmese' };
    const ex = await lineExists(Number(id), sn.trim());
    if (ex.code === 200 && ex.data) return { valid: false, reason: 'duplicate' };
    return { valid: true, reason: null };
  };

  const load = async () => {
    if (!id || isNaN(Number(id))) {
      showAlert("无效的检验单ID");
      return;
    }
    const h = await getConformanceHeader(id);
    if (h.code === 200) {
      setHeader(h.data || {});
      setEntryCoatingThickness(h.data?.coatingThickness || "");
    } else {
      showAlert("获取检验单信息失败: " + (h.message || "未知错误"));
      return;
    }
    const ls = await listConformanceLines({ page: 1, size: 100, headerId: id });
    if (ls.code === 200) setLines(ls.data.records || []);
    if (ls.code === 200) {
      const allLines = ls.data.records || [];
      const okLines = allLines
        .filter(l => l.result === "OK")
        .sort((a, b) => new Date(b.inspectedAt || 0) - new Date(a.inspectedAt || 0) || b.id - a.id)
        .slice(0, 10);
      setRecentOk(okLines);

      const ngLines = allLines
        .filter(l => l.result === "NG")
        .sort((a, b) => new Date(b.inspectedAt || 0) - new Date(a.inspectedAt || 0) || b.id - a.id)
        .slice(0, 5);
      setRecentNg(ngLines);
    }
    const st = await getConformanceStats(id);
    if (st.code === 200) setStats(st.data || {});
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (header.id) {
      setHeaderForm({
        sendQty: header.sendQty || 0,
        sampleQty: header.sampleQty || 0
      });
    }
  }, [header]);

  const saveHeaderChanges = async () => {
    const payload = {
      ...header,
      sendQty: Number(headerForm.sendQty),
      sampleQty: Number(headerForm.sampleQty)
    };
    const res = await saveConformanceHeader(payload);
    if (res.code === 200) {
      showToast("订单信息已更新");
      setIsEditingHeader(false);
      load();
    } else {
      showAlert("保存失败: " + (res.message || "未知错误"));
    }
  };

  const quickAdd = async () => {
    if (!id || !quickSn || alertOpen) return;
    const validation = await validateSn(quickSn);
    if (!validation.valid) {
      let message = '';
      if (validation.reason === 'chinese') {
        message = "禁止输入中文\n" +
          "No Chinese characters allowed\n" +
          "ห้ามป้อนอักษรจีน\n" +
          "တရုတ်စာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'thai') {
        message = "禁止输入泰文\n" +
          "No Thai characters allowed\n" +
          "ห้ามป้อนตัวอักษรไทย\n" +
          "ထိုင်းစာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'burmese') {
        message = "禁止输入缅甸语\n" +
          "No Burmese characters allowed\n" +
          "ห้ามป้อนภาษาพม่า\n" +
          "မြန်မာစာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'duplicate') {
        message = "条码重复，请确认\n" +
          "Duplicate barcode, please confirm\n" +
          "บาร์โค้ดซ้ำ กรุณายืนยัน\n" +
          "ဘားကုဒ် ထပ်နေသည်၊ ကျေးဇူးပြု၍ အတည်ပြုပါ";
      }
      if (message) {
        showAlert(message, true, 'quick');
      }
      return;
    }
    const currentUser = getUser(); // 获取当前登录用户
    // 使用泰国时间
    // 保留秒
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace(" ", "T").slice(0, 19);
    const payload = {
      headerId: Number(id),
      productSn: quickSn.trim(),
      inspectedAt: now,
      lineName: header.lineName || "",
      productionLine: header.productionLine || "",
      workShift: header.workShift || "",
      productNo: header.productNo || "",
      customerCode: header.customerCode || "",
      sendQty: header.sendQty || 0,
      sampleQty: header.sampleQty || 0,
      qaInspector: currentUser, // 使用当前登录用户作为QA检验员
      checker: header.checker || "",
      orderNo: header.orderNo || "",
      firmwareVersion: header.firmwareVersion || "",
      coatingThickness: entryCoatingThickness,
      performanceTest: entryPerformanceTest,
      attachInfo: header.attachInfo || "",
      attachmentCode: header.attachmentCode || "",
      ecn: header.ecn || "", // Mapping ECN/子件ECN
      changeDesc: header.changeDesc || "",
      samplePlan: header.samplePlan || "",
      specDesc: header.specDesc || "",
      toolDesc: header.toolDesc || "",
      productSpecialReq: header.productSpecialReq || "",
      result: "OK",
    };
    await saveConformanceLine(payload);
    setQuickSn("");
    setEntryPerformanceTest("");
    showToast("合格条码已录入");
    load();
  };

  const openNg = async () => {
    if (!ngSn || alertOpen) return;
    const validation = await validateSn(ngSn);
    if (!validation.valid) {
      let message = '';
      if (validation.reason === 'chinese') {
        message = "禁止输入中文\n" +
          "No Chinese characters allowed\n" +
          "ห้ามป้อนอักษรจีน\n" +
          "တရုတ်စာလုံးများ မထည့ฺရပห";
      } else if (validation.reason === 'thai') {
        message = "禁止输入泰文\n" +
          "No Thai characters allowed\n" +
          "ห้ามป้อนตัวอักษรไทย\n" +
          "ထိုင်းစာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'burmese') {
        message = "禁止输入缅甸语\n" +
          "No Burmese characters allowed\n" +
          "ห้ามป้อนภาษาพม่า\n" +
          "မြန်မာစာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'duplicate') {
        message = "条码重复，请确认\n" +
          "Duplicate barcode, please confirm\n" +
          "บาร์โค้ดซ้ำ กรุณายืนยัน\n" +
          "ဘားကုဒ် ထပ်နေသည်၊ ကျေးဇူးပြု၍ အတည်ပြုပါ";
      }
      if (message) {
        showAlert(message, true, 'ng');
      }
      return;
    }
    setNgOpen(true);
  };

  const saveNg = async () => {
    const currentUser = getUser(); // 获取当前登录用户
    const validation = await validateSn(ngSn);
    if (!validation.valid) {
      let message = '';
      if (validation.reason === 'chinese') {
        message = "禁止输入中文\n" +
          "No Chinese characters allowed\n" +
          "ห้ามป้อนอักษรจีน\n" +
          "တရုတ်စာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'thai') {
        message = "禁止输入泰文\n" +
          "No Thai characters allowed\n" +
          "ห้ามป้อนตัวอักษรไทย\n" +
          "ထိုင်းစာလုံးများ mထည့့ရပါ";
      } else if (validation.reason === 'burmese') {
        message = "禁止输入缅甸语\n" +
          "No Burmese characters allowed\n" +
          "ห้ามป้อนภาษาพม่า\n" +
          "မြန်မာစာလုံးများ မထည့်ရပါ";
      } else if (validation.reason === 'duplicate') {
        message = "条码重复，请确认\n" +
          "Duplicate barcode, please confirm\n" +
          "บาร์โค้ดซ้ำ กรุณายืนยัน\n" +
          "ဘားကုဒ် ထပ်နေသည်၊ ကျေးဇူးပြု၍ အတည်ပြုပါ";
      }
      if (message) {
        showAlert(message, true, 'ng');
      }
      return;
    }
    // 使用泰国时间
    // 保留秒
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace(" ", "T").slice(0, 19);
    const payload = {
      headerId: Number(id),
      productSn: ngSn.trim(),
      inspectedAt: now,
      lineName: header.lineName || "",
      productionLine: header.productionLine || "",
      workShift: header.workShift || "",
      productNo: header.productNo || "",
      customerCode: header.customerCode || "",
      sendQty: header.sendQty || 0,
      sampleQty: header.sampleQty || 0,
      qaInspector: currentUser, // 使用当前登录用户作为QA检验员
      checker: header.checker || "",
      orderNo: header.orderNo || "",
      firmwareVersion: header.firmwareVersion || "",
      coatingThickness: entryCoatingThickness,
      performanceTest: entryPerformanceTest,
      attachInfo: header.attachInfo || "",
      attachmentCode: header.attachmentCode || "",
      ecn: header.ecn || "",
      changeDesc: header.changeDesc || "",
      samplePlan: header.samplePlan || "",
      specDesc: header.specDesc || "",
      toolDesc: header.toolDesc || "",
      productSpecialReq: header.productSpecialReq || "",
      result: "NG",
      ...ngForm,
    };
    await saveConformanceLine(payload);
    setNgOpen(false);
    setNgForm({
      defectDesc: "",
      issueType: "",
      issueSubtype: "",
      issueNature: "",
      owner: "",
      ownerManager: "",
      ownerDept: "",
      rootCause: "",
      action: "",
      remark: "",
      defectImages: "",
    });
    setNgSn("");
    setEntryPerformanceTest("");
    load();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        // 提取 URL 字符串，防止出现 [object Object]
        const url = typeof res.data === 'string' ? res.data : res.data.url;
        const currentImages = ngForm.defectImages ? ngForm.defectImages.split(",") : [];
        const nextImages = [...currentImages, url];
        setNgForm({ ...ngForm, defectImages: nextImages.join(",") });
        showToast("图片上传成功");
      } else {
        showToast("图片上传失败：" + res.message);
      }
    } catch (err) {
      showToast("图片上传出错");
    }
  };

  const removeImage = (index) => {
    const currentImages = ngForm.defectImages.split(",");
    currentImages.splice(index, 1);
    setNgForm({ ...ngForm, defectImages: currentImages.join(",") });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">条码录入</h1>
            <p className="text-gray-600 mt-1">Barcode Entry System</p>
          </div>
          <button
            className="btn-outline px-6 py-2"
            onClick={() => navigate(`/conformance/detail/${id}`)}
          >
            查看录入详情 →
          </button>
          <button
            className="btn-outline px-6 py-2 ml-4 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => navigate(`/conformance/ng-detail/${id}`)}
          >
            查看NG录入详情 →
          </button>
        </div>

        {/* 订单信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-red-50 px-6 py-3 border-b-2 border-red-600 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">订单信息 (Order information)</h2>
            <div className="flex gap-2">
              {isEditingHeader ? (
                <>
                  <button className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700" onClick={saveHeaderChanges}>保存数量</button>
                  <button className="bg-white text-gray-600 border border-gray-300 px-4 py-1 rounded text-sm hover:bg-gray-50" onClick={() => setIsEditingHeader(false)}>取消</button>
                </>
              ) : (
                <button className="bg-white text-red-600 border border-red-200 px-4 py-1 rounded text-sm hover:bg-red-50" onClick={() => setIsEditingHeader(true)}>修改数量</button>
              )}
            </div>
          </div>
          <table className="w-full border-collapse">
            <tbody className="text-sm">
              {/* 第一行 */}
              <tr>
                <td className="table-header-label w-1/8">检验日期</td>
                <td className="table-info-cell w-1/8">{header.inspectionDate || "-"}</td>
                <td className="table-header-label w-1/8">产品编号</td>
                <td className="table-info-cell w-1/8">{header.productNo || "-"}</td>
                <td className="table-header-label w-1/8">送检数量</td>
                <td className="table-info-cell w-1/8">
                  {isEditingHeader ? (
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      value={headerForm.sendQty}
                      onChange={(e) => setHeaderForm({ ...headerForm, sendQty: e.target.value })}
                    />
                  ) : (
                    header.sendQty ?? "-"
                  )}
                </td>
                <td className="table-header-label w-1/8">抽样数量</td>
                <td className="table-info-cell w-1/8">
                  {isEditingHeader ? (
                    <input
                      type="number"
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      value={headerForm.sampleQty}
                      onChange={(e) => setHeaderForm({ ...headerForm, sampleQty: e.target.value })}
                    />
                  ) : (
                    header.sampleQty ?? "-"
                  )}
                </td>
              </tr>
              {/* 第二行 */}
              <tr>
                <td className="table-header-label w-1/8">QA检验员</td>
                <td className="table-info-cell w-1/8">{header.qaInspector || "-"}</td>
                <td className="table-header-label w-1/8">客户编码</td>
                <td className="table-info-cell w-1/8">{header.customerCode || "-"}</td>
                <td className="table-header-label w-1/8">班次</td>
                <td className="table-info-cell w-1/8">{header.workShift || "-"}</td>
                <td className="table-header-label w-1/8">订单编号</td>
                <td className="table-info-cell w-1/8">{header.orderNo || "-"}</td>
              </tr>
              {/* 第三行 */}
              <tr>
                <td className="table-header-label w-1/8">送检区域</td>
                <td className="table-info-cell w-1/8">{header.lineName || "-"}</td>
                <td className="table-header-label w-1/8">生产线体</td>
                <td className="table-info-cell w-1/8">{header.productionLine || "-"}</td>
                <td className="table-header-label w-1/8">有无附件</td>
                <td className="table-info-cell w-1/8">{header.attachInfo || "-"}</td>
              </tr>
              {/* 第四行 */}
              <tr>
                <td className="table-header-label w-1/8">附件编码</td>
                <td className="table-info-cell w-1/8">{header.attachmentCode || "-"}</td>
                <td className="table-header-label w-1/8">ECN/子件ECN</td>
                <td className="table-info-cell w-1/8">{header.ecn || "-"}</td>
                <td className="table-header-label w-1/8">变更内容</td>
                <td colSpan="3" className="table-info-cell">{header.changeDesc || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 抽样计划及检验标准 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-6 py-3 border-b-2 border-blue-600">
            <h2 className="text-lg font-bold text-gray-900">抽样计划及检验标准 (Sampling plan and inspection standard)</h2>
          </div>
          <table className="w-full border-collapse">
            <tbody className="text-sm">
              <tr>
                <td className="table-header-label w-1/4">抽样计划</td>
                <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                  {header.samplePlan || "-"}
                </td>
                <td className="table-header-label w-1/4">产品特殊要求</td>
                <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                  {header.productSpecialReq || "-"}
                </td>
              </tr>
              <tr>
                <td className="table-header-label w-1/4">检验标准</td>
                <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                  {header.specDesc || "-"}
                </td>
                <td className="table-header-label w-1/4">检验工具/仪器</td>
                <td colSpan="3" className="table-info-cell whitespace-pre-wrap">
                  {header.toolDesc || "-"}
                </td>
              </tr>
              <tr>
                <td className="table-header-label w-1/4">允收水准/AQL</td>
                <td colSpan="7" className="table-info-cell whitespace-pre-wrap font-mono text-xs">
                  {header.aqlStandard || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 当日和本周监控统计 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 当日监控 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-3 border-b-2 border-green-600">
              <h3 className="text-lg font-bold text-gray-900">当日监控</h3>
            </div>
            <div className="grid grid-cols-3 gap-0">
              <div className="text-center bg-gradient-to-b from-green-50 to-white px-4 py-6 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">当日检验数</div>
                <div className="text-4xl font-bold text-green-700">{stats.dayTotal || 0}</div>
              </div>
              <div className="text-center bg-gradient-to-b from-red-50 to-white px-4 py-6 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">当日不良数</div>
                <div className="text-4xl font-bold text-red-700">{stats.dayFail || 0}</div>
              </div>
              <div className="text-center bg-gradient-to-b from-green-100 to-white px-4 py-6 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">当日合格率</div>
                <div className="text-4xl font-bold text-green-800">{(stats.dayPassRate || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {/* 本周监控 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-3 border-b-2 border-blue-600">
              <h3 className="text-lg font-bold text-gray-900">本周监控</h3>
            </div>
            <div className="grid grid-cols-3 gap-0">
              <div className="text-center bg-gradient-to-b from-green-50 to-white px-4 py-6 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">本周检验数</div>
                <div className="text-4xl font-bold text-green-700">{stats.weekTotal || 0}</div>
              </div>
              <div className="text-center bg-gradient-to-b from-red-50 to-white px-4 py-6 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">本周不良数</div>
                <div className="text-4xl font-bold text-red-700">{stats.weekFail || 0}</div>
              </div>
              <div className="text-center bg-gradient-to-b from-green-100 to-white px-4 py-6 border border-gray-200">
                <div className="text-xs text-gray-600 mb-2">本周合格率</div>
                <div className="text-4xl font-bold text-green-800">{(stats.weekPassRate || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 条码录入区域 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 合格条码录入 */}
          <div className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b-2 border-green-600">
              <h3 className="text-lg font-bold text-green-900">✓ 合格条码录入</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">扫描/输入合格SN</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-lg py-3"
                    placeholder="请扫描或输入SN"
                    value={quickSn}
                    onChange={(e) => setQuickSn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") quickAdd();
                    }}
                    disabled={alertOpen}
                    ref={snInputRef}
                    autoFocus
                  />
                  <button
                    className="btn-success px-6 py-3 font-bold text-lg rounded-lg"
                    onClick={quickAdd}
                    disabled={alertOpen}
                  >
                    录入合格
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">三防漆厚度 (Coating Thickness)</label>
                <input
                  className="input w-full py-2"
                  placeholder="请输入三防漆厚度"
                  value={entryCoatingThickness}
                  onChange={(e) => setEntryCoatingThickness(e.target.value)}
                  disabled={alertOpen}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">性能测试值</label>
                <input
                  className="input w-full py-2"
                  placeholder="请输入性能测试值"
                  value={entryPerformanceTest}
                  onChange={(e) => setEntryPerformanceTest(e.target.value)}
                  disabled={alertOpen}
                />
              </div>

              {/* 最近录入 */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">最近10条合格录入</h4>
                  <button
                    className="btn-outline px-3 py-1 text-xs"
                    onClick={() => {
                      const rows = [["序号", "SN", "录入时间", "QA检验员", "结果"]];
                      recentOk.forEach((r, idx) => {
                        rows.push([
                          idx + 1,
                          r.productSn || "",
                          (r.inspectedAt || "").replace("T", " ").slice(0, 19),
                          r.qaInspector || "",
                          "合格",
                        ]);
                      });
                      const csv = rows
                        .map((r) =>
                          r
                            .map((x) => String(x || "").replace(/\"/g, '""'))
                            .map((x) => `"${x}"`)
                            .join(",")
                        )
                        .join("\r\n");
                      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `conformance-ok-${id}-${new Date().getTime()}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    disabled={recentOk.length === 0}
                  >
                    导出Excel
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">序号</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">SN</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">三防漆厚度</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">录入时间</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">QA检验员</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700">结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOk.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-3 py-4 text-center text-gray-400">
                            暂无数据
                          </td>
                        </tr>
                      ) : (
                        recentOk.map((r, idx) => (
                          <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-gray-900">{r.productSn}</td>
                            <td className="px-3 py-2 text-gray-600">{r.coatingThickness || "-"}</td>
                            <td className="px-3 py-2 text-gray-600">{(r.inspectedAt || "").replace("T", " ").slice(0, 19)}</td>
                            <td className="px-3 py-2 text-gray-600">{r.qaInspector || "-"}</td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-white text-xs font-semibold bg-green-600`}
                              >
                                ✓ 合格
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* 不合格条码录入 */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b-2 border-red-600">
              <h3 className="text-lg font-bold text-red-900">✗ 不合格条码录入</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">扫描/输入不合格SN</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-lg py-3"
                    placeholder="请扫描或输入SN"
                    value={ngSn}
                    onChange={(e) => setNgSn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openNg();
                    }}
                    disabled={alertOpen}
                    ref={ngInputRef}
                  />
                  <button
                    className="btn-danger px-6 py-3 font-bold text-lg rounded-lg"
                    onClick={openNg}
                    disabled={alertOpen}
                  >
                    录入不合格
                  </button>
                </div>
              </div>

              {/* 三防漆厚度输入（隐藏） */}

              {/* 说明 */}
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="text-sm font-semibold text-red-900 mb-2">不合格录入说明</h4>
                <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                  <li>点击"录入不合格"按钮后填写详细信息</li>
                  <li>包括问题类型、责任部门、原因分析等</li>
                  <li>所有信息填写完整后点击保存</li>
                </ul>
              </div>

              {/* 最近不良录入 */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">最近5条不良录入</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">序号</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">SN</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">三防漆厚度</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">录入时间</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">QA检验员</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">责任人</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">检验不良描述</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentNg.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-3 py-4 text-center text-gray-400">
                            暂无数据
                          </td>
                        </tr>
                      ) : (
                        recentNg.map((r, idx) => (
                          <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-gray-900">{r.productSn}</td>
                            <td className="px-3 py-2 text-gray-600">{r.coatingThickness || "-"}</td>
                            <td className="px-3 py-2 text-gray-600">{(r.inspectedAt || "").replace("T", " ").slice(0, 19)}</td>
                            <td className="px-3 py-2 text-gray-600">{r.qaInspector || "-"}</td>
                            <td className="px-3 py-2 text-gray-600">{r.owner || "-"}</td>
                            <td className="px-3 py-2 text-gray-600">{r.defectDesc || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-4 justify-center">
          <button
            className="btn-outline px-8 py-3 rounded-lg font-semibold text-lg"
            onClick={() => navigate("/conformance")}
          >
            ← 返回检验单列表
          </button>
        </div>
      </div>

      {/* 不合格详情模态框 */}
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">检验不良描述 *</label>
            <div className="flex gap-2 items-start">
              <textarea
                className="input flex-1"
                rows={2}
                placeholder="请详细描述检验发现的问题"
                value={ngForm.defectDesc}
                onChange={(e) => setNgForm({ ...ngForm, defectDesc: e.target.value })}
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
          </div>

          {ngForm.defectImages && (
            <div className="flex flex-wrap gap-2 p-2 border rounded bg-gray-50">
              {ngForm.defectImages.split(",").map((img, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={resolveFileUrl(img)} 
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">问题类型</label>
              <MultiSelect
                placeholder="选择问题类型"
                options={ISSUE_TYPES}
                value={ngForm.issueType}
                onChange={(val) => setNgForm({ ...ngForm, issueType: val })}
                className="w-full"
                single={true}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">问题小类</label>
              <MultiSelect
                placeholder="选择问题小类"
                options={ISSUE_SUBTYPES}
                value={ngForm.issueSubtype}
                onChange={(val) => setNgForm({ ...ngForm, issueSubtype: val })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">问题性质</label>
              <select
                className="input w-full"
                value={ngForm.issueNature}
                onChange={(e) => setNgForm({ ...ngForm, issueNature: e.target.value })}
              >
                <option value="">请选择问题性质</option>
                <option value="批量问题">批量问题</option>
                <option value="零星问题">零星问题</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">责任人</label>
              <input
                className="input w-full"
                placeholder="姓名"
                value={ngForm.owner}
                onChange={(e) => setNgForm({ ...ngForm, owner: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">责任人主管</label>
              <input
                className="input w-full"
                placeholder="主管姓名"
                value={ngForm.ownerManager}
                onChange={(e) => setNgForm({ ...ngForm, ownerManager: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">责任部门</label>
              <select
                className="input w-full"
                value={ngForm.ownerDept}
                onChange={(e) => setNgForm({ ...ngForm, ownerDept: e.target.value })}
              >
                <option value="">请选择部门</option>
                <option value="SMT">SMT</option>
                <option value="DIP">DIP</option>
                <option value="组装">组装</option>
                <option value="工程部">工程部</option>
                <option value="供应商">供应商</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">原因分析</label>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="详细分析问题产生的原因"
              value={ngForm.rootCause}
              onChange={(e) => setNgForm({ ...ngForm, rootCause: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">改善对策</label>
            <textarea
              className="input w-full"
              rows={3}
              placeholder="提出具体的改善措施和方案"
              value={ngForm.action}
              onChange={(e) => setNgForm({ ...ngForm, action: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">备注</label>
            <textarea
              className="input w-full"
              rows={2}
              placeholder="其他说明信息"
              value={ngForm.remark}
              onChange={(e) => setNgForm({ ...ngForm, remark: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* 警示弹窗 */}
      <Modal
        open={alertOpen}
        title="警告"
        onClose={() => {
          setAlertOpen(false);
          // 关闭时清空输入框
          if (alertData.clearInput) {
            if (alertData.inputType === 'quick') {
              setQuickSn("");
              if (snInputRef.current) snInputRef.current.focus();
            } else if (alertData.inputType === 'ng') {
              setNgSn("");
              if (ngInputRef.current) ngInputRef.current.focus();
            }
          }
          setAlertData({ clearInput: false, inputType: '' });
        }}
        footer={
          <button className="btn-primary" onClick={() => {
            setAlertOpen(false);
            // 确认时清空输入框
            if (alertData.clearInput) {
              if (alertData.inputType === 'quick') {
                setQuickSn("");
                if (snInputRef.current) snInputRef.current.focus();
              } else if (alertData.inputType === 'ng') {
                setNgSn("");
                if (ngInputRef.current) ngInputRef.current.focus();
              }
            }
            setAlertData({ clearInput: false, inputType: '' });
          }}>
            确认
          </button>
        }
      >
        <div className="p-4 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg font-bold text-gray-800 whitespace-pre-wrap leading-relaxed">{alertMsg}</div>
        </div>
      </Modal>

      {/* Toast 提示 */}
      {toastOpen && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
          <span className="text-xl">ℹ️</span>
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .modal {
          background: white;
          border-radius: 8px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #111827;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
          line-height: 1;
        }
        .modal-close:hover {
          color: #111827;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .table-header-label {
          border: 1px solid #e5e7eb;
          padding: 12px;
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        .table-info-cell {
          border: 1px solid #e5e7eb;
          padding: 12px;
          background-color: #fafafa;
          color: #374151;
        }
        .btn-success {
          background-color: #10b981;
          color: white;
          border: none;
          transition: all 0.3s ease;
        }
        .btn-success:hover:not(:disabled) {
          background-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .btn-success:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .btn-danger {
          background-color: #ef4444;
          color: white;
          border: none;
          transition: all 0.3s ease;
        }
        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .btn-danger:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        input:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
