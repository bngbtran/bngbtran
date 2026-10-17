/* =========================================================
   CHẾ ĐỘ CHỈNH SỬA — phủ lên đúng giao diện trang chính (app.js)
   • Bấm vào chữ để sửa trực tiếp
   • Rê chuột vào một mục: ✎ sửa chi tiết · ↑↓ đổi chỗ · ✕ xóa
   • "+ Thêm" ở cuối mỗi danh sách, kéo thả ảnh vào album
   • Sửa gì là tự lưu lên Firestore ngay; trang chính đang mở cập nhật realtime
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slugify = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clean = (v) => JSON.parse(JSON.stringify(v)); // Firestore không nhận undefined
const thumb = (src) => Store.img(src, 400);

/* ---------------- Khung: thanh điều khiển dưới cùng + thông báo ---------------- */

document.body.insertAdjacentHTML(
  "beforeend",
  `<div class="ed-dock" id="ed-dock"><span class="mono small dim">đang kết nối...</span></div>
   <div class="toasts" id="toasts" aria-live="polite"></div>`
);
const dock = document.getElementById("ed-dock");

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.classList.add("out"), 3200);
  setTimeout(() => el.remove(), 3600);
}

if (!Store.online()) {
  dock.innerHTML = `<span>Chưa cấu hình Firebase trong <code>assets/js/config.js</code> (xem HUONG_DAN.md).</span>`;
  throw new Error("Chưa cấu hình Firebase");
}

const fbApp = initializeApp(FIREBASE);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// Đợi app.js vẽ xong trang và đưa dữ liệu ra
const ready = new Promise((r) => (window.Portfolio ? r() : document.addEventListener("portfolio:ready", r, { once: true })));
const PF = () => window.Portfolio;

/* ---------------- Đăng nhập ---------------- */

function loginError(e) {
  const host = location.hostname;
  const map = {
    "auth/unauthorized-domain": `Tên miền <b>${esc(host)}</b> chưa được Firebase cho phép. Vào Firebase → Authentication → Settings →
      Authorized domains và thêm <code>${esc(host)}</code>${host === "127.0.0.1" ? `, hoặc mở bằng <code>http://localhost:${esc(location.port)}/admin</code>` : ""}.`,
    "auth/popup-blocked": "Trình duyệt chặn cửa sổ đăng nhập, đang chuyển sang đăng nhập bằng chuyển trang...",
    "auth/popup-closed-by-user": "Cửa sổ đăng nhập bị đóng trước khi xong. Bấm đăng nhập lại.",
    "auth/cancelled-popup-request": "Đang có một cửa sổ đăng nhập khác mở.",
    "auth/operation-not-allowed": "Đăng nhập Google chưa được bật (Firebase → Authentication → Sign-in method).",
    "auth/network-request-failed": "Không kết nối được tới Google. Kiểm tra mạng, VPN hoặc tiện ích chặn quảng cáo.",
    "auth/internal-error": "Lỗi từ Firebase. Thử tải lại trang hoặc tắt tiện ích chặn quảng cáo/cookie cho trang này.",
  };
  return map[e.code] || `Không đăng nhập được: ${esc(e.message)} <span class="mono small">(${esc(e.code || "")})</span>`;
}

/* ---------------- Nút ở góc phải header: đổi theo trạng thái đăng nhập ---------------- */

const ICON_LOCK = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
const ICON_EYE = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;

function headerButton(signedIn) {
  const btn = document.getElementById("header-admin");
  if (!btn) return;
  if (signedIn) {
    // Đã đăng nhập: về trang chính để xem kết quả
    btn.innerHTML = `${ICON_EYE} Xem trang`;
    btn.href = "index.html";
    btn.title = "Xem trang chính (không chỉnh sửa)";
    btn.onclick = null;
  } else {
    // Chưa đăng nhập: vẫn là "Quản trị", bấm vào mở hộp đăng nhập
    btn.innerHTML = `${ICON_LOCK} Quản trị`;
    btn.href = "admin.html";
    btn.title = "Đăng nhập để chỉnh sửa";
    btn.onclick = (e) => {
      e.preventDefault();
      dockLogin();
    };
  }
}

