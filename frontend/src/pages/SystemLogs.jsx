import { useEffect, useState } from "react";
import { getSystemLogs } from "../services/logService"; // 我们需要创建这个服务
import Pagination from "../components/Pagination";

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [username, setUsername] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getSystemLogs(page, 10, username);
      if (res.code === 200) {
        setLogs(res.data.records || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error("获取日志失败", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">系统操作日志</h1>
        <div className="flex gap-2">
          <input
            type="text"
            className="input"
            placeholder="按用户名搜索"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch}>查询</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">时间</th>
              <th className="px-4 py-2 text-left">用户</th>
              <th className="px-4 py-2 text-left">操作内容</th>
              <th className="px-4 py-2 text-left">模块</th>
              <th className="px-4 py-2 text-left">IP地址</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-10">加载中...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-10 text-gray-500">暂无日志记录</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium">{log.username || "系统"}</td>
                  <td className="px-4 py-2 text-sm">{log.operation || "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{log.module || "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{log.ip || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Pagination
          page={page}
          total={total}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
