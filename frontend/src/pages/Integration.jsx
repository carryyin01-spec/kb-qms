import { useEffect, useState } from "react";
import { createIntegrationConfig, createIntegrationMapping, listIntegrationConfigs, listIntegrationMappings, listIntegrationLogs } from "../services/api";

export default function Integration() {
  const [configs, setConfigs] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cfg, setCfg] = useState({ systemCode: "", systemName: "", baseUrl: "", authType: "apikey", authConfig: "", apiVersion: "v1", isActive: 1, timeout: 30, retryTimes: 3 });
  const [map, setMap] = useState({ configId: "", localEntity: "document", remoteEntity: "DOC", direction: "out", fieldMapping: "{}", transformRules: "{}", autoSync: 0, syncSchedule: "0 */5 * * * ?" });

  const loadAll = async () => {
    const c = await listIntegrationConfigs(); if (c.code === 200) setConfigs(c.data || []);
    const m = await listIntegrationMappings(); if (m.code === 200) setMappings(m.data || []);
    const l = await listIntegrationLogs(); if (l.code === 200) setLogs(l.data || []);
  };
  useEffect(() => { loadAll(); }, []);

  const saveCfg = async (e) => {
    e.preventDefault();
    if (!cfg.systemCode || !cfg.systemName) return;
    await createIntegrationConfig(cfg);
    setCfg({ systemCode: "", systemName: "", baseUrl: "", authType: "apikey", authConfig: "", apiVersion: "v1", isActive: 1, timeout: 30, retryTimes: 3 });
    loadAll();
  };
  const saveMap = async (e) => {
    e.preventDefault();
    if (!map.configId) return;
    await createIntegrationMapping(map);
    setMap({ configId: "", localEntity: "document", remoteEntity: "DOC", direction: "out", fieldMapping: "{}", transformRules: "{}", autoSync: 0, syncSchedule: "0 */5 * * * ?" });
    loadAll();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">系统集成管理</h1>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">新增集成配置</h2>
          <form onSubmit={saveCfg} className="space-y-2">
            <input className="border p-2 rounded w-full" placeholder="系统编码" value={cfg.systemCode} onChange={e=>setCfg({...cfg, systemCode: e.target.value})} />
            <input className="border p-2 rounded w-full" placeholder="系统名称" value={cfg.systemName} onChange={e=>setCfg({...cfg, systemName: e.target.value})} />
            <input className="border p-2 rounded w-full" placeholder="基础URL" value={cfg.baseUrl} onChange={e=>setCfg({...cfg, baseUrl: e.target.value})} />
            <select className="border p-2 rounded w-full" value={cfg.authType} onChange={e=>setCfg({...cfg, authType: e.target.value})}>
              <option value="basic">Basic</option>
              <option value="oauth2">OAuth2</option>
              <option value="apikey">API Key</option>
            </select>
            <textarea className="border p-2 rounded w-full h-24" placeholder="认证配置(JSON或密文)" value={cfg.authConfig} onChange={e=>setCfg({...cfg, authConfig: e.target.value})} />
            <div className="flex gap-2">
              <input className="border p-2 rounded" placeholder="版本" value={cfg.apiVersion} onChange={e=>setCfg({...cfg, apiVersion: e.target.value})} />
              <input className="border p-2 rounded w-24" placeholder="超时" value={cfg.timeout} onChange={e=>setCfg({...cfg, timeout: Number(e.target.value || 30)})} />
              <input className="border p-2 rounded w-24" placeholder="重试" value={cfg.retryTimes} onChange={e=>setCfg({...cfg, retryTimes: Number(e.target.value || 3)})} />
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded">保存配置</button>
          </form>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">配置列表</h3>
            <ul className="list-disc pl-5">
              {configs.map(c => (<li key={c.id}>{c.systemCode} - {c.systemName} - {c.authType}</li>))}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">新增映射/调度</h2>
          <form onSubmit={saveMap} className="space-y-2">
            <select className="border p-2 rounded w-full" value={map.configId} onChange={e=>setMap({...map, configId: Number(e.target.value || "")})}>
              <option value="">选择配置</option>
              {configs.map(c => (<option key={c.id} value={c.id}>{c.systemName}</option>))}
            </select>
            <div className="flex gap-2">
              <input className="border p-2 rounded" placeholder="本地实体" value={map.localEntity} onChange={e=>setMap({...map, localEntity: e.target.value})} />
              <input className="border p-2 rounded" placeholder="远端实体" value={map.remoteEntity} onChange={e=>setMap({...map, remoteEntity: e.target.value})} />
              <select className="border p-2 rounded" value={map.direction} onChange={e=>setMap({...map, direction: e.target.value})}>
                <option value="in">入</option>
                <option value="out">出</option>
                <option value="both">双向</option>
              </select>
            </div>
            <textarea className="border p-2 rounded w-full h-24 font-mono" placeholder="字段映射(JSON)" value={map.fieldMapping} onChange={e=>setMap({...map, fieldMapping: e.target.value})} />
            <textarea className="border p-2 rounded w-full h-24 font-mono" placeholder="转换规则(JSON)" value={map.transformRules} onChange={e=>setMap({...map, transformRules: e.target.value})} />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1"><input type="checkbox" checked={!!map.autoSync} onChange={e=>setMap({...map, autoSync: e.target.checked ? 1 : 0})} />自动同步</label>
              <input className="border p-2 rounded flex-1" placeholder="调度表达式(CRON)" value={map.syncSchedule} onChange={e=>setMap({...map, syncSchedule: e.target.value})} />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">保存映射</button>
          </form>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">映射列表</h3>
            <ul className="list-disc pl-5">
              {mappings.map(m => (<li key={m.id}>{m.configId} - {m.localEntity} -> {m.remoteEntity} ({m.direction})</li>))}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="font-semibold mb-2">集成日志</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">时间</th>
              <th className="border p-2">系统</th>
              <th className="border p-2">方向</th>
              <th className="border p-2">操作</th>
              <th className="border p-2">状态</th>
              <th className="border p-2">耗时(ms)</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td className="border p-2">{l.createdAt}</td>
                <td className="border p-2">{l.configId}</td>
                <td className="border p-2">{l.direction}</td>
                <td className="border p-2">{l.operation}</td>
                <td className="border p-2">{l.status}</td>
                <td className="border p-2">{l.executionTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