// Hộp đăng nhập ở giữa màn hình, hiện ngay khi vào trang quản trị
function loginPanel(body) {
  document.getElementById("ed-login")?.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="ed-login" id="ed-login" role="dialog" aria-modal="true" aria-labelledby="ed-login-title">
      <div class="ed-login-card">
        <span class="sig ed-login-sig" aria-hidden="true"></span>
        <p class="mono kicker"><span class="dot pulse"></span> khu vực quản trị</p>
        ${body}
      </div>
    </div>`
  );
  const box = document.getElementById("ed-login");
  box.querySelector("[data-login=view]")?.addEventListener("click", () => box.remove());
  return box;
}

function dockLogin(err) {
  document.body.classList.remove("editing");
  headerButton(false);
  dock.innerHTML = `
    <span class="ed-state"><span class="dot"></span> Chế độ xem</span>
    <button class="btn btn-primary btn-sm" data-login="open">Đăng nhập để chỉnh sửa</button>`;
  dock.querySelector("[data-login=open]").onclick = () => dockLogin();
  const box = loginPanel(`
    <h1 id="ed-login-title">Đăng nhập để <span class="serif">chỉnh sửa</span></h1>
    <p class="dim">Trang quản trị trông giống hệt trang chính: đăng nhập xong, bấm vào chữ để sửa,
      rê chuột vào từng mục để thêm, xóa, đổi chỗ.</p>
    <button class="btn btn-primary ed-google" data-login="google">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
      Đăng nhập với Google
    </button>
    <p class="small dim">Chỉ tài khoản <b>${esc(ADMIN_EMAIL)}</b> mới sửa được.</p>
    <p class="login-error" id="login-error" ${err ? "" : "hidden"}>${err ? loginError(err) : ""}</p>
    <button class="link-btn" data-login="view">Xem trang trước, chưa đăng nhập</button>`);
  const errBox = box.querySelector("#login-error");
  box.querySelector("[data-login=google]").onclick = async () => {
    errBox.hidden = true;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account", login_hint: ADMIN_EMAIL });
    const show = (e) => {
      console.error(e);
      errBox.hidden = false;
      errBox.innerHTML = loginError(e);
    };
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      show(e);
      if (e.code === "auth/popup-blocked") signInWithRedirect(auth, provider).catch(show);
    }
  };
}

getRedirectResult(auth).catch((e) => dockLogin(e));

onAuthStateChanged(auth, async (user) => {
  await ready;
  if (!user) return dockLogin();
  if (user.email !== ADMIN_EMAIL) {
    document.body.classList.remove("editing");
    headerButton(false);
    dock.innerHTML = `<span class="ed-state"><span class="dot"></span> Chế độ xem</span>`;
    loginPanel(`
      <h1 id="ed-login-title">Không có <span class="serif">quyền sửa</span></h1>
      <p class="dim">Tài khoản <b>${esc(user.email)}</b> không phải quản trị viên. Hãy đăng xuất rồi đăng nhập bằng <b>${esc(ADMIN_EMAIL)}</b>.</p>
      <button class="btn btn-primary" data-login="logout">Đăng xuất</button>`).querySelector("[data-login=logout]").onclick = () => signOut(auth);
    return;
  }
  startEditing(user);
});

/* =========================================================
   TRẠNG THÁI THAY ĐỔI
   ========================================================= */

const dirty = { profile: false, projects: new Set(), albums: new Set(), delProjects: new Set(), delAlbums: new Set() };
const dirtyCount = () =>
  (dirty.profile ? 1 : 0) + dirty.projects.size + dirty.albums.size + dirty.delProjects.size + dirty.delAlbums.size;
let me = null;

let saving = false, saveTimer = null, savedAt = null, saveError = "";

// Mọi thay đổi tự lưu sau ~0,7 giây; trang chính đang mở ở nơi khác cập nhật ngay (live.js)
function scheduleSave(delay = 700) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, delay);
}

function changed(kind, id) {
  if (kind === "profile") dirty.profile = true;
  else if (kind === "project") dirty.projects.add(id);
  else if (kind === "album") dirty.albums.add(id);
  scheduleSave();
  renderDock();
}

function refresh() {
  PF().refresh();
  if (dirtyCount()) scheduleSave();
  renderDock();
}

addEventListener("beforeunload", (e) => {
  if (dirtyCount() || saving) e.preventDefault();
});

function startEditing(user) {
  me = user;
  headerButton(true);
  document.getElementById("ed-login")?.remove();
  document.body.classList.add("editing");
  renderDock();
  decorate();
}

const hhmm = (d) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function renderDock() {
  if (!me) return;
  const pending = dirtyCount();
  const status = saveError
    ? `<span class="small err-text">Chưa lưu được: ${esc(saveError)}</span><button class="btn btn-primary btn-sm" data-dock="retry">Thử lại</button>`
    : saving
      ? `<span class="small warn"><span class="spin"></span> Đang lưu...</span>`
      : pending
        ? `<span class="small warn">Sắp lưu...</span>`
        : `<span class="small dim">${savedAt ? `Đã lưu lúc ${hhmm(savedAt)} · trang chính đã cập nhật` : "Sửa gì là tự lưu ngay"}</span>`;
  dock.innerHTML = `
    <span class="ed-state on"><span class="dot pulse"></span> Đang chỉnh sửa</span>
    ${status}
    <div class="ed-menu">
      <button class="btn btn-ghost btn-sm" data-dock="menu">Công cụ ▾</button>
      <div class="ed-menu-list" hidden>
        <button data-dock="measure">Đo kích thước ảnh còn thiếu</button>
        <button data-dock="export">Tải bản sao lưu (JSON)</button>
        <button data-dock="import">Nhập dữ liệu mẫu từ data.js</button>
        <a href="index.html" target="_blank">Mở trang chính ở tab mới ↗</a>
        <button data-dock="logout">Đăng xuất (${esc(me.email)})</button>
      </div>
    </div>`;
}

dock.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-dock]");
  if (!b) return;
  const act = b.dataset.dock;
  const menu = dock.querySelector(".ed-menu-list");
  if (act === "menu") return (menu.hidden = !menu.hidden);
  if (menu) menu.hidden = true;
  if (act === "retry") {
    saveError = "";
    return save();
  }
  if (act === "logout") {
    if (dirtyCount()) await save();
    if (dirtyCount() && !confirm("Còn thay đổi chưa lưu được. Vẫn đăng xuất?")) return;
    me = null;
    signOut(auth);
  }
  if (act === "export") exportBackup();
  if (act === "import") importSample();
  if (act === "measure") measurePhotos();
});

/* ---------------- Lưu lên Firestore ---------------- */

async function save() {
  clearTimeout(saveTimer);
  if (saving) return scheduleSave(300);
  if (!dirtyCount()) return;
  // Lấy phần việc hiện có rồi xóa khỏi hàng chờ; thay đổi mới trong lúc lưu sẽ vào lượt sau
  const job = {
    profile: dirty.profile,
    projects: [...dirty.projects], albums: [...dirty.albums],
    delProjects: [...dirty.delProjects], delAlbums: [...dirty.delAlbums],
  };
  dirty.profile = false;
  ["projects", "albums", "delProjects", "delAlbums"].forEach((k) => dirty[k].clear());

  const { P, PROJECTS } = PF();
  const batch = writeBatch(db);
  if (job.profile) batch.set(doc(db, "site", "profile"), clean(P));
  for (const id of job.projects) {
    const p = PROJECTS.find((x) => x._id === id);
    if (!p) continue;
    const { _id, ...data } = p;
    batch.set(doc(db, "projects", id), clean(data));
  }
  for (const id of job.delProjects) batch.delete(doc(db, "projects", id));
  for (const id of job.albums) {
    const a = findAlbum(id);
    if (a) batch.set(doc(db, "albums", id), albumDoc(a));
  }
  for (const id of job.delAlbums) batch.delete(doc(db, "albums", id));

  saving = true;
  renderDock();
  try {
    await batch.commit();
    savedAt = new Date();
    saveError = "";
    Store.clearCache();
  } catch (err) {
    console.error(err);
    // Trả lại hàng chờ để lần sau lưu tiếp
    if (job.profile) dirty.profile = true;
    ["projects", "albums", "delProjects", "delAlbums"].forEach((k) => job[k].forEach((id) => dirty[k].add(id)));
    saveError = err.code === "permission-denied" ? "không có quyền ghi (kiểm tra firestore.rules)" : err.message;
    toast(`Lỗi khi lưu: ${saveError}`, "err");
  }
  saving = false;
  renderDock();
  if (dirtyCount() && !saveError) scheduleSave(300);
}

const albumDoc = (a) =>
  clean({
    title: a.title || "",
    slug: a.slug || a.id,
    parentId: a.parentId || null,
    date: a.date || "",
    description: a.description || "",
    cover: a.cover || "",
    order: a.order ?? 0,
    photos: (a.photos || []).map(PF().photoOf),
  });

/* =========================================================
   GẮN NÚT CHỈNH SỬA LÊN TRANG MỖI LẦN VẼ LẠI
   ========================================================= */

const ADD_LABEL = {
  languages: "+ Thêm ngôn ngữ",
  spokenLanguages: "+ Ngôn ngữ giao tiếp",
  skillGroups: "+ Thêm nhóm kỹ năng",
  roadmap: "+ Thêm chặng",
  experience: "+ Thêm kinh nghiệm / học vấn",
  project: "+ Thêm dự án",
  album: "+ Thêm album",
};

document.addEventListener("portfolio:render", decorate);

function decorate() {
  if (!document.body.classList.contains("editing")) return;
  document.querySelectorAll("[data-edit]").forEach((el) => {
    el.contentEditable = "true";
    el.spellcheck = false;
  });
  document.querySelectorAll("[data-item]").forEach((el) => {
    if (el.querySelector(":scope > .ed-tools")) return;
    const kind = el.dataset.item;
    const fixed = el.hasAttribute("data-fixed");
    const btn = (act, label, title, cls = "") => `<span role="button" tabindex="0" class="${cls}" data-act="${act}" title="${title}">${label}</span>`;
    let html;
    if (kind === "profile") html = btn("edit", "✎ Thông tin cá nhân", "Sửa thông tin cá nhân, ảnh đại diện, liên kết");
    else if (kind === "photo")
      html = [
        btn("up", "←", "Lên trước"), btn("down", "→", "Ra sau"),
        btn("cover", "★", "Đặt làm ảnh bìa", el.hasAttribute("data-cover") ? "on" : ""),
        btn("edit", "✎", "Sửa chú thích"), btn("remove", "✕", "Xóa ảnh", "danger"),
      ].join("");
    else
      html = [
        btn("edit", "✎", "Sửa chi tiết"),
        ...(fixed ? [] : [btn("up", "↑", "Lên trước"), btn("down", "↓", "Ra sau")]),
        ...(el.hasAttribute("data-here") ? [] : [btn("remove", "✕", "Xóa", "danger")]),
      ].join("");
    el.insertAdjacentHTML("beforeend", `<span class="ed-tools">${html}</span>`);
  });
  document.querySelectorAll("[data-list]").forEach((el) => {
    if (el.nextElementSibling?.matches(".ed-add, .ed-drop")) return;
    const kind = el.dataset.list;
    if (kind === "photo")
      el.insertAdjacentHTML(
        "afterend",
        `<label class="ed-drop" data-album="${esc(el.dataset.album)}">
          <input type="file" accept="image/*" multiple hidden />
          <span class="mono">⇪ Kéo thả ảnh vào đây hoặc bấm để chọn</span>
          <span class="dim small">Ảnh tự nén và tải lên Cloudinary, bố cục tự xếp theo tỉ lệ ảnh</span>
        </label>`
      );
    else
      el.insertAdjacentHTML(
        "afterend",
        `<button type="button" class="ed-add" data-add="${kind}" data-parent="${esc(el.dataset.parent || "")}">${
          kind === "album" && el.dataset.parent ? "+ Thêm album con" : ADD_LABEL[kind]
        }</button>`
      );
  });
}

/* ---------------- Sửa chữ trực tiếp ---------------- */

function findAlbum(id, list = PF().ALBUMS) {
  for (const a of list) {
    if (a._id === id) return a;
    const f = findAlbum(id, PF().kids(a));
    if (f) return f;
  }
  return null;
}
const siblingsOf = (a) => (a.parentId ? findAlbum(a.parentId)?.children || [] : PF().ALBUMS);

function rawOf(path) {
  const { P } = PF();
  const [scope, key, field] = path.split(".");
  if (scope === "T") return (P.texts || {})[key] || (key === "statement" && P.statement) || TEXTS[key] || "";
  if (scope === "P") return P[key] || "";
  if (scope === "ALBUM") return findAlbum(key)?.[field] || "";
  return "";
}

function setPath(path, value) {
  const { P } = PF();
  const [scope, key, field] = path.split(".");
  if (scope === "T") {
    P.texts = { ...(P.texts || {}) };
    if (!value || value === TEXTS[key]) delete P.texts[key];
    else P.texts[key] = value;
    if (key === "statement") delete P.statement;
    changed("profile");
  } else if (scope === "P") {
    P[key] = value;
    changed("profile");
  } else if (scope === "ALBUM") {
    const a = findAlbum(key);
    if (!a) return;
    if (field === "title" && !value) return toast("Tên album không được để trống.", "err");
    a[field] = value;
    changed("album", key);
  }
}

document.addEventListener("focusin", (e) => {
  const el = e.target.closest?.("[data-edit]");
  if (!el || !document.body.classList.contains("editing")) return;
  // Hiện chữ gốc (có *đánh dấu*, {biến}, xuống dòng) để sửa
  el.textContent = rawOf(el.dataset.edit);
  el.dataset.before = el.textContent;
});

document.addEventListener("focusout", (e) => {
  const el = e.target.closest?.("[data-edit]");
  if (!el || !document.body.classList.contains("editing")) return;
  const value = el.innerText.replace(/ /g, " ").trim();
  if (el.dataset.cancel === undefined && value !== el.dataset.before) setPath(el.dataset.edit, value);
  delete el.dataset.cancel;
  // Vẽ lại để hiện định dạng (chữ nghiêng, số liệu...), trừ khi đang chuyển sang sửa chữ khác
  setTimeout(() => !document.activeElement?.closest?.("[data-edit]") && refresh());
});

document.addEventListener("keydown", (e) => {
  const el = e.target.closest?.("[data-edit]");
  if (!el) return;
  if (e.key === "Escape") {
    el.dataset.cancel = "";
    el.blur();
  } else if (e.key === "Enter" && !el.hasAttribute("data-multi")) {
    e.preventDefault();
    el.blur();
  }
});

// Đang sửa thì bấm vào chữ / nút không được mở link
document.addEventListener(
  "click",
  (e) => {
    if (!document.body.classList.contains("editing")) return;
    if (e.target.closest("[data-edit]")) {
      e.preventDefault();
      return;
    }
    const tool = e.target.closest(".ed-tools [data-act]");
    if (tool) {
      e.preventDefault();
      e.stopPropagation();
      return itemAction(tool.closest("[data-item]"), tool.dataset.act);
    }
    const add = e.target.closest(".ed-add");
    if (add) {
      e.preventDefault();
      return addItem(add.dataset.add, add.dataset.parent);
    }
  },
  true
);

/* =========================================================
   CÁC LOẠI MỤC: trường dữ liệu trong bảng sửa
   ========================================================= */

const LEVEL_OPTS = [[1, "1 · Mới học"], [2, "2 · Cơ bản"], [3, "3 · Thành thạo vừa"], [4, "4 · Thành thạo"], [5, "5 · Chuyên sâu"]];

const SCHEMA = {
  languages: { title: "Ngôn ngữ lập trình", fields: [
    { k: "name", label: "Tên", placeholder: "JavaScript" },
    { k: "level", label: "Mức độ", type: "select", options: LEVEL_OPTS },
    { k: "years", label: "Số năm", type: "number" },
    { k: "note", label: "Ghi chú", placeholder: "ES2022+, async, DOM" },
  ] },
  spokenLanguages: { title: "Ngôn ngữ giao tiếp", fields: [
    { k: "name", label: "Ngôn ngữ", placeholder: "Tiếng Anh" },
    { k: "level", label: "Mức độ", placeholder: "Đọc hiểu tài liệu kỹ thuật" },
  ] },
  skillGroups: { title: "Nhóm kỹ năng", fields: [
    { k: "title", label: "Tên nhóm", placeholder: "Frontend" },
    { k: "items", label: "Kỹ năng", hint: "(phân cách bằng dấu phẩy)", type: "csv", full: true, placeholder: "React, Next.js, Tailwind CSS" },
  ] },
  roadmap: { title: "Chặng trong lộ trình", fields: [
    { k: "title", label: "Chặng", placeholder: "Frontend Developer" },
    { k: "status", label: "Trạng thái", type: "select", options: [["done", "Đã hoàn thành"], ["current", "Hiện tại"], ["next", "Mục tiêu"]] },
    { k: "detail", label: "Chi tiết", full: true, placeholder: "React, TypeScript, tối ưu hiệu năng" },
  ] },
  experience: { title: "Kinh nghiệm & học vấn", fields: [
    { k: "type", label: "Loại", type: "select", options: [["work", "Công việc"], ["education", "Học vấn"], ["milestone", "Cột mốc"]] },
    { k: "period", label: "Thời gian", placeholder: "2025 — nay" },
    { k: "title", label: "Vị trí / tên", full: true, placeholder: "Frontend Developer" },
    { k: "org", label: "Nơi làm / trường", full: true, placeholder: "Tên công ty" },
    { k: "description", label: "Mô tả", type: "textarea", full: true },
    { k: "highlights", label: "Điểm nổi bật", hint: "(mỗi dòng 1 ý)", type: "lines", full: true },
    { k: "tech", label: "Công nghệ", hint: "(phân cách bằng dấu phẩy)", type: "csv", full: true },
  ] },
  project: { title: "Dự án", fields: [
    { k: "title", label: "Tên dự án", full: true },
    { k: "year", label: "Năm", type: "number" },
    { k: "featured", label: "Hiện ở “Dự án nổi bật”", type: "check" },
    { k: "description", label: "Mô tả", type: "textarea", rows: 3, full: true },
    { k: "tags", label: "Công nghệ", hint: "(phân cách bằng dấu phẩy)", type: "csv", full: true, placeholder: "React, TypeScript" },
    { k: "demo", label: "Link website", type: "url", full: true, placeholder: "https://..." },
    { k: "source", label: "Link mã nguồn", type: "url", full: true, placeholder: "https://github.com/..." },
    { k: "image", label: "Ảnh chụp màn hình", type: "image", folder: "projects", full: true },
  ] },
  album: { title: "Album", fields: [
    { k: "title", label: "Tên album", full: true, placeholder: "Bình Định" },
    { k: "date", label: "Thời gian", type: "month" },
    { k: "description", label: "Mô tả", type: "textarea", full: true },
  ] },
  photo: { title: "Ảnh", fields: [{ k: "caption", label: "Chú thích", full: true, placeholder: "Eo Gió lúc bình minh" }] },
  profile: { title: "Thông tin cá nhân", fields: [
    { k: "avatar", label: "Ảnh đại diện", type: "image", folder: "profile", full: true },
    { k: "name", label: "Họ tên", full: true },
    { k: "handle", label: "Tên tài khoản", hint: "(hiện ở ~/handle)" },
    { k: "role", label: "Vị trí / chức danh" },
    { k: "location", label: "Nơi ở" },
    { k: "startedCoding", label: "Năm bắt đầu code", type: "number" },
    { k: "openToWork", label: "Đang sẵn sàng nhận việc", type: "check", full: true },
    { k: "bio", label: "Giới thiệu ngắn", type: "textarea", rows: 3, full: true },
    { k: "about", label: "Giới thiệu dài", hint: "(trang Thông tin cá nhân, xuống dòng = sang đoạn mới)", type: "textarea", rows: 5, full: true },
    { k: "interests", label: "Sở thích", hint: "(mỗi dòng 1 mục)", type: "lines", full: true },
    { k: "taglines", label: "Tagline", hint: "(mỗi dòng 1 câu, đổi luân phiên)", type: "lines", full: true },
    { k: "learning", label: "Đang học", hint: "(mỗi dòng 1 mục)", type: "lines", full: true },
    { k: "links", label: "Liên kết", hint: "(mỗi dòng “tên: đường dẫn”; tên email & github có chỗ hiện riêng)", type: "kv", full: true, rows: 4 },
  ] },
};

/* ---------------- Ô nhập theo kiểu dữ liệu ---------------- */

function fieldHtml(f, value) {
  const attrs = `data-k="${f.k}" data-type="${f.type || "text"}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}`;
  const label = `<span>${esc(f.label)}${f.hint ? ` <span class="faint">${esc(f.hint)}</span>` : ""}</span>`;
  let input;
  if (f.type === "check")
    return `<label class="check ${f.full ? "full" : ""}"><input type="checkbox" ${attrs} ${value ? "checked" : ""} /> ${esc(f.label)}</label>`;
  if (f.type === "image")
    return `<div class="full image-field" data-image="${f.k}" data-folder="${esc(f.folder || "")}">${label}
      <div class="image-row">
        <div class="image-preview">${value ? `<img src="${esc(thumb(value))}" alt="" />` : `<span class="dim small">chưa có</span>`}</div>
        <div class="image-inputs">
          <input ${attrs} value="${esc(value || "")}" placeholder="Dán link ảnh, hoặc tải lên" />
          <div class="row-gap">
            <label class="btn btn-ghost btn-sm">Tải ảnh lên<input type="file" accept="image/*" hidden /></label>
            ${value ? `<button type="button" class="link-btn" data-clear-image>bỏ ảnh</button>` : ""}
          </div>
          <span class="mono small dim" data-status></span>
        </div>
      </div></div>`;
  if (f.type === "textarea" || f.type === "lines" || f.type === "kv") {
    const v = f.type === "lines" ? (value || []).join("\n") : f.type === "kv" ? Object.entries(value || {}).map(([k, u]) => `${k}: ${u}`).join("\n") : value ?? "";
    input = `<textarea ${attrs} rows="${f.rows || 3}">${esc(v)}</textarea>`;
  } else if (f.type === "select")
    input = `<select ${attrs}>${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value ?? f.options[0][0]) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  else
    input = `<input type="${{ number: "number", url: "url", month: "month" }[f.type] || "text"}" ${attrs} value="${esc(f.type === "csv" ? (value || []).join(", ") : value ?? "")}" />`;
  return `<label class="${f.full ? "full" : ""}">${label}${input}</label>`;
}

function readField(el) {
  const v = el.type === "checkbox" ? el.checked : el.value;
  switch (el.dataset.type) {
    case "check": return !!v;
    case "number": return v === "" ? null : Number(v);
    case "lines": return v.split("\n").map((s) => s.trim()).filter(Boolean);
    case "csv": return v.split(",").map((s) => s.trim()).filter(Boolean);
    case "select": return /^\d+$/.test(v) ? Number(v) : v;
    case "kv":
      return Object.fromEntries(
        v.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
          const i = l.indexOf(":");
          // "github: https://..." → tách ở dấu hai chấm đầu tiên không thuộc "https:"
          const j = /^\s*https?:/.test(l) ? -1 : i;
          return j > 0 ? [l.slice(0, j).trim(), l.slice(j + 1).trim()] : ["link", l];
        })
      );
    default: return v.trim();
  }
}

/* ---------------- Bảng sửa trượt từ bên phải ---------------- */

function openDrawer({ title, fields, value, onApply, onDelete }) {
  closeDrawer();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="ed-backdrop" id="ed-backdrop"></div>
     <aside class="ed-drawer" id="ed-drawer" role="dialog" aria-label="${esc(title)}">
       <header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-drawer="close" aria-label="Đóng">✕</button></header>
       <form class="form" id="ed-form">${fields.map((f) => fieldHtml(f, value[f.k])).join("")}</form>
       <footer>
         ${onDelete ? `<button type="button" class="btn btn-danger btn-sm" data-drawer="delete">Xóa</button>` : ""}
         <span style="flex:1"></span>
         <button type="button" class="btn btn-ghost btn-sm" data-drawer="close">Hủy</button>
         <button type="submit" form="ed-form" class="btn btn-primary btn-sm">Áp dụng</button>
       </footer>
     </aside>`
  );
  const drawer = document.getElementById("ed-drawer");
  const form = drawer.querySelector("form");
  form.querySelector("input, textarea, select")?.focus();
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries([...form.querySelectorAll("[data-k]")].map((el) => [el.dataset.k, readField(el)]));
    if (onApply(data) !== false) closeDrawer();
  };
  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("[data-drawer]")?.dataset.drawer;
    if (a === "close") closeDrawer();
    if (a === "delete" && onDelete() !== false) closeDrawer();
    const clr = e.target.closest("[data-clear-image]");
    if (clr) {
      const box = clr.closest("[data-image]");
      box.querySelector("[data-k]").value = "";
      box.querySelector(".image-preview").innerHTML = `<span class="dim small">chưa có</span>`;
    }
  });
  drawer.addEventListener("change", async (e) => {
    if (e.target.type !== "file") return;
    const box = e.target.closest("[data-image]");
    const file = e.target.files[0];
    const status = box.querySelector("[data-status]");
    if (!file) return;
    try {
      const res = await cloudinaryUpload(await shrink(file, 2000), file.name, `${CLOUDINARY.folder}/${box.dataset.folder}`, (x) => (status.textContent = `${x}%`));
      box.querySelector("[data-k]").value = res.secure_url;
      box.querySelector(".image-preview").innerHTML = `<img src="${esc(thumb(res.secure_url))}" alt="" />`;
      status.textContent = "đã tải lên";
    } catch (err) {
      status.textContent = "lỗi tải ảnh";
      toast(err.message, "err");
    }
  });
  document.getElementById("ed-backdrop").onclick = closeDrawer;
}

