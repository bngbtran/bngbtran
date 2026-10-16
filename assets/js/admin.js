import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const root = document.getElementById("admin");
const userBox = document.getElementById("admin-user");
const tabsNav = document.getElementById("admin-tabs");

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const thumb = (src) => Store.img(src, 400);
const slugify = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const photoOf = (p) => (typeof p === "string" ? { src: p, caption: "" } : p);

/* ---------------- Thông báo ---------------- */

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.classList.add("out"), 3200);
  setTimeout(() => el.remove(), 3600);
}

async function guard(fn, okMsg) {
  try {
    const r = await fn();
    if (okMsg) toast(okMsg);
    Store.clearCache();
    return r;
  } catch (err) {
    console.error(err);
    toast(err.code === "permission-denied" ? "Không có quyền ghi. Kiểm tra firestore.rules." : `Lỗi: ${err.message}`, "err");
    throw err;
  }
}

/* ---------------- Khởi động ---------------- */

if (!Store.online()) {
  root.innerHTML = `
    <section class="panel narrow">
      <h1>Chưa cấu hình <span class="grad">online</span></h1>
      <p class="dim">Hãy điền <code>FIREBASE</code> và <code>CLOUDINARY</code> trong <code>assets/js/config.js</code>,
      theo các bước trong <code>HUONG_DAN.md</code> (mục “Lưu dữ liệu online”).</p>
      <a class="btn btn-ghost" href="index.html">← Về trang chính</a>
    </section>`;
  throw new Error("Chưa cấu hình Firebase");
}

const fbApp = initializeApp(FIREBASE);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

const state = { tab: "albums", albums: [], projects: [], profile: null, selAlbum: null, selProject: null };

onAuthStateChanged(auth, async (user) => {
  if (!user) return viewLogin();
  if (user.email !== ADMIN_EMAIL) {
    userBox.innerHTML = "";
    tabsNav.hidden = true;
    root.innerHTML = `
      <section class="panel narrow">
        <h1>Không có quyền</h1>
        <p class="dim">Tài khoản <b>${esc(user.email)}</b> không phải quản trị viên.</p>
        <button class="btn btn-ghost" id="logout">Đăng xuất</button>
      </section>`;
    root.querySelector("#logout").onclick = () => signOut(auth);
    return;
  }
  userBox.innerHTML = `<span class="dim">${esc(user.email)}</span> <button class="link-btn" id="logout">đăng xuất</button>`;
  userBox.querySelector("#logout").onclick = () => signOut(auth);
  tabsNav.hidden = false;
  root.innerHTML = `<div class="loading mono"><span class="dot"></span> đang tải dữ liệu...</div>`;
  await reloadAll();
  render();
});

function viewLogin() {
  userBox.innerHTML = "";
  tabsNav.hidden = true;
  root.innerHTML = `
    <section class="panel narrow center">
      <p class="mono kicker"><span class="dot"></span> khu vực quản trị</p>
      <h1>Đăng nhập để <span class="grad">quản lý</span></h1>
      <p class="dim">Chỉ tài khoản Google của chủ trang mới vào được.</p>
      <button class="btn btn-primary" id="login">Đăng nhập với Google</button>
    </section>`;
  root.querySelector("#login").onclick = () =>
    signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => toast(e.message, "err"));
}

async function reloadAll() {
  const [a, p, prof] = await Promise.all([
    getDocs(collection(db, "albums")),
    getDocs(collection(db, "projects")),
    getDoc(doc(db, "site", "profile")),
  ]);
  state.albums = a.docs.map((d) => ({ _id: d.id, ...d.data() }));
  state.projects = p.docs.map((d) => ({ _id: d.id, ...d.data() }));
  state.projects.sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || (y.year ?? 0) - (x.year ?? 0));
  state.profile = prof.exists() ? prof.data() : null;
}

tabsNav.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]");
  if (!t) return;
  state.tab = t.dataset.tab;
  render();
});

function render() {
  tabsNav.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === state.tab));
  ({ albums: renderAlbums, projects: renderProjects, profile: renderProfile, tools: renderTools })[state.tab]();
}

