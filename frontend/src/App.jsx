import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Issues from "./pages/Issues";
import Audits from "./pages/Audits";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import SystemLogs from "./pages/SystemLogs";
import Workflow from "./pages/Workflow";
import Integration from "./pages/Integration";
import Conformance from "./pages/Conformance";
import ConformanceNew from "./pages/ConformanceNew";
import ConformanceEntry from "./pages/ConformanceEntry";
import ConformanceDetail from "./pages/ConformanceDetail";
import ConformanceNgDetail from "./pages/ConformanceNgDetail";
import AllConformanceRecords from "./pages/AllConformanceRecords";
import { getToken, getRole, getUser, getPerms } from "./utils/storage";
import { clearToken } from "./utils/storage";

function PrivateRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const token = getToken();
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const user = getUser();
  const perms = getPerms();
  const isAdmin = role === "ROLE_ADMIN";
  const hasMenuAdmin = isAdmin || (perms || []).includes("MENU_ADMIN");
  const hasMenuConformance = isAdmin || (perms || []).includes("MENU_CONFORMANCE");
  const isActive = (path) =>
    location.pathname === path ? "bg-white/10 text-white px-3 py-1 rounded" : "text-white/90 hover:text-white";
  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };
  return (
    <>
      {token && (
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
          <div className="app-container py-3 flex items-center gap-4">
            <div className="text-white font-semibold text-lg mr-2">QMS</div>
            {!role?.includes("ROLE_QA_INSPECTOR") && <Link to="/" className={isActive("/")}>仪表盘</Link>}
            {!role?.includes("ROLE_QA_INSPECTOR") && (
              <>
                <Link to="/documents" className={isActive("/documents")}>文档管理</Link>
                <Link to="/issues" className={isActive("/issues")}>质量问题</Link>
                <Link to="/audits" className={isActive("/audits")}>审核计划</Link>
                <Link to="/notifications" className={isActive("/notifications")}>通知中心</Link>
              </>
            )}
            {hasMenuConformance && <Link to="/conformance" className={isActive("/conformance")}>符合性检验</Link>}
            {hasMenuConformance && <Link to="/conformance-full-records" className={isActive("/conformance-full-records")}>SN记录表</Link>}
            {hasMenuAdmin && <span className="text-white/60">系统管理</span>}
            {hasMenuAdmin && <Link to="/users" className={isActive("/users")}>用户管理</Link>}
            {hasMenuAdmin && <Link to="/roles" className={isActive("/roles")}>角色管理</Link>}
            {hasMenuAdmin && <Link to="/permissions" className={isActive("/permissions")}>权限管理</Link>}
            {hasMenuAdmin && <Link to="/system-logs" className={isActive("/system-logs")}>系统日志</Link>}
            {hasMenuAdmin && <Link to="/workflow" className={isActive("/workflow")}>工作流管理</Link>}
            {hasMenuAdmin && <Link to="/integration" className={isActive("/integration")}>系统集成</Link>}
            <div className="flex-1" />
            <div className="flex items-center gap-2 mr-4 bg-white/10 px-2 py-1 rounded">
              <span className="text-white text-xs">操作日志</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localStorage.getItem("enable_operation_log") === "true"}
                  onChange={(e) => {
                    localStorage.setItem("enable_operation_log", e.target.checked ? "true" : "false");
                    window.location.reload(); // 刷新以使开关生效
                  }}
                />
                <div className="w-9 h-5 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
            {user && <span className="text-white/90 mr-2">已登录：{user}</span>}
            <button className="btn-outline bg-white/10 text-white border-white/30 hover:bg-white/20" onClick={logout}>退出登录</button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Dashboard />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Documents />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/issues"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Issues />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/audits"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Audits />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Notifications />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Users />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Roles />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Permissions />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/system-logs"
          element={
            <PrivateRoute>
              <div className="app-container">
                <SystemLogs />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/workflow"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Workflow />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/integration"
          element={
            <PrivateRoute>
              <div className="app-container">
                <Integration />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/conformance"
          element={
            <PrivateRoute>
              <div className="w-full px-4">
                <Conformance />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/conformance/new"
          element={
            <PrivateRoute>
              <div className="w-full px-4">
                <ConformanceNew />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/conformance/entry/:id"
          element={
            <PrivateRoute>
              <div className="w-full px-4">
                <ConformanceEntry />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/conformance/detail/:id"
          element={
            <PrivateRoute>
              <div className="w-full px-4">
                <ConformanceDetail />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/conformance/ng-detail/:id"
          element={
            <PrivateRoute>
              <div className="w-full px-4">
                <ConformanceNgDetail />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/conformance-full-records"
          element={
            <PrivateRoute>
              <div className="w-full px-4">
                <AllConformanceRecords />
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