function closeDrawer() {
  document.getElementById("ed-drawer")?.remove();
  document.getElementById("ed-backdrop")?.remove();
}
document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

/* ---------------- Sửa / đổi chỗ / xóa một mục ---------------- */

const PROFILE_LISTS = ["languages", "spokenLanguages", "skillGroups", "roadmap", "experience"];
const swap = (arr, i, j) => j >= 0 && j < arr.length && ([arr[i], arr[j]] = [arr[j], arr[i]]);
const reorderAll = (arr, mark) => arr.forEach((x, i) => ((x.order = i), mark(x)));

function itemAction(el, act) {
  const { P, PROJECTS } = PF();
  const kind = el.dataset.item;
  const key = el.dataset.key;

  if (kind === "profile") {
    return openDrawer({
      ...SCHEMA.profile, value: P,
      onApply: (d) => {
        if (!d.name) return toast("Cần nhập họ tên.", "err"), false;
        Object.assign(P, d);
        changed("profile");
        refresh();
      },
    });
  }

  if (PROFILE_LISTS.includes(kind)) {
    const arr = (P[kind] = P[kind] || []);
    const i = +key;
    const remove = () => {
      if (!confirm("Xóa mục này?")) return false;
      arr.splice(i, 1);
      changed("profile");
      refresh();
    };
    if (act === "edit")
      return openDrawer({ ...SCHEMA[kind], value: arr[i], onApply: (d) => (Object.assign(arr[i], d), changed("profile"), refresh()), onDelete: remove });
    if (act === "up" || act === "down") swap(arr, i, act === "up" ? i - 1 : i + 1), changed("profile"), refresh();
    if (act === "remove") remove();
    return;
  }

  if (kind === "project") {
    const i = PROJECTS.findIndex((p) => p._id === key);
    const p = PROJECTS[i];
    const remove = () => {
      if (!confirm(`Xóa dự án "${p.title}"?`)) return false;
      PROJECTS.splice(i, 1);
      dirty.projects.delete(key);
      dirty.delProjects.add(key);
      refresh();
    };
    if (act === "edit")
      return openDrawer({ ...SCHEMA.project, value: p, onApply: (d) => (Object.assign(p, d), changed("project", key), refresh()), onDelete: remove });
    if (act === "up" || act === "down") {
      swap(PROJECTS, i, act === "up" ? i - 1 : i + 1);
      reorderAll(PROJECTS, (x) => dirty.projects.add(x._id));
      refresh();
    }
    if (act === "remove") remove();
    return;
  }

  if (kind === "album") {
    const a = findAlbum(key);
    const sibs = siblingsOf(a);
    const remove = () => {
      const all = [];
      const walk = (x) => (all.push(x._id), PF().kids(x).forEach(walk));
      walk(a);
      if (!confirm(`Xóa album "${a.title}"${all.length > 1 ? ` cùng ${all.length - 1} album con` : ""}?\n(File ảnh vẫn còn trên Cloudinary.)`)) return false;
      sibs.splice(sibs.indexOf(a), 1);
      all.forEach((id) => (dirty.albums.delete(id), dirty.delAlbums.add(id)));
      refresh();
    };
    if (act === "edit")
      return openDrawer({
        ...SCHEMA.album, value: a,
        onApply: (d) => {
          if (!d.title) return toast("Cần nhập tên album.", "err"), false;
          Object.assign(a, d);
          changed("album", key);
          refresh();
        },
        onDelete: el.hasAttribute("data-here") ? null : remove,
      });
    if (act === "up" || act === "down") {
      const i = sibs.indexOf(a);
      swap(sibs, i, act === "up" ? i - 1 : i + 1);
      reorderAll(sibs, (x) => dirty.albums.add(x._id));
      refresh();
    }
    if (act === "remove") remove();
    return;
  }

  if (kind === "photo") {
    const [albumId, idx] = key.split(":");
    const a = findAlbum(albumId);
    const photos = (a.photos = (a.photos || []).map(PF().photoOf));
    const i = +idx;
    const done = () => (changed("album", albumId), refresh());
    if (act === "edit") return openDrawer({ ...SCHEMA.photo, value: photos[i], onApply: (d) => (Object.assign(photos[i], d), done()) });
    if (act === "up" || act === "down") swap(photos, i, act === "up" ? i - 1 : i + 1), done();
    if (act === "cover") (a.cover = photos[i].src), toast("Đã đặt làm ảnh bìa."), done();
    if (act === "remove" && confirm("Xóa ảnh này khỏi album?")) {
      if (a.cover === photos[i].src) a.cover = "";
      photos.splice(i, 1);
      done();
    }
  }
}