/* =========================================================
   ALBUM
   ========================================================= */

const albumById = (id) => state.albums.find((a) => a._id === id);
const childrenOf = (id) =>
  state.albums
    .filter((a) => (a.parentId || null) === id)
    .sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || String(x.title).localeCompare(String(y.title)));
const descendants = (id) => childrenOf(id).flatMap((c) => [c._id, ...descendants(c._id)]);
const chainOf = (a) => {
  const out = [];
  for (let cur = a; cur; cur = cur.parentId ? albumById(cur.parentId) : null) out.unshift(cur);
  return out;
};
const countPhotosDeep = (id) =>
  (albumById(id)?.photos || []).length + childrenOf(id).reduce((n, c) => n + countPhotosDeep(c._id), 0);

function treeHtml(parentId = null, depth = 0) {
  return childrenOf(parentId)
    .map(
      (a) => `
      <button class="tree-item ${state.selAlbum === a._id ? "active" : ""}" data-album="${a._id}" style="--d:${depth}">
        <span class="tree-icon mono">${childrenOf(a._id).length ? "▾" : "•"}</span>
        <span class="tree-title">${esc(a.title)}</span>
        <span class="tree-count mono">${countPhotosDeep(a._id)}</span>
      </button>
      ${treeHtml(a._id, depth + 1)}`
    )
    .join("");
}

function renderAlbums() {
  const sel = state.selAlbum === "new" || state.selAlbum?.startsWith?.("new:") ? null : albumById(state.selAlbum);
  const isNew = typeof state.selAlbum === "string" && state.selAlbum.startsWith("new");
  const newParent = isNew ? state.selAlbum.split(":")[1] || "" : "";

  root.innerHTML = `
    <div class="split">
      <aside class="panel side">
        <div class="side-head">
          <h2>Album</h2>
          <button class="btn btn-primary btn-sm" data-act="new-root">+ Album gốc</button>
        </div>
        <div class="tree">${treeHtml() || `<p class="dim small">Chưa có album nào.</p>`}</div>
      </aside>
      <section class="panel editor">
        ${sel || isNew ? albumEditor(sel, newParent) : `<p class="dim">Chọn một album bên trái hoặc tạo album mới.</p>`}
      </section>
    </div>`;

  root.querySelector(".tree").onclick = (e) => {
    const b = e.target.closest("[data-album]");
    if (b) {
      state.selAlbum = b.dataset.album;
      renderAlbums();
    }
  };
  root.querySelector('[data-act="new-root"]').onclick = () => {
    state.selAlbum = "new";
    renderAlbums();
  };
  if (sel || isNew) bindAlbumEditor(sel, newParent);
}

function parentOptions(current, selected) {
  const banned = current ? new Set([current._id, ...descendants(current._id)]) : new Set();
  const opts = [];
  const walk = (pid, depth) =>
    childrenOf(pid).forEach((a) => {
      if (!banned.has(a._id))
        opts.push(`<option value="${a._id}" ${a._id === selected ? "selected" : ""}>${"— ".repeat(depth)}${esc(a.title)}</option>`);
      walk(a._id, depth + 1);
    });
  walk(null, 0);
  return `<option value="">(Album gốc)</option>${opts.join("")}`;
}

