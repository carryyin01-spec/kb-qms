import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getConformanceHeader, listConformanceLines, deleteConformanceLine } from "../services/conformanceService";
import { getRole } from "../utils/storage";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";

// ============ 常量定义 ============
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
  console.log("Image Resolution Debug (Detail):", { original: u, path, baseUrl, finalUrl });
  return finalUrl;
};
const TABLE_COLUMNS = [
  { key: "productSn", label: "产品SN" },
  { key: "inspectedAt", label: "检验日期" },
  { key: "lineName", label: "送检区域" },
  { key: "productionLine", label: "生产线体" },
  { key: "workShift", label: "班次" },
  { key: "productNo", label: "产品编码" },
  { key: "customerCode", label: "客户编码" },
  { key: "sendQty", label: "送检数量" },
  { key: "sampleQty", label: "抽样数量" },
  { key: "qaInspector", label: "QA检验员" },
  { key: "checker", label: "生产总检" },
  { key: "orderNo", label: "订单编号" },
  { key: "firmwareVersion", label: "固件版本" },
  { key: "coatingThickness", label: "三防漆厚度" },
  { key: "attachInfo", label: "有无附件" },
  { key: "attachmentCode", label: "附件编码" },
  { key: "ecn", label: "ECN/子件ECN" },
  { key: "changeDesc", label: "变更内容" },
  { key: "samplePlan", label: "抽样计划" },
  { key: "specDesc", label: "检验标准" },
  { key: "toolDesc", label: "检验工具/仪器" },
  { key: "productSpecialReq", label: "产品特殊要求" },
  { key: "result", label: "结果" },
  { key: "defectDesc", label: "检验不良描述" },
  { key: "issueType", label: "问题类型" },
  { key: "issueSubtype", label: "问题小类" },
  { key: "owner", label: "责任人" },
  { key: "ownerManager", label: "责任人主管" },
  { key: "ownerDept", label: "责任部门" },
  { key: "rootCause", label: "原因分析" },
  { key: "action", label: "改善对策" },
  { key: "remark", label: "备注" },
  { key: "defectImages", label: "初检图片" },
  { key: "secondCheckImages", label: "复检图片" },
];