/* ---------------- Thêm mục mới ---------------- */

function addItem(kind, parentId) {
  const { P, PROJECTS } = PF();
  if (PROFILE_LISTS.includes(kind))
    return openDrawer({
      ...SCHEMA[kind], title: `Thêm: ${SCHEMA[kind].title}`, value: {},
      onApply: (d) => {
        (P[kind] = P[kind] || []).push(d);
        changed("profile");
        refresh();
      },
    });

  if (kind === "project")
    return openDrawer({
      ...SCHEMA.project, title: "Thêm dự án", value: { year: new Date().getFullYear() },
      onApply: (d) => {
        if (!d.title) return toast("Cần nhập tên dự án.", "err"), false;
        const _id = doc(collection(db, "projects")).id;
        PROJECTS.push({ _id, ...d, order: PROJECTS.length });
        changed("project", _id);
        refresh();
      },
    });

  if (kind === "album")
    return openDrawer({
      ...SCHEMA.album, title: parentId ? "Thêm album con" : "Thêm album", value: {},
      onApply: (d) => {
        if (!d.title) return toast("Cần nhập tên album.", "err"), false;
        const sibs = parentId ? findAlbum(parentId).children : PF().ALBUMS;
        let slug = slugify(d.title) || "album";
        for (let n = 2; sibs.some((x) => x.id === slug); n++) slug = `${slugify(d.title)}-${n}`;
        const _id = doc(collection(db, "albums")).id;
        sibs.push({ _id, ...d, slug, id: slug, parentId: parentId || null, cover: "", photos: [], children: [], order: sibs.length });
        changed("album", _id);
        refresh();
        toast("Đã thêm album. Mở album để tải ảnh lên.");
      },
    });
}