function albumEditor(a, newParent) {
  const crumbs = a ? chainOf(a).map((x) => esc(x.title)).join(" / ") : "Album mới";
  const photos = (a?.photos || []).map(photoOf);
  return `
    <div class="editor-head">
      <div>
        <p class="mono dim small">${crumbs}</p>
        <h2>${a ? esc(a.title) : "Tạo album mới"}</h2>
      </div>
      ${a ? `<div class="row-gap">
        <button class="btn btn-ghost btn-sm" data-act="add-child">+ Album con</button>
        <a class="btn btn-ghost btn-sm" target="_blank" href="index.html#/albums/${chainOf(a).map((x) => encodeURIComponent(x.slug)).join("/")}">Xem ↗</a>
      </div>` : ""}
    </div>

    <form class="form" id="album-form">
      <label>Tên album <input name="title" required value="${esc(a?.title || "")}" placeholder="vd: Bình Định" /></label>
      <label>Đường link (slug) <input name="slug" value="${esc(a?.slug || "")}" placeholder="tự tạo từ tên" pattern="[a-z0-9-]*" /></label>
      <label>Nằm trong album <select name="parentId">${parentOptions(a, a ? a.parentId || "" : newParent)}</select></label>
      <label>Thời gian <input name="date" type="month" value="${esc(a?.date || "")}" /></label>
      <label>Thứ tự hiển thị <input name="order" type="number" value="${esc(a?.order ?? 0)}" /></label>
      <label class="full">Mô tả <textarea name="description" rows="2">${esc(a?.description || "")}</textarea></label>
      <div class="form-actions full">
        <button class="btn btn-primary" type="submit">${a ? "Lưu thông tin" : "Tạo album"}</button>
        ${a ? `<button class="btn btn-danger" type="button" data-act="delete">Xóa album</button>` : ""}
      </div>
    </form>

    ${
      a
        ? `
    <div class="photos-head">
      <h3>Ảnh <span class="mono dim">(${photos.length})</span></h3>
      <label class="check"><input type="checkbox" id="compress" checked /> Nén ảnh trước khi tải (tiết kiệm dung lượng)</label>
    </div>
    <label class="dropzone" id="dropzone">
      <input type="file" id="files" accept="image/*" multiple hidden />
      <span class="mono">⇪ Kéo thả ảnh vào đây hoặc bấm để chọn</span>
      <span class="dim small">Ảnh được lưu trên Cloudinary, thư mục ${esc(uploadFolder(a))}</span>
    </label>
    <div class="uploads" id="uploads"></div>
    <div class="photo-admin-grid">
      ${photos
        .map(
          (p, i) => `
        <div class="photo-admin ${a.cover === p.src ? "is-cover" : ""}" data-i="${i}">
          <img src="${esc(thumb(p.src))}" alt="" loading="lazy" />
          ${a.cover === p.src ? `<span class="cover-badge mono">bìa</span>` : ""}
          <input class="caption" value="${esc(p.caption || "")}" placeholder="Chú thích..." />
          <div class="photo-tools">
            <button type="button" data-ph="left" title="Lên trước">←</button>
            <button type="button" data-ph="right" title="Ra sau">→</button>
            <button type="button" data-ph="cover" title="Đặt làm ảnh bìa">★</button>
            <button type="button" data-ph="remove" title="Xóa khỏi album" class="danger">✕</button>
          </div>
        </div>`
        )
        .join("")}
    </div>`
        : `<p class="dim small">Tạo album xong mới thêm được ảnh.</p>`
    }`;
}

const uploadFolder = (a) => [CLOUDINARY.folder, ...chainOf(a).map((x) => x.slug)].filter(Boolean).join("/");

