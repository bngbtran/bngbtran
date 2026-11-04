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
      if (cached && Date.now() - cached.t < CACHE_MS) {
        studyRepos = cached.repos || null;
        studyCourses = cached.courses || null;
        return cached.data;
      }
    } catch (_) {}

    const [profile, albums, projects] = await Promise.all([
      getDoc("site/profile"),
      getCollection("albums"),
      getCollection("projects"),
      loadStudyRepos(),
    ]);
    const data = shape(profile, albums, projects);
    saveCache(data);
    return data;
  }

  // Dữ liệu thô từ Firestore (REST hoặc realtime) → dạng trang dùng
  function shape(profile, albums, projects) {
    return {
      PROFILE: profile || (typeof PROFILE !== "undefined" ? PROFILE : {}),
      ALBUMS: buildTree(albums),
      PROJECTS: mergeProjects(projects),
      COURSES: mergeCourses(profile),
    };
  }

  /* ---------- Dự án: danh sách do GitHub Star List "Study" quyết định ----------
     Từ GitHub (luôn theo GitHub): danh sách repo, link website, link mã nguồn, năm.
     Từ GitHub nếu có, không thì lấy nội dung riêng: mô tả (Description), công nghệ (Topics).
     Nội dung riêng (Firestore > data.js): tên hiển thị, ảnh, nổi bật, thứ tự. */
  let studyRepos = null;
  let studyCourses = null;

  // Trả về true nếu đọc được danh sách mới từ GitHub
  async function loadStudyRepos() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch("/api/github-projects", { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return false;
      const json = await res.json();
      studyRepos = json.repos || null;
      studyCourses = json.courses || null;
      return !!studyRepos;
    } catch (_) {
      return false; // Không đọc được GitHub: giữ danh sách đang có, hoặc danh sách dự phòng trong data.js
    }
  }

  const repoOf = (p) => String(p.repo || (String(p.source || "").match(/github\.com\/[^/]+\/([^/?#]+)/) || [])[1] || "").toLowerCase();
  const filled = (o = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && !v.length)));

  function mergeProjects(saved) {
    const seeds = typeof PROJECTS !== "undefined" ? PROJECTS : [];
    const repos = studyRepos || seeds.filter((p) => p.repo).map((p) => ({ name: p.repo, url: p.source }));
    return repos
      .map((r, i) => {
        const key = r.name.toLowerCase();
        const doc = saved.find((p) => repoOf(p) === key);
        const own = { ...filled(seeds.find((p) => repoOf(p) === key)), ...filled(doc) };
        return {
          title: r.name,
          image: r.image || "",
          ...own,
          description: r.description || own.description || "",
          tags: (r.topics && r.topics.length && r.topics) || own.tags || (r.language ? [r.language] : []),
          demo: r.homepage != null ? r.homepage : own.demo || "",
          source: r.url || own.source || "",
          year: r.year || own.year || null,
          repo: r.name,
          _id: doc ? doc._id : `gh-${key}`,
          order: doc && doc.order != null ? doc.order : i,
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  // Tab Học tập: danh sách theo GitHub. Tên môn: admin (profile.courseNotes) > data.js.
  // Giới thiệu: Description trên GitHub > admin > data.js.
  function mergeCourses(profile) {
    const notes = (profile && profile.courseNotes) || {};
    const seeds = typeof COURSES !== "undefined" ? COURSES : [];
    return ["fpt", "fsb"].flatMap((group) => {
      const repos = (studyCourses && studyCourses[group]) || seeds.filter((c) => c.group === group).map((c) => ({ name: c.repo, language: c.language }));
      return repos.map((r) => {
        const seed = seeds.find((c) => c.repo.toLowerCase() === r.name.toLowerCase()) || {};
        const note = notes[r.name] || {};
        return {
          group,
          code: r.name,
          title: note.title || seed.title || "",
          githubIntro: r.description || "",
          intro: r.description || note.intro || seed.intro || "",
          language: r.language || seed.language || "",
          url: r.url || `https://github.com/bngbtran/${r.name}`,
        };
      });
    });
  }

  function saveCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data, repos: studyRepos, courses: studyCourses }));
    } catch (_) {}
  }

  async function load() {
    const local = {
      PROFILE: typeof PROFILE !== "undefined" ? PROFILE : {},
      ALBUMS: typeof ALBUMS !== "undefined" ? ALBUMS : [],
      PROJECTS: typeof PROJECTS !== "undefined" ? PROJECTS : [],
      COURSES: mergeCourses(),
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

  return { online, load, img, buildTree, decodeFields, clearCache, shape, saveCache, loadStudyRepos };
})();
