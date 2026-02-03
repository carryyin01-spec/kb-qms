import { useEffect, useState } from "react";
import { getDashboardStats, listUsersByRole } from "../services/api";
import { getConformanceGlobalStats } from "../services/conformanceService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis, Treemap } from "recharts";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ documents: 0, issues: 0, audits: 0, notifications: 0 });
  const [conformanceStats, setConformanceStats] = useState({
    dayTotal: 0,
    dayFail: 0,
    dayPassRate: 0,
    weekTotal: 0,
    weekFail: 0,
    weekPassRate: 0,
    monthTotal: 0,
    monthFail: 0,
    monthPassRate: 0,
    allTotal: 0,
    allFail: 0,
    allPassRate: 0,
  });
  const [dist, setDist] = useState({ OPEN: 0, INVESTIGATING: 0, RESOLVED: 0, CLOSED: 0 });
  const [trend, setTrend] = useState([]);
  const [sev, setSev] = useState({ LOW: 0, MEDIUM: 0, HIGH: 0 });
  const [cat, setCat] = useState({ PROCESS: 0, DESIGN: 0, SUPPLIER: 0, AUDIT: 0 });
  const [mod, setMod] = useState({ MFG: 0, DESIGN: 0, SUPPLIER: 0, QA: 0 });
  const [dep, setDep] = useState({ MFG: 0, RND: 0, PROC: 0, QA: 0 });
  const [monthly, setMonthly] = useState([]);
  const [closeRateTrend, setCloseRateTrend] = useState([]);
  const [sevStack, setSevStack] = useState([]);
  const [kpi, setKpi] = useState({ openIssues: 0, closeRate: 0, avgResolutionDays: 0, overdueIssues: 0 });
  const [radar, setRadar] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [vendorRating, setVendorRating] = useState({ A: 0, B: 0, C: 0 });
  const [qpScatter, setQpScatter] = useState([]);
  const [supplyTree, setSupplyTree] = useState([]);
  const [qaUsers, setQaUsers] = useState([]);
  const [qaInspector, setQaInspector] = useState("");

  useEffect(() => {
    getDashboardStats().then(res => { if (res.code === 200) setStats(res.data); });
    listUsersByRole("ROLE_QA_INSPECTOR").then(res => {
      if (res.code === 200) setQaUsers(res.data?.records || []);
    });
    import("../services/api").then(({ getIssueStatusDistribution, getIssueTrend, getIssueSeverityDistribution, getIssueCategoryDistribution, getIssueModuleDistribution, getIssueDepartmentDistribution, getIssueMonthlyTrend, getIssueCloseRateTrend, getIssueSeverityStackTrend, getKpi, getDepartmentRadar, getIssueHeatmap, getVendorRatingDistribution, getQualityPriceScatter, getSupplyTree }) => {
      getIssueStatusDistribution().then(r => { if (r.code === 200) setDist(r.data); });
      getIssueTrend().then(r => { if (r.code === 200) setTrend(r.data || []); });
      getIssueSeverityDistribution().then(r => { if (r.code === 200) setSev(r.data || {}); });
      getIssueCategoryDistribution().then(r => { if (r.code === 200) setCat(r.data || {}); });
      getIssueModuleDistribution().then(r => { if (r.code === 200) setMod(r.data || {}); });
      getIssueDepartmentDistribution().then(r => { if (r.code === 200) setDep(r.data || {}); });
      getIssueMonthlyTrend().then(r => { if (r.code === 200) setMonthly(r.data || []); });
      getIssueCloseRateTrend().then(r => { if (r.code === 200) setCloseRateTrend(r.data || []); });
      getIssueSeverityStackTrend().then(r => { if (r.code === 200) setSevStack(r.data || []); });
      getKpi().then(r => { if (r.code === 200) setKpi(r.data || {}); });
      getDepartmentRadar().then(r => { if (r.code === 200) setRadar(r.data || []); });
      getIssueHeatmap().then(r => { if (r.code === 200) setHeatmap(r.data || []); });
      getVendorRatingDistribution().then(r => { if (r.code === 200) setVendorRating(r.data || {}); });
      getQualityPriceScatter().then(r => { if (r.code === 200) setQpScatter(r.data || []); });
      getSupplyTree().then(r => { if (r.code === 200) setSupplyTree(r.data || []); });
    });
  }, []);

  useEffect(() => {
    getConformanceGlobalStats(qaInspector ? { qaInspector } : undefined).then(res => {
      if (res.code === 200) setConformanceStats(res.data || {});
    });
  }, [qaInspector]);

  const formatDate = (d) => d.toISOString().slice(0, 10);

  const handleNgClick = (range) => {
    const params = new URLSearchParams();
    params.set("result", "NG");
    if (qaInspector) params.set("qaInspector", qaInspector);
    const today = new Date();
    if (range === "day") {
      const v = formatDate(today);
      params.set("startDate", v);
      params.set("endDate", v);
    }
    if (range === "week") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      params.set("startDate", formatDate(start));
      params.set("endDate", formatDate(today));
    }
    if (range === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      params.set("startDate", formatDate(start));
      params.set("endDate", formatDate(end));
    }
    navigate(`/conformance-full-records?${params.toString()}`);
  };

  const data = [
    { name: "文档", value: stats.documents },
    { name: "问题", value: stats.issues },
    { name: "审核", value: stats.audits },
    { name: "通知", value: stats.notifications }
  ];
  const distData = [
    { name: "打开", value: dist.OPEN },
    { name: "调查中", value: dist.INVESTIGATING },
    { name: "已解决", value: dist.RESOLVED },
    { name: "已关闭", value: dist.CLOSED }
  ];
  const COLORS = ["#60a5fa","#f59e0b","#10b981","#ef4444"];
  const sevData = [
    { name: "低", value: sev.LOW },
    { name: "中", value: sev.MEDIUM },
    { name: "高", value: sev.HIGH }
  ];
  const catData = [
    { name: "生产", value: cat.PROCESS || 0 },
    { name: "设计", value: cat.DESIGN || 0 },
    { name: "供应商", value: cat.SUPPLIER || 0 },
    { name: "审核", value: cat.AUDIT || 0 }
  ];
  const modData = [
    { name: "生产模块", value: mod.MFG || 0 },
    { name: "设计模块", value: mod.DESIGN || 0 },
    { name: "供应商模块", value: mod.SUPPLIER || 0 },
    { name: "质量模块", value: mod.QA || 0 }
  ];
  const depData = [
    { name: "制造部", value: dep.MFG || 0 },
    { name: "研发部", value: dep.RND || 0 },
    { name: "采购部", value: dep.PROC || 0 },
    { name: "质量部", value: dep.QA || 0 }
  ];
  const ratingData = [
    { name: "A", value: vendorRating.A || 0 },
    { name: "B", value: vendorRating.B || 0 },
    { name: "C", value: vendorRating.C || 0 }
  ];
  const gaugeData = [
    { name: "rate", value: Math.min(100, Math.max(0, kpi.closeRate || 0)) },
    { name: "rest", value: Math.max(0, 100 - (kpi.closeRate || 0)) }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">仪表盘</h1>
      <div className="mb-4 flex gap-3">
        <Link to="/documents" className="px-3 py-2 bg-blue-600 text-white rounded">进入文档管理</Link>
        <Link to="/issues" className="px-3 py-2 bg-blue-600 text-white rounded">进入质量问题</Link>
        <Link to="/conformance" className="px-3 py-2 bg-blue-600 text-white rounded">进入符合性检验</Link>
        <Link to="/conformance-full-records" className="px-3 py-2 bg-indigo-600 text-white rounded">SN记录表</Link>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-600">QA检验员</span>
        <select className="input" value={qaInspector} onChange={(e) => setQaInspector(e.target.value)}>
          <option value="">全部</option>
          {qaUsers.map(u => (
            <option key={u.id} value={u.name || u.username}>{u.name || u.username}</option>
          ))}
        </select>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>当日合格率监控</span>
            <Link to="/conformance" className="text-xs text-blue-600 hover:underline">查看详情</Link>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                <div className="text-xs text-gray-600">当日检验数</div>
                <div className="text-2xl font-bold text-green-700">{conformanceStats.dayTotal || 0}</div>
              </div>
              <button type="button" onClick={() => handleNgClick("day")} className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-xs text-gray-600">当日不良数</div>
                <div className="text-2xl font-bold text-red-700">{conformanceStats.dayFail || 0}</div>
              </button>
              <div className="text-center p-3 bg-green-100 rounded border border-green-300">
                <div className="text-xs text-gray-600">当日合格率</div>
                <div className="text-2xl font-bold text-green-800">{(conformanceStats.dayPassRate || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>本周合格率监控</span>
            <Link to="/conformance" className="text-xs text-blue-600 hover:underline">查看详情</Link>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                <div className="text-xs text-gray-600">本周检验数</div>
                <div className="text-2xl font-bold text-green-700">{conformanceStats.weekTotal || 0}</div>
              </div>
              <button type="button" onClick={() => handleNgClick("week")} className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-xs text-gray-600">本周不良数</div>
                <div className="text-2xl font-bold text-red-700">{conformanceStats.weekFail || 0}</div>
              </button>
              <div className="text-center p-3 bg-green-100 rounded border border-green-300">
                <div className="text-xs text-gray-600">本周合格率</div>
                <div className="text-2xl font-bold text-green-800">{(conformanceStats.weekPassRate || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>本月合格率监控</span>
            <Link to="/conformance" className="text-xs text-blue-600 hover:underline">查看详情</Link>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                <div className="text-xs text-gray-600">本月检验数</div>
                <div className="text-2xl font-bold text-green-700">{conformanceStats.monthTotal || 0}</div>
              </div>
              <button type="button" onClick={() => handleNgClick("month")} className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-xs text-gray-600">本月不良数</div>
                <div className="text-2xl font-bold text-red-700">{conformanceStats.monthFail || 0}</div>
              </button>
              <div className="text-center p-3 bg-green-100 rounded border border-green-300">
                <div className="text-xs text-gray-600">本月合格率</div>
                <div className="text-2xl font-bold text-green-800">{(conformanceStats.monthPassRate || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>所有合格率监控</span>
            <Link to="/conformance" className="text-xs text-blue-600 hover:underline">查看详情</Link>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                <div className="text-xs text-gray-600">总检验数</div>
                <div className="text-2xl font-bold text-green-700">{conformanceStats.allTotal || 0}</div>
              </div>
              <button type="button" onClick={() => handleNgClick("all")} className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-xs text-gray-600">总不良数</div>
                <div className="text-2xl font-bold text-red-700">{conformanceStats.allFail || 0}</div>
              </button>
              <div className="text-center p-3 bg-green-100 rounded border border-green-300">
                <div className="text-xs text-gray-600">总合格率</div>
                <div className="text-2xl font-bold text-green-800">{(conformanceStats.allPassRate || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="card-header">KPI</div>
          <div className="card-body grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-500">未关闭问题</div>
              <div className="text-xl font-semibold">{kpi.openIssues || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">关闭率</div>
              <div className="text-xl font-semibold">{(kpi.closeRate || 0).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">平均解决天数</div>
              <div className="text-xl font-semibold">{kpi.avgResolutionDays || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">超期问题</div>
              <div className="text-xl font-semibold">{kpi.overdueIssues || 0}</div>
            </div>
          </div>
        </div>
        <div className="card col-span-3">
          <div className="card-header">关闭率仪表</div>
          <div className="card-body h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={gaugeData} dataKey="value" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80}>
                  <Cell fill="#10b981" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={distData} outerRadius={100} label>
                {distData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={closeRateTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 h-64 card">
        <div className="card-header">按严重度堆叠趋势</div>
        <div className="card-body h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sevStack}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="LOW" stackId="a" stroke="#60a5fa" fill="#60a5fa" />
              <Area type="monotone" dataKey="MEDIUM" stackId="a" stroke="#f59e0b" fill="#f59e0b" />
              <Area type="monotone" dataKey="HIGH" stackId="a" stroke="#ef4444" fill="#ef4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={sevData} outerRadius={100} label>
                {sevData.map((entry, index) => (
                  <Cell key={`cell-sev-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={catData} outerRadius={100} label>
                {catData.map((entry, index) => (
                  <Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={modData} outerRadius={100} label>
                {modData.map((entry, index) => (
                  <Cell key={`cell-mod-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={depData} outerRadius={100} label>
                {depData.map((entry, index) => (
                  <Cell key={`cell-dep-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="card h-64">
          <div className="card-header">部门绩效雷达</div>
          <div className="card-body h-48">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dep" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card h-64">
          <div className="card-header">供应商评级分布</div>
          <div className="card-body h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={ratingData} outerRadius={90} label>
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-rating-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="card h-64">
          <div className="card-header">质量 vs 价格散点</div>
          <div className="card-body h-48">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="quality" name="质量" />
                <YAxis type="number" dataKey="price" name="价格" />
                <ZAxis range={[60, 60]} />
                <Scatter data={qpScatter} fill="#10b981" />
                <Tooltip />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card h-64">
          <div className="card-header">供应链层级树</div>
          <div className="card-body h-48">
            <ResponsiveContainer>
              <Treemap data={supplyTree} dataKey="size" stroke="#fff" fill="#3b82f6" />
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6 card">
        <div className="card-header">问题分布热力图</div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>模块\\严重度</th>
                  <th>低</th>
                  <th>中</th>
                  <th>高</th>
                </tr>
              </thead>
              <tbody>
                {["MFG","DESIGN","SUPPLIER","QA"].map(m => {
                  const row = {
                    LOW: (heatmap.find(h => h.module===m && h.severity==="LOW")?.count) || 0,
                    MEDIUM: (heatmap.find(h => h.module===m && h.severity==="MEDIUM")?.count) || 0,
                    HIGH: (heatmap.find(h => h.module===m && h.severity==="HIGH")?.count) || 0
                  };
                  const maxv = Math.max(row.LOW, row.MEDIUM, row.HIGH, 1);
                  const bg = v => ({ backgroundColor: `rgba(99,102,241,${(v/maxv)*0.8})` });
                  return (
                    <tr key={m}>
                      <td>{m}</td>
                      <td style={bg(row.LOW)}>{row.LOW}</td>
                      <td style={bg(row.MEDIUM)}>{row.MEDIUM}</td>
                      <td style={bg(row.HIGH)}>{row.HIGH}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
