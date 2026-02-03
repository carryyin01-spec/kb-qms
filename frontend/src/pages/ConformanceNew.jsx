import { useEffect, useState } from "react";
import { saveConformanceHeader } from "../services/conformanceService";
import { getUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";

export default function ConformanceNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    inspectionDate: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }),
    qaInspector: getUser() || "",
    samplePlan: "GB/T2828.1-2012",
    attachInfo: "无",
    specDesc: "IPC-A-610 Class 2", // Default
    aqlStandard: "CR:0 ( Acc Q'ty: 0  Rej Q'ty: 0 )\nMaj:0.25( Acc Q'ty: 0  Rej Q'ty: 1 )\nMin:0.65( Acc Q'ty: 0  Rej Q'ty: 1 )"
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 送检区域和生产线体的级联逻辑
  const lineOptions = {
    "SMT": ["SMT1线", "SMT2线", "SMT3线", "SMT4线", "SMT5线", "SMT6线"],
    "DIP": ["DIP1线", "DIP2线", "DIP3线", "DIP4线", "DIP5线", "DIP6线"],
    "组装": ["组装1线", "组装2线", "组装3线", "组装4线", "组装5线", "组装6线"]
  };

  const toolOptions = [
    "放大镜", "卡尺", "菲林片", "塞尺", "膜厚仪", "通止规", "塞规", "螺纹环规", "色卡", "客户限度样", "CCD", "X-RAY", "二次元", "三次元"
  ];

  const handleLineNameChange = (e) => {
    const newLineName = e.target.value;
    setForm({
      ...form,
      lineName: newLineName,
      productionLine: "" // 重置生产线体
    });
  };

  const handleToolChange = (tool) => {
    const currentTools = form.toolDesc ? form.toolDesc.split(",").filter(Boolean) : [];
    let newTools;
    if (currentTools.includes(tool)) {
      newTools = currentTools.filter(t => t !== tool);
    } else {
      newTools = [...currentTools, tool];
    }
    setForm({ ...form, toolDesc: newTools.join(",") });
  };

  const genReportNo = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const yyyy = d.getFullYear().toString();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const seq = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    return `QM-${yyyy}${mm}${dd}-${seq}`;
  };

  useEffect(() => {
    if (!form.reportNo) {
      setForm(f => ({ ...f, reportNo: genReportNo(f.inspectionDate) }));
    }
  }, [form.inspectionDate]);

  const save = async () => {
    // 验证必填字段
    if (!form.orderNo?.trim()) {
      setMsg("订单编号不能为空");
      return;
    }
    if (!form.workShift?.trim()) {
      setMsg("班次不能为空");
      return;
    }
    if (!form.lineName?.trim()) {
      setMsg("送检区域不能为空");
      return;
    }
    if (!form.productionLine?.trim()) {
      setMsg("生产线体不能为空");
      return;
    }
    if (!form.productNo?.trim()) {
      setMsg("产品编号不能为空");
      return;
    }
    if (!form.customerCode?.trim()) {
      setMsg("客户编码不能为空");
      return;
    }
    if (form.attachInfo === "有" && !form.attachmentCode?.trim()) {
      setMsg("当有附件时，附件编码不能为空");
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        ...form,
        qaInspector: form.qaInspector || getUser() || "",
        reportNo: form.reportNo || genReportNo(form.inspectionDate)
      };

      const res = await saveConformanceHeader(payload);
      if (res.code !== 200) {
        throw new Error(res.message || "保存失败");
      }
      setMsg("检验单已保存");
      const id = res?.data?.id;
      setTimeout(() => {
        if (id) navigate(`/conformance/entry/${id}`);
        else navigate("/conformance");
      }, 300);
    } catch (error) {
      setMsg(error.message || "保存失败，请重试");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const SECTION_TITLES = {
    order: "订单信息 (Order information)",
    sampling: "抽样计划及检验标准 (Sampling plan and inspection standard)",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">符合性检验登记记录表</h1>
              <p className="text-gray-600 mt-1">Conformance Inspection Record</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">报告编号</div>
              <div className="text-2xl font-bold text-red-600">{form.reportNo}</div>
            </div>
          </div>
        </div>

        {/* 提示消息 */}
        {msg && (
          <div className={`mb-4 p-4 rounded-lg border ${
            msg.includes("失败") || msg.includes("不能") || msg.includes("为空")
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}>
            {msg.includes("成功") || msg.includes("已保存") ? "✓" : "!"} {msg}
          </div>
        )}

        {/* 表单容器 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 订单信息表格 */}
          <div className="border-b-2 border-red-600">
            <div className="bg-red-50 px-6 py-3 border-b border-red-200">
              <h2 className="text-lg font-bold text-gray-900">{SECTION_TITLES.order}</h2>
            </div>
            <table className="w-full border-collapse">
              <tbody className="text-sm">
                {/* 第一行 */}
                <tr>
                  <td className="table-header-label">检验日期</td>
                  <td className="table-input-cell">
                    <input type="date" className="input w-full" value={form.inspectionDate} onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })} />
                  </td>
                  <td className="table-header-label">产品编号</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.productNo || ""} onChange={(e) => setForm({ ...form, productNo: e.target.value })} />
                  </td>
                  <td className="table-header-label">送检数量</td>
                  <td className="table-input-cell">
                    <input type="number" className="input w-full" value={form.sendQty ?? ""} onChange={(e) => setForm({ ...form, sendQty: Number(e.target.value || 0) })} />
                  </td>
                  <td className="table-header-label">抽样数量</td>
                  <td className="table-input-cell">
                    <input type="number" className="input w-full" value={form.sampleQty ?? ""} onChange={(e) => setForm({ ...form, sampleQty: Number(e.target.value || 0) })} />
                  </td>
                </tr>
                {/* 第二行 */}
                <tr>
                  <td className="table-header-label">QA检验员</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.qaInspector || ""} readOnly />
                  </td>
                  <td className="table-header-label">生产总检</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.checker || ""} onChange={(e) => setForm({ ...form, checker: e.target.value })} />
                  </td>
                  <td className="table-header-label">客户编码</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.customerCode || ""} onChange={(e) => setForm({ ...form, customerCode: e.target.value })} />
                  </td>
                  <td className="table-header-label">班次</td>
                  <td className="table-input-cell">
                    <select className="input w-full" value={form.workShift || ""} onChange={(e) => setForm({ ...form, workShift: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="白班">白班</option>
                      <option value="中班">中班</option>
                      <option value="夜班">夜班</option>
                    </select>
                  </td>
                </tr>
                {/* 第三行 */}
                <tr>
                  <td className="table-header-label">送检区域</td>
                  <td className="table-input-cell">
                    <select className="input w-full" value={form.lineName || ""} onChange={handleLineNameChange}>
                      <option value="">请选择</option>
                      <option value="SMT">SMT</option>
                      <option value="DIP">DIP</option>
                      <option value="组装">组装</option>
                    </select>
                  </td>
                  <td className="table-header-label">生产线体</td>
                  <td className="table-input-cell">
                    <select 
                      className="input w-full" 
                      value={form.productionLine || ""} 
                      onChange={(e) => setForm({ ...form, productionLine: e.target.value })}
                      disabled={!form.lineName}
                    >
                      <option value="">请选择</option>
                      {form.lineName && lineOptions[form.lineName]?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="table-header-label">有无附件</td>
                  <td className="table-input-cell">
                    <select className="input w-full" value={form.attachInfo || "无"} onChange={(e) => setForm({ ...form, attachInfo: e.target.value })}>
                      <option value="无">无</option>
                      <option value="有">有</option>
                    </select>
                  </td>
                  <td className="table-header-label">附件编码</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.attachmentCode || ""} onChange={(e) => setForm({ ...form, attachmentCode: e.target.value })} />
                  </td>
                </tr>
                {/* 第四行 */}
                <tr>
                  <td className="table-header-label">订单编号</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.orderNo || ""} onChange={(e) => setForm({ ...form, orderNo: e.target.value })} />
                  </td>
                  <td className="table-header-label">固件版本</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.firmwareVersion || ""} onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })} />
                  </td>
                  <td className="table-header-label">ECN/子件ECN</td>
                  <td className="table-input-cell">
                    <input type="text" className="input w-full" value={form.ecn || ""} onChange={(e) => setForm({ ...form, ecn: e.target.value })} />
                  </td>
                </tr>
                {/* 第五行 */}
                <tr>
                  <td className="table-header-label">变更内容</td>
                  <td colSpan="7" className="table-input-cell">
                    <input type="text" className="input w-full" value={form.changeDesc || ""} onChange={(e) => setForm({ ...form, changeDesc: e.target.value })} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 抽样计划及检验标准 */}
          <div>
            <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
              <h2 className="text-lg font-bold text-gray-900">{SECTION_TITLES.sampling}</h2>
            </div>
            <table className="w-full border-collapse">
              <tbody className="text-sm">
                <tr>
                  <td className="table-header-label">抽样计划</td>
                  <td colSpan="3" className="table-input-cell">
                    <textarea className="input w-full" rows={2} value={form.samplePlan || ""} onChange={(e) => setForm({ ...form, samplePlan: e.target.value })} />
                  </td>
                  <td className="table-header-label">产品特殊要求</td>
                  <td colSpan="3" className="table-input-cell">
                    <textarea className="input w-full" rows={2} value={form.productSpecialReq || ""} onChange={(e) => setForm({ ...form, productSpecialReq: e.target.value })} />
                  </td>
                </tr>
                <tr>
                  <td className="table-header-label">检验标准</td>
                  <td colSpan="7" className="table-input-cell">
                    <select className="input w-full" value={form.specDesc || ""} onChange={(e) => setForm({ ...form, specDesc: e.target.value })}>
                      <option value="IPC-A-610 Class 1">IPC-A-610 Class 1</option>
                      <option value="IPC-A-610 Class 2">IPC-A-610 Class 2</option>
                      <option value="IPC-A-610 Class 3">IPC-A-610 Class 3</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className="table-header-label">检验工具/仪器</td>
                  <td colSpan="7" className="table-input-cell">
                    <div className="flex flex-wrap gap-2 p-2">
                      {toolOptions.map(tool => (
                        <label key={tool} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600"
                            checked={(form.toolDesc || "").split(",").includes(tool)}
                            onChange={() => handleToolChange(tool)}
                          />
                          <span className="ml-2 text-sm text-gray-700">{tool}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="table-header-label">允收水准/AQL</td>
                  <td colSpan="7" className="table-input-cell">
                    <textarea className="input w-full font-mono text-xs" rows={3} value={form.aqlStandard || ""} onChange={(e) => setForm({ ...form, aqlStandard: e.target.value })} placeholder="CR:0 ( Acc Q'ty: 0  Rej Q'ty: 0 )&#10;Maj:0.25( Acc Q'ty: 0  Rej Q'ty: 1 )&#10;Min:0.65( Acc Q'ty: 0  Rej Q'ty: 1 )" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            className="btn-primary px-8 py-3 rounded-lg font-semibold text-lg"
            onClick={save}
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
          <button
            className="btn-outline px-8 py-3 rounded-lg font-semibold text-lg"
            onClick={() => navigate("/conformance")}
            disabled={loading}
          >
            取消
          </button>
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
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
