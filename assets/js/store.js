/* =========================================================
   Lớp dữ liệu dùng chung cho trang chính và trang quản trị.
   • Có cấu hình Firebase → đọc từ Firestore (REST API, không cần SDK)
   • Chưa có → dùng PROFILE / ALBUMS / PROJECTS trong data.js
   ========================================================= */
const Store = (() => {
  "use strict";

  const online = () => typeof FIREBASE !== "undefined" && !!FIREBASE.projectId && !!FIREBASE.apiKey;
  const CACHE_KEY = "portfolio-data-v1";
  const CACHE_MS = 5 * 60 * 1000;

  /* ---------- Giải mã giá trị Firestore REST ---------- */
  function decode(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("nullValue" in v) return null;
    if ("timestampValue" in v) return v.timestampValue;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(decode);
    if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
    return null;
  }
  const decodeFields = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));
  const docId = (name) => name.slice(name.lastIndexOf("/") + 1);

  const base = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;

  async function getCollection(name) {
    const out = [];
    let token = "";
    do {
      const url = `${base()}/${name}?pageSize=300&key=${FIREBASE.apiKey}${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Firestore ${name}: ${res.status}`);
      const json = await res.json();
      for (const d of json.documents || []) out.push({ _id: docId(d.name), ...decodeFields(d.fields || {}) });
      token = json.nextPageToken || "";
    } while (token);
    return out;
  }

  async function getDoc(path) {
    const res = await fetch(`${base()}/${path}?key=${FIREBASE.apiKey}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firestore ${path}: ${res.status}`);
    const json = await res.json();
    return decodeFields(json.fields || {});
  }

  /* ---------- Album: danh sách phẳng (parentId) → cây ---------- */
  const byOrder = (a, b) =>
    (a.order ?? 0) - (b.order ?? 0) || String(b.date || "").localeCompare(String(a.date || "")) || String(a.title).localeCompare(String(b.title));

  function buildTree(flat) {
    const nodes = new Map(flat.map((a) => [a._id, { ...a, id: a.slug || a._id, photos: a.photos || [], children: [] }]));
    const roots = [];
    for (const n of nodes.values()) {
      const parent = n.parentId && nodes.get(n.parentId);
      (parent ? parent.children : roots).push(n);
    }
    const sortDeep = (list) => {
      list.sort(byOrder);
      list.forEach((n) => sortDeep(n.children));
      return list;
    };
    return sortDeep(roots);
  }

  async function loadOnline() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.t < CACHE_MS) return cached.data;
    } catch (_) {}

    const [profile, albums, projects] = await Promise.all([
      getDoc("site/profile"),
      getCollection("albums"),
      getCollection("projects"),
    ]);
    const data = {
      PROFILE: profile || (typeof PROFILE !== "undefined" ? PROFILE : {}),
      ALBUMS: buildTree(albums),
      PROJECTS: projects.sort(byOrder),
    };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
    } catch (_) {}
    return data;
  }

  async function load() {
    const local = {
      PROFILE: typeof PROFILE !== "undefined" ? PROFILE : {},
      ALBUMS: typeof ALBUMS !== "undefined" ? ALBUMS : [],
      PROJECTS: typeof PROJECTS !== "undefined" ? PROJECTS : [],
    };
    if (!online()) return { ...local, source: "local" };
    try {
      return { ...(await loadOnline()), source: "online" };
    } catch (err) {
      console.error("Không đọc được dữ liệu online, dùng data.js:", err);
      return { ...local, source: "local-fallback" };
    }
  }

  /* ---------- Ảnh Cloudinary: tự thu nhỏ & nén theo kích thước hiển thị ---------- */
  function img(src, width) {
    if (!src || !width || !/res\.cloudinary\.com\/.+\/image\/upload\//.test(src)) return src;
    return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }

  const clearCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (_) {}
  };

  return { online, load, img, buildTree, decodeFields, clearCache };
})();
