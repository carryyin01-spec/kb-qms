import { useState } from "react";
import { login } from "../services/authService";
import { setToken, setRole, setPerms, setUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";
import loginBg from "../assets/login-bg.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login({ username, password });
    if (res && res.code === 200) {
      setToken(res.data.token);
      if (res.data.name || res.data.username) setUser(res.data.name || res.data.username);
      if (res.data.role) setRole(res.data.role);
      if (res.data.permissions) setPerms(res.data.permissions);
      if (res.data.role === "ROLE_QA_INSPECTOR") {
        navigate("/conformance", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } else {
      setError(res?.message || "登录失败，请检查网络或后端服务是否启动");
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-end pr-[15%] bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* 蒙层，让登录框更突出 */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      <form onSubmit={submit} className="relative z-10 bg-white/95 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-[400px] space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-blue-700 tracking-tight">KB-QMS 质量管理系统</h1>
          <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input 
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              placeholder="请输入用户名" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input 
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              placeholder="请输入密码" 
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100 animate-pulse">
            {error}
          </div>
        )}
        
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg shadow-lg transform transition-active active:scale-[0.98]">
          立即登录
        </button>
        
        <div className="text-center text-gray-400 text-xs mt-8">
          © 2026 KB-QMS Quality Management System
        </div>
      </form>
    </div>
  );
}
