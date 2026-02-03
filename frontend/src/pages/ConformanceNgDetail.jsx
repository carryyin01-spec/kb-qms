import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getConformanceHeader, listConformanceLines, saveConformanceLine } from "../services/conformanceService";
import { uploadFile } from "../services/conformanceService";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";

// ============ 常量定义 ============
const TABLE_COLUMNS = [
  { key: "productSn", label: "产品SN" },
  { key: "inspectedAt", label: "检验日期" },
  { key: "result", label: "NG结果" },
  { key: "defectDesc", label: "检验不良描述" },
  { key: "issueType", label: "问题类型" },
  { key: "issueSubtype", label: "问题小类" },
  { key: "owner", label: "责任人" },
  { key: "ownerManager", label: "责任人主管" },
  { key: "ownerDept", label: "责任部门" },
  { key: "rootCause", label: "原因分析" },
  { key: "action", label: "改善对策" },
  { key: "remark", label: "备注" },
  { key: "lineName", label: "送检区域" },
  { key: "qaInspector", label: "QA检验员" },
  { key: "secondCheckResult", label: "二次检查结果" },
  { key: "secondScanTime", label: "二次扫描时间" },
  { key: "defectImages", label: "初检图片" },
  { key: "secondCheckImages", label: "复检图片" },
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
  console.log("Image Resolution Debug (NG Detail):", { original: u, path, baseUrl, finalUrl });
  return finalUrl;
};

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
      <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
        NG不合格详情
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