const HEADER_FIELDS = [
  { label: "订单编号", key: "orderNo" },
  { label: "客户编码", key: "customerCode" },
  { label: "产品编号", key: "productNo" },
  { label: "检验日期", key: "inspectionDate" },
  { label: "送检区域", key: "lineName" },
  { label: "生产产线", key: "productionLine" },
  { label: "班别", key: "workShift" },
  { label: "QA检验员", key: "qaInspector" },
  { label: "生产总检", key: "checker" },
  { label: "变更内容", key: "changeDesc" },
  { label: "固件版本", key: "firmwareVersion" },
  { label: "三防漆厚度", key: "coatingThickness" },
  { label: "有无附件", key: "attachInfo" },
  { label: "附件编码", key: "attachmentCode" },
  { label: "ECN/子件ECN", key: "ecn" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return dateStr.replace("T", " ");
};

// ============ 组件 ============

// 顶部导航栏
const TopNavBar = ({ header, onBack, onEntry }) => (
  <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
    <div className="flex items-center gap-4">
      <button
        className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
        onClick={onBack}
      >
        ← 返回检验单列表
      </button>
      <div className="h-6 w-px bg-gray-300"></div>
      <div>
        <div className="text-sm text-gray-600">订单编号</div>
        <div className="text-lg font-semibold text-gray-900">{header.orderNo || "-"}</div>
      </div>
      <div>
        <div className="text-sm text-gray-600">产品编号</div>
        <div className="text-lg font-semibold text-gray-900">{header.productNo || "-"}</div>
      </div>
    </div>
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
      onClick={onEntry}
    >
      返回条码录入 →
    </button>
  </div>
);

// 订单信息卡片
const OrderInfoCard = ({ header }) => (
  <div className="sheet-grid">
    <div className="sheet-section-header">订单信息</div>
    <div className="grid grid-cols-4 gap-0 text-xs bg-white">
      {HEADER_FIELDS.map((field) => (
        <div key={field.key} className="contents">
          <div className="border px-3 py-2 font-semibold text-gray-700 bg-gray-50">
            {field.label}
          </div>
          <div className="border px-3 py-2 text-gray-900">
            {header[field.key] || "-"}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 搜索栏
const SearchBar = ({ query, onQueryChange, onSearch }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3 flex-wrap items-center">
    <div className="flex gap-2 flex-1 min-w-[300px]">
      <input
        className="input flex-1"
        placeholder="按SN查询"
        value={query.sn || ""}
        onChange={(e) => onQueryChange({ ...query, sn: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
      />
      <input
        className="input flex-1"
        placeholder="按QA检验员查询"
        value={query.qaInspector || ""}
        onChange={(e) => onQueryChange({ ...query, qaInspector: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        onClick={onSearch}
      >
        查询
      </button>
      <button
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        onClick={() => onQueryChange({ sn: "", qaInspector: "" })}
      >
        清空
      </button>
    </div>
  </div>
);

// 数据表格
const DataTable = ({ lines, columns, onViewImages, onDelete, userRole }) => (
  <div className="border border-gray-200 rounded-lg overflow-x-auto w-full block">
    <table className="table min-w-[1800px] w-full">
      <thead>
        <tr>
          <th className="sheet-header-yellow sticky-col w-12 text-center">序号</th>
          {(userRole === "admin" || userRole === "ROLE_ADMIN" || userRole === "系统管理员") && (
            <th className="sheet-header-yellow sticky-col left-12 w-20 text-center">操作</th>
          )}
          {columns.map((col) => (
            <th key={col.key} className="sheet-header-yellow whitespace-nowrap">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr>
            <td colSpan={columns.length + 2} className="text-center py-8 text-gray-500">
              暂无数据
            </td>
          </tr>
        ) : (
          lines.map((l, idx) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="sticky-col font-medium text-gray-600 text-center">{l.seqNo || idx + 1}</td>
              {(userRole === "admin" || userRole === "ROLE_ADMIN" || userRole === "系统管理员") && (
                <td className="sticky-col left-12 text-center">
                  <button 
                    className="text-red-600 hover:text-red-800 font-medium"
                    onClick={() => onDelete(l.id)}
                  >
                    删除
                  </button>
                </td>
              )}
              {columns.map((col) => (
                <td key={col.key} className="text-xs whitespace-normal break-words max-w-xs">
                  {l[col.key] ? (
                    col.key === "defectImages" || col.key === "secondCheckImages" ? (
                      <div className="flex gap-1 flex-wrap">
                        {l[col.key].split(",").filter(Boolean).map((img, i) => (
                          <img
                            key={i}
                            src={resolveFileUrl(img)}
                            alt="Preview"
                            className="w-8 h-8 object-cover cursor-pointer hover:scale-110 transition-transform border border-gray-200 rounded"
                            onClick={() => onViewImages(l[col.key], col.label)}
                          />
                        ))}
                      </div>
                    ) : col.key === "inspectedAt" || col.key === "inspectionDate" || col.key === "secondScanTime" ? (
                      <span className="text-gray-900">{formatDate(l[col.key])}</span>
                    ) : (
                      <span className="text-gray-900">{l[col.key]}</span>
                    )
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// 图片查看模态框
const ImageViewer = ({ open, images, title, onClose }) => {
  if (!open) return null;
  const imgList = images.split(',').filter(Boolean);

  return (
    <Modal
      open={open}
      title={title || "图片预览"}
      onClose={onClose}
      footer={<button className="btn-outline" onClick={onClose}>关闭</button>}
    >
      <div className="grid grid-cols-2 gap-4">
        {imgList.map((url, i) => {
          const full = resolveFileUrl(url);
          return (
          <div key={i} className="border rounded p-2">
            <a href={full} target="_blank" rel="noopener noreferrer">
              <img src={full} alt={`Preview ${i}`} className="w-full h-48 object-contain hover:opacity-90" />
            </a>
          </div>
          );
        })}
        {imgList.length === 0 && <div className="text-gray-500 text-center col-span-2 py-8">暂无图片</div>}
      </div>
    </Modal>
  );
};

// ============ 主组件 ============
export default function ConformanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [header, setHeader] = useState({});
  const [lines, setLines] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState({ sn: "" });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState("");
  const [viewerTitle, setViewerTitle] = useState("");
  const userRole = getRole();

  const handleViewImages = (images, title) => {
    setCurrentImages(images || "");
    setViewerTitle(title || "图片预览");
    setViewerOpen(true);
  };

  const handleDeleteLine = async (lineId) => {
    if (!window.confirm("确定要删除该行记录吗？此操作不可撤销。")) return;
    try {
      const res = await deleteConformanceLine(lineId);
      if (res.code === 200) {
        alert("删除成功");
        load(); // 重新加载数据
      } else {
        alert("删除失败: " + res.message);
      }
    } catch (error) {
      console.error(error);
      alert("删除时发生错误");
    }
  };

  const load = async () => {
    if (!id || isNaN(Number(id))) {
       // Ideally we should redirect or show error, but for now just return
       return;
    }
    // 加载头部信息
    const h = await getConformanceHeader(id);
    if (h.code === 200) setHeader(h.data || {});

    // 构建查询参数
    const params = { page, size: 10, headerId: id };
    if (query.sn && query.sn.trim()) {
      params.productSn = query.sn.trim();
    }
    if (query.qaInspector && query.qaInspector.trim()) {
      params.qaInspector = query.qaInspector.trim();
    }

    // 加载明细数据
    const ls = await listConformanceLines(params);
    if (ls.code === 200) {
      setLines(ls.data.records || []);
      setTotal(ls.data.total || 0);
    }
  };

  useEffect(() => {
    load();
  }, [id, page, query]);

  const handleSearch = () => {
    setPage(1); // 重置到第一页
    load();
  };

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    setPage(1); // 查询条件改变时重置到第一页
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <TopNavBar
        header={header}
        onBack={() => navigate("/conformance")}
        onEntry={() => navigate(`/conformance/entry/${id}`)}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">条码录入信息详情</h1>
          <p className="text-gray-500 mt-1">订单编号：{header.orderNo || "-"}</p>
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
          .table-info-cell {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            background-color: #fafafa;
            color: #374151;
          }
          .left-12 {
            left: 3rem; /* 48px, standard for w-12 */
          }
          .sticky-col {
            position: sticky;
            left: 0;
            z-index: 10;
            background-color: white;
            border-right: 1px solid #e5e7eb;
          }
          th.sticky-col {
            z-index: 21;
          }
          .sheet-header-yellow.sticky-col {
            background-color: #fef9c3;
          }
        `}</style>

        {/* 订单信息卡片 */}
        <OrderInfoCard header={header} />

        {/* 抽样计划及检验标准 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-200 mb-4">
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

        {/* 搜索栏 */}
        <SearchBar
          query={query}
          onQueryChange={handleQueryChange}
          onSearch={handleSearch}
        />

        {/* 数据表格 */}
        <DataTable 
          lines={lines} 
          columns={TABLE_COLUMNS} 
          onViewImages={handleViewImages}
          onDelete={handleDeleteLine}
          userRole={userRole}
        />

        {/* 分页 */}
        <Pagination
          page={page}
          total={total}
          pageSize={10}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          onPageChange={setPage}
        />

        {/* 图片查看器 */}
        <ImageViewer
          open={viewerOpen}
          images={currentImages}
          title={viewerTitle}
          onClose={() => setViewerOpen(false)}
        />

        {/* 底部操作 */}
        <div className="flex gap-3 pt-4">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            onClick={() => navigate(`/conformance/entry/${id}`)}
          >
            返回条码录入
          </button>
          <button
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
            onClick={() => navigate("/conformance")}
          >
            返回检验单列表
          </button>
        </div>
      </div>
    </div>
  );
}