function bindAlbumEditor(a, newParent) {
  const form = root.querySelector("#album-form");
  const titleIn = form.elements.title;
  const slugIn = form.elements.slug;
  let slugTouched = !!a;
  slugIn.addEventListener("input", () => (slugTouched = true));
  titleIn.addEventListener("input", () => {
    if (!slugTouched) slugIn.value = slugify(titleIn.value);
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = form.elements;
    const data = {
      title: f.title.value.trim(),
      slug: slugify(f.slug.value || f.title.value),
      parentId: f.parentId.value || null,
      date: f.date.value || "",
      order: Number(f.order.value) || 0,
      description: f.description.value.trim(),
    };
    if (!data.slug) return toast("Slug không hợp lệ.", "err");
    const clash = state.albums.find((x) => (x.parentId || null) === data.parentId && x.slug === data.slug && x._id !== a?._id);
    if (clash) return toast(`Đã có album "${clash.title}" dùng slug "${data.slug}" ở cùng cấp.`, "err");

    if (a) {
      await guard(() => updateDoc(doc(db, "albums", a._id), data), "Đã lưu album.");
      Object.assign(a, data);
    } else {
      const ref = await guard(() => addDoc(collection(db, "albums"), { ...data, photos: [], cover: "" }), "Đã tạo album.");
      state.albums.push({ _id: ref.id, ...data, photos: [], cover: "" });
      state.selAlbum = ref.id;
    }
    renderAlbums();
  };

  if (!a) return;

  root.querySelector('[data-act="add-child"]').onclick = () => {
    state.selAlbum = `new:${a._id}`;
    renderAlbums();
  };

  root.querySelector('[data-act="delete"]').onclick = async () => {
    if (childrenOf(a._id).length) return toast("Album còn album con, hãy xóa hoặc chuyển chúng trước.", "err");
    if (!confirm(`Xóa album "${a.title}" và ${(a.photos || []).length} ảnh trong đó?\n(File ảnh vẫn còn trên Cloudinary.)`)) return;
    await guard(() => deleteDoc(doc(db, "albums", a._id)), "Đã xóa album.");
    state.albums = state.albums.filter((x) => x._id !== a._id);
    state.selAlbum = a.parentId || null;
    renderAlbums();
  };

  // Thao tác với ảnh
  const savePhotos = (msg) => guard(() => updateDoc(doc(db, "albums", a._id), { photos: a.photos, cover: a.cover || "" }), msg);
  const grid = root.querySelector(".photo-admin-grid");
  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-ph]");
    if (!btn) return;
    const i = +btn.closest("[data-i]").dataset.i;
    const list = (a.photos = (a.photos || []).map(photoOf));
    const act = btn.dataset.ph;
    if (act === "left" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
    else if (act === "right" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
    else if (act === "cover") a.cover = list[i].src;
    else if (act === "remove") {
      if (!confirm("Xóa ảnh này khỏi album?")) return;
      if (a.cover === list[i].src) a.cover = "";
      list.splice(i, 1);
    } else return;
    await savePhotos();
    renderAlbums();
  });
  grid.addEventListener("change", async (e) => {
    if (!e.target.classList.contains("caption")) return;
    const i = +e.target.closest("[data-i]").dataset.i;
    a.photos = (a.photos || []).map(photoOf);
    a.photos[i].caption = e.target.value.trim();
    await savePhotos("Đã lưu chú thích.");
  });

  // Upload
  const drop = root.querySelector("#dropzone");
  const input = root.querySelector("#files");
  const start = (files) => uploadToAlbum(a, [...files].filter((f) => f.type.startsWith("image/")));
  input.onchange = () => start(input.files);
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => (e.preventDefault(), drop.classList.add("over"))));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => (e.preventDefault(), drop.classList.remove("over"))));
  drop.addEventListener("drop", (e) => start(e.dataTransfer.files));
}

