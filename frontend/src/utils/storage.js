export const setToken = (t) => {
  localStorage.setItem("qms_token", t);
  try { document.cookie = `qms_token=${t}; path=/; SameSite=Lax`; } catch {}
}
export const getToken = () => localStorage.getItem("qms_token");
export const clearToken = () => localStorage.removeItem("qms_token");
export const setRole = (r) => localStorage.setItem("qms_role", r || "");
export const getRole = () => localStorage.getItem("qms_role") || "";
export const setPerms = (arr) => localStorage.setItem("qms_perms", JSON.stringify(arr || []));
export const getPerms = () => {
  try { return JSON.parse(localStorage.getItem("qms_perms") || "[]"); } catch { return []; }
}
export const setUser = (u) => localStorage.setItem("qms_user", u || "");
export const getUser = () => localStorage.getItem("qms_user") || "";
