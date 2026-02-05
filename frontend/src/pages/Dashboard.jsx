import { useEffect, useState } from "react";
import { getDashboardStats, listUsersByRole } from "../services/api";
import { getConformanceGlobalStats } from "../services/conformanceService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ documents: 0, complaints: 0, audits: 0, notifications: 0 });
  const [conformanceStats, setConformanceStats] = useState({
    dayTotal: 0, dayFail: 0, dayPassRate: 0,
    weekTotal: 0, weekFail: 0, weekPassRate: 0,
    monthTotal: 0, monthFail: 0, monthPassRate: 0,
    allTotal: 0, allFail: 0, allPassRate: 0,
  });
  const [dist, setDist] = useState({ open: 0, "on-going": 0, closed: 0 });
  const [trend, setTrend] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [closeRateTrend, setCloseRateTrend] = useState([]);
  const [kpi, setKpi] = useState({ openComplaints: 0, closeRate: 0, avgResolutionDays: 0, overdueComplaints: 0 });
  const [radar, setRadar] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [qaUsers, setQaUsers] = useState([]);
  const [qaInspector, setQaInspector] = useState("");

  const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];

  useEffect(() => {
    getDashboardStats().then(res => { if (res.code === 200) setStats(res.data); });
    listUsersByRole("ROLE_QA_INSPECTOR").then(res => {
      if (res.code === 200) setQaUsers(res.data?.records || []);
    });
    import("../services/api").then(({ getComplaintStatusDistribution, getComplaintTrend, getComplaintMonthlyTrend, getComplaintCloseRateTrend, getKpi, getDepartmentRadar, getComplaintHeatmap }) => {
      getComplaintStatusDistribution().then(r => { if (r.code === 200) setDist(r.data); });
      getComplaintTrend().then(r => { if (r.code === 200) setTrend(r.data || []); });
      getComplaintMonthlyTrend().then(r => { if (r.code === 200) setMonthly(r.data || []); });
      getComplaintCloseRateTrend().then(r => { if (r.code === 200) setCloseRateTrend(r.data || []); });
      getKpi().then(r => { if (r.code === 200) setKpi(r.data || {}); });
      getDepartmentRadar().then(r => { if (r.code === 200) setRadar(r.data || []); });
      getComplaintHeatmap().then(r => { if (r.code === 200) setHeatmap(r.data || []); });
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
      params.set("startDate", v); params.set("endDate", v);
    }
    if (range === "week") {
      const start = new Date(today); start.setDate(start.getDate() - 6);
      params.set("startDate", formatDate(start)); params.set("endDate", formatDate(today));
    }
    if (range === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      params.set("startDate", formatDate(start)); params.set("endDate", formatDate(end));
    }
    if (range === "all") {
      // 不设置日期范围即为所有
    }
    navigate(`/conformance-full-records?${params.toString()}`);
  };

  const distData = Object.entries(dist).map(([name, value]) => ({ name, value }));
  const gaugeData = [
    { name: "rate", value: Math.min(100, Math.max(0, kpi.closeRate || 0)) },
    { name: "rest", value: Math.max(0, 100 - (kpi.closeRate || 0)) }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">仪表盘</h1>
      <div className="mb-4 flex gap-3">
        <Link to="/documents" className="px-3 py-2 bg-blue-600 text-white rounded">进入文档管理</Link>
        <Link to="/complaints" className="px-3 py-2 bg-blue-600 text-white rounded">进入客诉管理</Link>
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
            <Link to="/conformance-full-records" className="text-xs text-blue-600 hover:underline">查看详情</Link>
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
            <Link to="/conformance-full-records" className="text-xs text-blue-600 hover:underline">查看详情</Link>
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
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>本月合格率监控</span>
            <Link to="/conformance-full-records" className="text-xs text-blue-600 hover:underline">查看详情</Link>
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
            <Link to="/conformance-full-records" className="text-xs text-blue-600 hover:underline">查看详情</Link>
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
          <div className="card-header">客诉 KPI</div>
          <div className="card-body grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-500">未关闭客诉</div>
              <div className="text-xl font-semibold">{kpi.openComplaints || 0}</div>
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
              <div className="text-sm text-gray-500">超期客诉</div>
              <div className="text-xl font-semibold">{kpi.overdueComplaints || 0}</div>
            </div>
          </div>
        </div>
        <div className="card col-span-3">
          <div className="card-header">客诉关闭率</div>
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

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="card h-80">
          <div className="card-header">客诉状态分布</div>
          <div className="card-body h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={distData} outerRadius={80} label>
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card h-80">
          <div className="card-header">客诉周趋势</div>
          <div className="card-body h-64">
            <ResponsiveContainer>
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
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="card h-80">
          <div className="card-header">月度客诉数量</div>
          <div className="card-body h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card h-80">
          <div className="card-header">部门绩效雷达</div>
          <div className="card-body h-64">
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
      </div>
    </div>
  );
}