/* ---------------- Tải ảnh vào album ---------------- */

document.addEventListener("change", (e) => {
  const drop = e.target.closest(".ed-drop");
  if (drop && e.target.type === "file") uploadPhotos(drop.dataset.album, [...e.target.files]);
});
["dragenter", "dragover"].forEach((ev) =>
  document.addEventListener(ev, (e) => {
    const drop = e.target.closest?.(".ed-drop");
    if (drop) e.preventDefault(), drop.classList.add("over");
  })
);
document.addEventListener("dragleave", (e) => e.target.closest?.(".ed-drop")?.classList.remove("over"));
document.addEventListener("drop", (e) => {
  const drop = e.target.closest?.(".ed-drop");
  if (!drop) return;
  e.preventDefault();
  drop.classList.remove("over");
  uploadPhotos(drop.dataset.album, [...e.dataTransfer.files]);
});

async function uploadPhotos(albumId, files) {
  files = files.filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  if (!CLOUDINARY.cloudName || !CLOUDINARY.uploadPreset) return toast("Chưa cấu hình CLOUDINARY trong config.js.", "err");
  const a = findAlbum(albumId);
  const chain = [];
  for (let x = a; x; x = x.parentId ? findAlbum(x.parentId) : null) chain.unshift(x.slug || x.id);
  const folder = [CLOUDINARY.folder, ...chain].filter(Boolean).join("/");
  const label = document.querySelector(`.ed-drop[data-album="${albumId}"] .mono`);
  const results = new Array(files.length);
  let done = 0, failed = 0;
  const queue = files.map((f, i) => [f, i]);
  const worker = async () => {
    while (queue.length) {
      const [file, i] = queue.shift();
      try {
        const res = await cloudinaryUpload(await shrink(file), file.name, folder, () => {});
        results[i] = { src: res.secure_url, caption: "", publicId: res.public_id, w: res.width, h: res.height };
      } catch (err) {
        console.error(err);
        failed++;
      }
      if (label) label.textContent = `Đang tải ${++done}/${files.length}...`;
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const ok = results.filter(Boolean);
  a.photos = [...(a.photos || []).map(PF().photoOf), ...ok];
  if (ok.length) changed("album", albumId);
  refresh();
  toast(failed ? `Đã thêm ${ok.length} ảnh, ${failed} ảnh lỗi.` : `Đã thêm ${ok.length} ảnh.`, failed ? "err" : "ok");
}

/* Thu nhỏ ảnh về tối đa 2560px, JPEG chất lượng 0.86 */
async function shrink(file, max = 2560) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

function cloudinaryUpload(blob, name, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", blob, name);
    fd.append("upload_preset", CLOUDINARY.uploadPreset);
    if (folder) fd.append("folder", folder);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const json = JSON.parse(xhr.responseText || "{}");
      xhr.status < 300 ? resolve(json) : reject(new Error(json.error?.message || xhr.status));
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng"));
    xhr.send(fd);
  });
}