async function uploadToAlbum(a, files) {
  if (!files.length) return;
  if (!CLOUDINARY.cloudName || !CLOUDINARY.uploadPreset) return toast("Chưa cấu hình CLOUDINARY trong config.js.", "err");
  const box = root.querySelector("#uploads");
  const compress = root.querySelector("#compress").checked;
  const folder = uploadFolder(a);
  const results = [];

  // Tải song song tối đa 3 ảnh một lúc
  const queue = files.map((file) => {
    const row = document.createElement("div");
    row.className = "upload-row mono";
    row.innerHTML = `<span class="name">${esc(file.name)}</span><span class="bar"><i></i></span><span class="pct">0%</span>`;
    box.appendChild(row);
    return { file, row };
  });
  const worker = async () => {
    while (queue.length) {
      const { file, row } = queue.shift();
      try {
        const blob = compress ? await shrink(file) : file;
        const res = await cloudinaryUpload(blob, file.name, folder, (p) => {
          row.querySelector("i").style.width = `${p}%`;
          row.querySelector(".pct").textContent = `${p}%`;
        });
        results.push({ src: res.secure_url, caption: "", publicId: res.public_id, w: res.width, h: res.height, _name: file.name });
        row.classList.add("done");
      } catch (err) {
        console.error(err);
        row.classList.add("fail");
        row.querySelector(".pct").textContent = "lỗi";
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  if (!results.length) return toast("Không tải được ảnh nào.", "err");
  // Giữ đúng thứ tự file đã chọn
  results.sort((x, y) => files.findIndex((f) => f.name === x._name) - files.findIndex((f) => f.name === y._name));
  a.photos = [...(a.photos || []).map(photoOf), ...results.map(({ _name, ...p }) => p)];
  await guard(() => updateDoc(doc(db, "albums", a._id), { photos: a.photos }), `Đã thêm ${results.length} ảnh.`);
  renderAlbums();
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
   DỰ ÁN
   ========================================================= */

function renderProjects() {
  const isNew = state.selProject === "new";
  const p = isNew ? null : state.projects.find((x) => x._id === state.selProject);
  root.innerHTML = `
    <div class="split">
      <aside class="panel side">
        <div class="side-head">
          <h2>Dự án</h2>
          <button class="btn btn-primary btn-sm" data-act="new">+ Dự án</button>
        </div>
        <div class="tree">
          ${state.projects
            .map(
              (x) => `<button class="tree-item ${x._id === state.selProject ? "active" : ""}" data-project="${x._id}">
                <span class="tree-icon mono">${x.featured ? "★" : "•"}</span>
                <span class="tree-title">${esc(x.title)}</span>
                <span class="tree-count mono">${esc(x.year || "")}</span>
              </button>`
            )
            .join("") || `<p class="dim small">Chưa có dự án nào.</p>`}
        </div>
      </aside>
      <section class="panel editor">${p || isNew ? projectEditor(p) : `<p class="dim">Chọn một dự án hoặc tạo mới.</p>`}</section>
    </div>`;

  root.querySelector(".tree").onclick = (e) => {
    const b = e.target.closest("[data-project]");
    if (b) {
      state.selProject = b.dataset.project;
      renderProjects();
    }
  };
  root.querySelector('[data-act="new"]').onclick = () => {
    state.selProject = "new";
    renderProjects();
  };
  if (p || isNew) bindProjectEditor(p);
}

function projectEditor(p) {
  return `
    <div class="editor-head"><h2>${p ? esc(p.title) : "Dự án mới"}</h2></div>
    <form class="form" id="project-form">
      <label>Tên dự án <input name="title" required value="${esc(p?.title || "")}" /></label>
      <label>Năm <input name="year" type="number" value="${esc(p?.year || new Date().getFullYear())}" /></label>
      <label class="full">Mô tả <textarea name="description" rows="3">${esc(p?.description || "")}</textarea></label>
      <label class="full">Công nghệ (phân cách bằng dấu phẩy) <input name="tags" value="${esc((p?.tags || []).join(", "))}" placeholder="React, TypeScript" /></label>
      <label>Link website <input name="demo" type="url" value="${esc(p?.demo || "")}" placeholder="https://..." /></label>
      <label>Link mã nguồn <input name="source" type="url" value="${esc(p?.source || "")}" placeholder="https://github.com/..." /></label>
      <label>Thứ tự hiển thị <input name="order" type="number" value="${esc(p?.order ?? 0)}" /></label>
      <label class="check"><input name="featured" type="checkbox" ${p?.featured ? "checked" : ""} /> Hiện ở “Dự án nổi bật”</label>
      <div class="full image-field">
        <span>Ảnh chụp màn hình</span>
        <div class="image-row">
          <div class="image-preview">${p?.image ? `<img src="${esc(thumb(p.image))}" alt="" />` : `<span class="dim small">chưa có</span>`}</div>
          <div class="image-inputs">
            <input name="image" value="${esc(p?.image || "")}" placeholder="Dán link ảnh, hoặc tải lên →" />
            <label class="btn btn-ghost btn-sm">Tải ảnh lên<input type="file" id="project-file" accept="image/*" hidden /></label>
            <span class="mono small dim" id="project-upload-status"></span>
          </div>
        </div>
      </div>
      <div class="form-actions full">
        <button class="btn btn-primary" type="submit">${p ? "Lưu" : "Tạo dự án"}</button>
        ${p ? `<button class="btn btn-danger" type="button" data-act="delete">Xóa</button>` : ""}
      </div>
    </form>`;
}

function bindProjectEditor(p) {
  const form = root.querySelector("#project-form");
  const status = root.querySelector("#project-upload-status");
  root.querySelector("#project-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const blob = await shrink(file, 2000);
      const res = await cloudinaryUpload(blob, file.name, `${CLOUDINARY.folder}/projects`, (x) => (status.textContent = `${x}%`));
      form.elements.image.value = res.secure_url;
      root.querySelector(".image-preview").innerHTML = `<img src="${esc(thumb(res.secure_url))}" alt="" />`;
      status.textContent = "đã tải lên, nhớ bấm Lưu";
    } catch (err) {
      status.textContent = "lỗi tải ảnh";
      toast(err.message, "err");
    }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = form.elements;
    const data = {
      title: f.title.value.trim(),
      year: Number(f.year.value) || null,
      description: f.description.value.trim(),
      tags: f.tags.value.split(",").map((s) => s.trim()).filter(Boolean),
      demo: f.demo.value.trim(),
      source: f.source.value.trim(),
      order: Number(f.order.value) || 0,
      featured: f.featured.checked,
      image: f.image.value.trim(),
    };
    if (p) {
      await guard(() => updateDoc(doc(db, "projects", p._id), data), "Đã lưu dự án.");
      Object.assign(p, data);
    } else {
      const ref = await guard(() => addDoc(collection(db, "projects"), data), "Đã tạo dự án.");
      state.projects.push({ _id: ref.id, ...data });
      state.selProject = ref.id;
    }
    renderProjects();
  };

  if (p)
    root.querySelector('[data-act="delete"]').onclick = async () => {
      if (!confirm(`Xóa dự án "${p.title}"?`)) return;
      await guard(() => deleteDoc(doc(db, "projects", p._id)), "Đã xóa dự án.");
      state.projects = state.projects.filter((x) => x._id !== p._id);
      state.selProject = null;
      renderProjects();
    };
}

/* =========================================================
   HỒ SƠ (chỉnh dạng JSON)
   ========================================================= */

function renderProfile() {
  const current = state.profile || PROFILE;
  root.innerHTML = `
    <section class="panel">
      <div class="editor-head">
        <div>
          <h2>Hồ sơ & chuyên môn</h2>
          <p class="dim small">${state.profile ? "Đang sửa bản trên Firestore." : "Chưa có trên Firestore, đang hiện bản mẫu từ data.js. Bấm Lưu để đưa lên."}
          Các trường: name, role, bio, taglines, languages, skillGroups, learning, roadmap, experience... (xem HUONG_DAN.md)</p>
        </div>
      </div>
      <div class="avatar-row">
        <div class="avatar-preview">${current.avatar ? `<img src="${esc(thumb(current.avatar))}" alt="" />` : `<span class="dim small">chưa có ảnh đại diện</span>`}</div>
        <label class="btn btn-ghost btn-sm">Tải ảnh đại diện<input type="file" id="avatar-file" accept="image/*" hidden /></label>
        <span class="mono small dim" id="avatar-status"></span>
      </div>
      <textarea id="profile-json" class="code-area mono" spellcheck="false">${esc(JSON.stringify(current, null, 2))}</textarea>
      <p class="mono small err-text" id="json-error"></p>
      <div class="form-actions">
        <button class="btn btn-primary" id="save-profile">Lưu hồ sơ</button>
        <button class="btn btn-ghost" id="format-json">Định dạng lại</button>
      </div>
    </section>`;

  const area = root.querySelector("#profile-json");
  const errEl = root.querySelector("#json-error");
  const parse = () => {
    try {
      const v = JSON.parse(area.value);
      errEl.textContent = "";
      return v;
    } catch (e) {
      errEl.textContent = `JSON lỗi: ${e.message}`;
      return null;
    }
  };
  area.addEventListener("input", parse);
  root.querySelector("#format-json").onclick = () => {
    const v = parse();
    if (v) area.value = JSON.stringify(v, null, 2);
  };
  root.querySelector("#save-profile").onclick = async () => {
    const v = parse();
    if (!v) return toast("Sửa lỗi JSON trước khi lưu.", "err");
    await guard(() => setDoc(doc(db, "site", "profile"), v), "Đã lưu hồ sơ.");
    state.profile = v;
  };
  root.querySelector("#avatar-file").onchange = async (e) => {
    const file = e.target.files[0];
    const status = root.querySelector("#avatar-status");
    if (!file) return;
    try {
      const blob = await shrink(file, 800);
      const res = await cloudinaryUpload(blob, file.name, `${CLOUDINARY.folder}/profile`, (x) => (status.textContent = `${x}%`));
      const v = parse() || {};
      v.avatar = res.secure_url;
      area.value = JSON.stringify(v, null, 2);
      root.querySelector(".avatar-preview").innerHTML = `<img src="${esc(thumb(res.secure_url))}" alt="" />`;
      status.textContent = "đã tải lên, nhớ bấm Lưu hồ sơ";
    } catch (err) {
      status.textContent = "lỗi tải ảnh";
      toast(err.message, "err");
    }
  };
}

/* =========================================================
   CÔNG CỤ: nhập dữ liệu mẫu, sao lưu
   ========================================================= */

function renderTools() {
  const empty = !state.albums.length && !state.projects.length && !state.profile;
  root.innerHTML = `
    <section class="panel">
      <h2>Nhập dữ liệu từ data.js</h2>
      <p class="dim">Đưa toàn bộ hồ sơ, album (giữ nguyên cấu trúc nhiều tầng) và dự án đang có trong
      <code>assets/js/data.js</code> lên Firestore. Ảnh vẫn giữ link cũ.</p>
      ${empty ? "" : `<p class="warn mono small">Firestore đã có dữ liệu (${state.albums.length} album, ${state.projects.length} dự án). Nhập thêm sẽ tạo bản trùng.</p>`}
      <button class="btn btn-primary" id="import">Nhập dữ liệu</button>
    </section>
    <section class="panel">
      <h2>Sao lưu</h2>
      <p class="dim">Tải toàn bộ dữ liệu trên Firestore về máy dưới dạng file JSON.</p>
      <button class="btn btn-ghost" id="export">Tải file sao lưu</button>
    </section>
    <section class="panel">
      <h2>Dung lượng</h2>
      <p class="dim">${state.albums.length} album · ${state.albums.reduce((n, a) => n + (a.photos || []).length, 0)} ảnh · ${state.projects.length} dự án.
      Xem dung lượng ảnh đã dùng tại <a class="link" href="https://console.cloudinary.com/" target="_blank" rel="noopener">Cloudinary Console</a>.</p>
    </section>`;

  root.querySelector("#import").onclick = async () => {
    if (!confirm("Nhập dữ liệu từ data.js lên Firestore?")) return;
    const batch = writeBatch(db);
    const walk = (list, parentId) =>
      list.forEach((a, i) => {
        const ref = doc(collection(db, "albums"));
        batch.set(ref, {
          title: a.title,
          slug: a.id || slugify(a.title),
          parentId,
          date: a.date || "",
          description: a.description || "",
          cover: a.cover || "",
          order: i,
          photos: (a.photos || []).map(photoOf).map((p) => ({ src: p.src, caption: p.caption || "" })),
        });
        walk(a.children || [], ref.id);
      });
    walk(ALBUMS, null);
    PROJECTS.forEach((p, i) => batch.set(doc(collection(db, "projects")), { ...p, order: i, featured: !!p.featured }));
    batch.set(doc(db, "site", "profile"), PROFILE);
    await guard(() => batch.commit(), "Đã nhập dữ liệu.");
    await reloadAll();
    renderTools();
  };

  root.querySelector("#export").onclick = () => {
    const data = { exportedAt: new Date().toISOString(), profile: state.profile, albums: state.albums, projects: state.projects };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json` });
    link.click();
    URL.revokeObjectURL(url);
  };
}