// 数据表格
const DataTable = ({ lines, columns, onUpload, onViewImages }) => (
  <div className="border border-gray-200 rounded-lg overflow-x-auto w-full block">
    <table className="table min-w-[1800px] w-full">
      <thead>
        <tr>
          <th className="sheet-header-yellow sticky-col w-12">序号</th>
          {columns.map((col) => (
            <th key={col.key} className="sheet-header-yellow whitespace-nowrap">
              {col.label}
            </th>
          ))}
          <th className="sheet-header-yellow sticky-col-right w-32">操作</th>
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr>
            <td colSpan={columns.length + 2} className="text-center py-8 text-gray-500">
              暂无NG数据
            </td>
          </tr>
        ) : (
          lines.map((l, idx) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="sticky-col font-medium text-gray-600">{l.seqNo || idx + 1}</td>
              {columns.map((col) => (
                <td key={col.key} className="text-xs whitespace-normal break-words max-w-xs">
                  {col.key === "defectImages" || col.key === "secondCheckImages" ? (
                    l[col.key] ? (
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
                    ) : (
                      <span className="text-gray-400">-</span>
                    )
                  ) : (
                    <span className="text-gray-900">
                      {col.key === "inspectedAt" || col.key === "secondScanTime"
                        ? formatDate(l[col.key])
                        : l[col.key] || <span className="text-gray-400">-</span>}
                    </span>
                  )}
                </td>
              ))}
              <td className="sticky-col-right bg-white border-l border-gray-200">
                <div className="flex flex-col gap-2 p-2">
                  <label className="btn-secondary text-xs px-2 py-1 cursor-pointer text-center">
                    上传复检图片
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUpload(l, e.target.files[0])}
                    />
                  </label>
                  {l.defectImages && (
                    <button
                      className="btn-outline text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onViewImages(l.defectImages, "初检图片预览")}
                    >
                      初检图片 ({l.defectImages.split(',').filter(Boolean).length})
                    </button>
                  )}
                  {l.secondCheckImages && (
                    <button
                      className="btn-outline text-xs px-2 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => onViewImages(l.secondCheckImages, "复检图片预览")}
                    >
                      复检图片 ({l.secondCheckImages.split(',').filter(Boolean).length})
                    </button>
                  )}
                </div>
              </td>
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



// ============ 主组件 ============
export default function ConformanceNgDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [header, setHeader] = useState({});
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState("");
  const [viewerTitle, setViewerTitle] = useState("");
  const [query, setQuery] = useState({ sn: "", qaInspector: "" });
  const [secondScanSn, setSecondScanSn] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    if (!id || isNaN(Number(id))) return;
    const h = await getConformanceHeader(id);
    if (h.code === 200) setHeader(h.data || {});

    // 后端目前不支持直接 filter by status='NG' via API params (unless we add it)
    // 但用户要求分页。如果后端没有 filter，我们在前端分页会很奇怪。
    // 这里我们先请求大批量，然后在前端过滤+分页，或者修改后端支持。
    // 为了简单且符合用户"NG显示分页"的需求，我们在前端对过滤后的NG数据进行分页。
    
    const params = { page: 1, size: 2000, headerId: id }; // 获取足够多的数据以供筛选
    if (query.sn && query.sn.trim()) params.productSn = query.sn.trim();
    if (query.qaInspector && query.qaInspector.trim()) params.qaInspector = query.qaInspector.trim();

    const ls = await listConformanceLines(params);
    if (ls.code === 200) {
      const all = ls.data.records || [];
      const ngs = all.filter(l => l.result === "NG");
      setTotal(ngs.length);
      
      // 前端分页切片
      const start = (page - 1) * 10;
      const end = start + 10;
      setLines(ngs.slice(start, end));
    }
  };

  useEffect(() => {
    load();
  }, [id, query, page]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    setPage(1);
  };

  const handleUpload = async (line, file) => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await uploadFile(file);
      if (res.code === 200 && res.data) {
        // 提取 URL 字符串，防止出现 [object Object]
        const newUrl = typeof res.data === 'string' ? res.data : res.data.url;
        const currentUrls = line.secondCheckImages ? line.secondCheckImages.split(',') : [];
        const newUrls = [...currentUrls, newUrl].join(',');
        
        // 更新行数据，使用 secondCheckImages 字段
        await saveConformanceLine({ ...line, secondCheckImages: newUrls });
        load(); // 重新加载以更新显示
      } else {
        alert("上传失败: " + (res.message || "未知错误"));
      }
    } catch (e) {
      console.error(e);
      alert("上传出错");
    } finally {
      setLoading(false);
    }
  };

  const handleViewImages = (images, title) => {
    setCurrentImages(images || "");
    setViewerTitle(title || "图片预览");
    setViewerOpen(true);
  };

  const handleSecondConfirm = async () => {
    const v = (secondScanSn || "").trim();
    if (!v) {
      alert("请先扫码/输入SN");
      return;
    }
    setLoading(true);
    try {
      const ls = await listConformanceLines({ page: 1, size: 50, headerId: id, productSn: v });
      if (ls.code !== 200) {
        alert(ls.message || "查询失败");
        return;
      }
      const recs = ls.data.records || [];
      const target = recs.find((x) => String(x.productSn || "").trim() === v && x.result === "NG");
      if (!target) {
        alert("未找到该SN的NG记录");
        return;
      }
      const res = await saveConformanceLine({ ...target, secondCheckResult: "OK" });
      if (res.code !== 200) {
        alert(res.message || "保存失败");
        return;
      }
      setSecondScanSn("");
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar
        header={header}
        onBack={() => navigate("/conformance")}
        onEntry={() => navigate(`/conformance/entry/${id}`)}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-red-700">NG 不合格条码详情</h1>
          <p className="text-gray-500 mt-1">仅显示不合格记录，支持图片上传</p>
        </div>

        <style>{`
          .sticky-col-right {
            position: sticky;
            right: 0;
            z-index: 10;
            box-shadow: -2px 0 5px rgba(0,0,0,0.05);
          }
        `}</style>

        {loading && <div className="text-blue-600">正在处理...</div>}

        {/* 搜索栏 */}
        <SearchBar
          query={query}
          onQueryChange={handleQueryChange}
          onSearch={handleSearch}
        />

        <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3 flex-wrap items-center">
          <div className="flex gap-2 flex-1 min-w-[300px]">
            <input
              className="input flex-1"
              placeholder="二次扫码SN确认合格"
              value={secondScanSn}
              onChange={(e) => setSecondScanSn(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSecondConfirm()}
            />
            <button className="btn-primary" onClick={handleSecondConfirm}>
              二次确认合格
            </button>
          </div>
        </div>

        <DataTable 
          lines={lines} 
          columns={TABLE_COLUMNS} 
          onUpload={handleUpload}
          onViewImages={handleViewImages}
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

        <ImageViewer  
          open={viewerOpen} 
          images={currentImages} 
          title={viewerTitle}
          onClose={() => setViewerOpen(false)} 
        />
      </div>
    </div>
  );
}