/* =========================================================
   CÔNG CỤ
   ========================================================= */

function allAlbums(list = PF().ALBUMS, out = []) {
  list.forEach((a) => (out.push(a), allAlbums(PF().kids(a), out)));
  return out;
}

async function measurePhotos() {
  const size = (src) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => res(null);
      im.src = Store.img(src, 400); // bản thu nhỏ giữ đúng tỉ lệ, tải nhanh hơn
    });
  let n = 0;
  for (const a of allAlbums()) {
    const photos = (a.photos || []).map(PF().photoOf);
    const missing = photos.filter((p) => !p.w);
    if (!missing.length) continue;
    for (const p of missing) {
      const d = await size(p.src);
      if (d) Object.assign(p, d), n++;
    }
    a.photos = photos;
    changed("album", a._id);
  }
  refresh();
  toast(n ? `Đã đo ${n} ảnh.` : "Tất cả ảnh đã có kích thước.");
}

function exportBackup() {
  const { P, PROJECTS } = PF();
  const data = { exportedAt: new Date().toISOString(), profile: P, albums: allAlbums().map((a) => ({ _id: a._id, ...albumDoc(a) })), projects: PROJECTS };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  Object.assign(document.createElement("a"), { href: url, download: `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json` }).click();
  URL.revokeObjectURL(url);
}

async function importSample() {
  const { ALBUMS: cur, PROJECTS: curP } = PF();
  const warn = cur.length || curP.length ? `\n\nĐã có ${allAlbums().length} album và ${curP.length} dự án, nhập thêm sẽ tạo bản trùng.` : "";
  if (!confirm(`Nhập hồ sơ, album và dự án mẫu trong data.js lên Firestore?${warn}`)) return;
  const batch = writeBatch(db);
  const walk = (list, parentId) =>
    list.forEach((a, i) => {
      const ref = doc(collection(db, "albums"));
      batch.set(ref, clean({
        title: a.title, slug: a.id || slugify(a.title), parentId, date: a.date || "", description: a.description || "",
        cover: a.cover || "", order: i, photos: (a.photos || []).map(PF().photoOf),
      }));
      walk(a.children || [], ref.id);
    });
  walk(ALBUMS, null);
  PROJECTS.forEach((p, i) => batch.set(doc(collection(db, "projects")), clean({ ...p, order: i, featured: !!p.featured })));
  batch.set(doc(db, "site", "profile"), clean(PROFILE));
  try {
    await batch.commit();
    Store.clearCache();
    toast("Đã nhập dữ liệu mẫu.");
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    toast(`Lỗi: ${err.message}`, "err");
  }
}
