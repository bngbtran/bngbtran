(async () => {
  "use strict";

  const app = document.getElementById("app");
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = Store.img;
  const ARROW = `<span class="arrow" aria-hidden="true">→</span>`;
  const ARROW_UP = `<span class="arrow" aria-hidden="true">↗</span>`;

  // Trang quản trị dùng lại toàn bộ file này, chỉ bật thêm chế độ chỉnh sửa
  const EDIT = !!window.EDIT_MODE;

  setupChrome();
  app.innerHTML = `<div class="loading mono"><span class="dot pulse"></span> đang tải</div>`;
  if (EDIT) Store.clearCache();
  const { PROFILE: P, ALBUMS, PROJECTS } = await Store.load();

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m] = String(d).split("-");
    return m ? `Th${+m} ${y}` : y;
  };
  const pad2 = (n) => String(n).padStart(2, "0");

  /* ---------------- Album dạng cây ---------------- */

  const photoOf = (p) => (typeof p === "string" ? { src: p, caption: "" } : p);
  const kids = (a) => a.children || [];
  const ownPhotos = (a) => (a.photos || []).map(photoOf);
  const countPhotos = (a) => ownPhotos(a).length + kids(a).reduce((n, c) => n + countPhotos(c), 0);
  const countAlbums = (list) => list.reduce((n, a) => n + 1 + countAlbums(kids(a)), 0);
  const coverOf = (a) => {
    if (a.cover) return a.cover;
    if (a.photos && a.photos.length) return photoOf(a.photos[0]).src;
    for (const c of kids(a)) {
      const src = coverOf(c);
      if (src) return src;
    }
    return "";
  };
  // Trả về chuỗi album từ gốc tới album theo các id trong đường dẫn
  const resolvePath = (ids) => {
    const chain = [];
    let list = ALBUMS;
    for (const id of ids) {
      const a = list.find((x) => x.id === id);
      if (!a) return null;
      chain.push(a);
      list = kids(a);
    }
    return chain;
  };
  const albumHref = (ids) => "#/albums/" + ids.map(encodeURIComponent).join("/");

  /* ---------------- Số liệu & chữ (tính lại mỗi khi dữ liệu đổi) ---------------- */

  let totalPhotos, totalAlbums, yearsCoding, allSkills, links, T, vars;
  function derive() {
    totalPhotos = ALBUMS.reduce((n, a) => n + countPhotos(a), 0);
    totalAlbums = countAlbums(ALBUMS);
    yearsCoding = P.startedCoding ? Math.max(1, new Date().getFullYear() - P.startedCoding) : 0;
    allSkills = (P.skillGroups || []).flatMap((g) => g.items || []);
    links = P.links || {};
    // Chữ trên trang: mặc định là TEXTS trong data.js, ghi đè bằng P.texts
    T = { ...(typeof TEXTS !== "undefined" ? TEXTS : {}) };
    if (P.statement) T.statement = P.statement;
    for (const [k, v] of Object.entries(P.texts || {})) if (v) T[k] = v;
    vars = { photos: totalPhotos, albums: totalAlbums, projects: PROJECTS.length, location: P.location || "Việt Nam", year: new Date().getFullYear() };
  }
  derive();

  const fill = (k) => String(T[k] || "").replace(/\{(\w+)\}/g, (m, v) => (v in vars ? vars[v] : m));

  /* ---------------- Đánh dấu cho chế độ chỉnh sửa (trang thường không thêm gì) ----------------
     ed()   : chữ sửa trực tiếp được          data-edit="T.key" | "P.bio" | "ALBUM.<id>.title"
     item() : một mục có nút sửa/xóa/đổi chỗ  data-item="<loại>" data-key="<chỉ số hoặc id>"
     list() : danh sách có nút "+ Thêm"       data-list="<loại>"                              */
  const ed = (path, html, { multi = false, ph = "" } = {}) =>
    EDIT ? `<span class="ed" data-edit="${path}"${multi ? " data-multi" : ""}${ph ? ` data-ph="${esc(ph)}"` : ""}>${html}</span>` : html;
  const item = (kind, key, extra = "") => (EDIT ? ` data-item="${kind}" data-key="${esc(key)}"${extra}` : "");
  const list = (kind, extra = "") => (EDIT ? ` data-list="${kind}"${extra}` : "");

  const txt = (k) => ed(`T.${k}`, esc(fill(k)));
  // *chữ* → nghiêng màu nhấn, xuống dòng → ngắt dòng
  const rich = (k) => ed(`T.${k}`, esc(fill(k)).replace(/\*([^*]+)\*/g, '<span class="serif">$1</span>').replace(/\n/g, "<br/>"), { multi: true });

  /* ---------------- Tỉ lệ ảnh cho bố cục justified ----------------
     Ảnh tải lên qua admin có sẵn w/h. Ảnh chưa biết kích thước thì đo khi tải xong. */
  const ratioOf = (ph) => (ph && ph.w && ph.h ? ph.w / ph.h : 0);
  const ratioAttr = (r) => (r ? ` style="--r:${r.toFixed(3)}"` : " data-ratio-auto");
  const findPhoto = (a, src) => ownPhotos(a).find((p) => p.src === src) || kids(a).map((c) => findPhoto(c, src)).find(Boolean);
  app.addEventListener(
    "load",
    (e) => {
      const im = e.target;
      const box = im.tagName === "IMG" && im.naturalWidth && im.closest("[data-ratio-auto]");
      if (box) box.style.setProperty("--r", (im.naturalWidth / im.naturalHeight).toFixed(3));
    },
    true
  );

  /* ---------------- Khung chung: header, footer, theme ---------------- */

  function setupChrome() {
    const header = document.getElementById("site-header");
    const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    document.getElementById("theme-toggle").addEventListener("click", () => {
      const root = document.documentElement;
      const current = root.dataset.theme || "dark";
      const next = current === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (_) {}
    });

    setupCursor();
  }

  // Giọt mực đi theo chuột, phình ra khi trỏ vào thứ bấm được
  function setupCursor() {
    const dot = document.getElementById("cursor");
    if (!dot || reduceMotion || !matchMedia("(pointer: fine)").matches) return;
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.classList.add("on");
      dot.classList.toggle("big", !!e.target.closest("a, button, .photo"));
    }, { passive: true });
    document.addEventListener("pointerleave", () => dot.classList.remove("on"));
    const tick = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderFooter() {
    const social = Object.entries(links)
      .filter(([k, v]) => v && k !== "email")
      .map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k[0].toUpperCase() + k.slice(1))}</a>`)
      .join("");
    document.getElementById("site-footer").innerHTML = `
      <div class="wrap footer-cta">
        <div>
          <p class="eyebrow">${txt("footerEyebrow")}</p>
          <h2 style="margin-top:18px">${rich("footerHeading")}</h2>
          ${links.email ? `<a class="footer-mail" href="mailto:${esc(links.email)}">${esc(links.email)} ${ARROW_UP}</a>` : ""}
        </div>
        <div class="footer-sign sig-draw${EDIT ? " in" : ""}">
          <span class="footer-regards">${txt("footerRegards")}</span>
          <span class="sig" aria-hidden="true"></span>
          <span class="footer-stamp" aria-hidden="true">Bảo<br/>Trân</span>
        </div>
      </div>
      <div class="wrap footer-bottom">
        <span>© ${new Date().getFullYear()} ${esc(P.name || "")}</span>
        <span class="serif">${txt("footerNote")}</span>
        <nav class="footer-links">${social}</nav>
      </div>`;
    const sign = document.querySelector("#site-footer .sig-draw");
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        sign.classList.add("in");
        obs.disconnect();
      }
    }, { threshold: 0.5 }).observe(sign);
  }

  /* ---------------- Tổng quan ---------------- */

  function viewOverview() {
    const current = (P.roadmap || []).find((r) => r.status === "current");
    const featured = PROJECTS.filter((p) => p.featured);
    const nameParts = String(P.name || "").trim().split(/\s+/);
    const last = nameParts[nameParts.length - 1] || "";
    const year = new Date().getFullYear();
    const ring = `${P.role || "Portfolio"} ✦ ${P.openToWork ? fill("openToWork") : `Portfolio ${year}`} ✦ `;
    section.n = 0;
    const taglines = P.taglines || [];
    const facts = [
      ["Vị trí", esc(P.role || "")],
      current && current.title !== P.role && ["Hiện tại", esc(current.title)],
      P.location && ["Nơi ở", esc(P.location)],
      links.email && ["Email", `<a class="v" href="mailto:${esc(links.email)}">${esc(links.email)}</a>`],
      links.github && ["GitHub", `<a class="v" href="${esc(links.github)}" target="_blank" rel="noopener">${esc(links.github.replace(/^https?:\/\/(www\.)?/, ""))}</a>`],
    ].filter(Boolean);

    return `
      <section class="wrap hero"${item("profile", "me")}>
        <canvas class="hero-field" aria-hidden="true"></canvas>
        <div class="hero-meta">
          <span>Portfolio · №${year}</span>
          <span>${esc(P.location || "Việt Nam")} · GMT+7 · <span class="clock" data-clock>--:--:--</span></span>
          ${P.openToWork ? `<span class="status"><span class="dot pulse"></span> ${txt("openToWork")}</span>` : ""}
        </div>

        <p class="hero-hello"><span class="prompt">~/${esc(P.handle || "portfolio")}</span><span class="sigil">$</span>${txt("heroCommand")}</p>
        <h1 class="hero-name" aria-label="${esc(P.name || "")}">
          <span aria-hidden="true" data-scramble>${esc(nameParts.slice(0, -1).join(" "))}</span>
          <span aria-hidden="true"><em data-scramble>${esc(last)}</em><i class="caret"></i></span>
        </h1>
        <div class="seal" aria-hidden="true">
          <svg class="seal-ring" viewBox="0 0 200 200"><defs><path id="seal-path" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0"/></defs><text><textPath href="#seal-path" textLength="498" lengthAdjust="spacing">${esc(ring)}</textPath></text></svg>
          <span class="seal-core">BT</span>
        </div>

        <div class="hero-lede">
          <div>
            <p class="hero-statement"><em>${esc(P.role || "")}</em> ${rich("statement")}</p>
            ${taglines.length ? `<span class="tagline" data-tagline>${esc(taglines[0])}</span>` : ""}
          </div>
          <div>
            ${P.avatar ? `<div class="hero-id"><img class="avatar" src="${esc(img(P.avatar, 200))}" alt="${esc(P.name || "")}" /><div><b>${esc(P.name || "")}</b><span class="mono">@${esc(P.handle || "")}</span></div></div>` : ""}
            <p class="hero-bio">${ed("P.bio", esc(P.bio || ""), { multi: true, ph: "Viết vài dòng giới thiệu..." })}</p>
            <div class="hero-actions">
              <a href="#/projects" class="btn btn-primary">${txt("ctaPrimary")} ${ARROW}</a>
              <a href="#career" class="btn btn-outline" data-scroll>${txt("ctaSecondary")}</a>
            </div>
            <ul class="facts">
              ${facts.map(([k, v]) => `<li><span class="k">${k}</span>${v.startsWith("<a") ? v : `<span class="v">${v}</span>`}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>

      ${marquee([...(P.languages || []).map((l) => l.name), ...allSkills])}

      <div class="wrap">
        <div class="stats">
          ${stat(yearsCoding, txt("statYears"), "+")}
          ${stat((P.languages || []).length, txt("statLanguages"))}
          ${stat(allSkills.length, txt("statSkills"))}
          ${stat(PROJECTS.length, txt("statProjects"))}
        </div>
      </div>

      ${sectionLanguages()}
      ${sectionSkills()}
      ${sectionRoadmap()}
      ${sectionExperience()}

      ${
        featured.length
          ? section("featuredTitle", "featuredDesc", projectGrid(featured, false),
              `<a href="#/projects" class="section-link">${txt("featuredLink")} ${ARROW}</a>`, "featured")
          : ""
      }

      ${
        ALBUMS.length
          ? section("albumsPreviewTitle", "albumsPreviewDesc",
              `<div class="album-grid justified">${ALBUMS.slice(0, 4).map((a) => albumCard(a, [a.id], false)).join("")}</div>`,
              `<a href="#/albums" class="section-link">${txt("albumsPreviewLink")} ${ARROW}</a>`, "albums")
          : ""
      }
    `;
  }

  const stat = (n, label, sup = "") =>
    !n ? "" : `<div class="stat"><span class="stat-num"><span data-count="${n}">${n}</span>${sup ? `<sup>${sup}</sup>` : ""}</span><span class="stat-label">${label}</span></div>`;

  const empty = (msg) => `<p class="empty">${msg}</p>`;

  // Dải chữ chạy ngang, lặp 2 lần để cuộn liền mạch
  function marquee(items) {
    if (!items.length) return "";
    const row = items
      .map((s, i) => `<span class="mq-item${i % 2 ? " alt" : ""}">${esc(s)}</span><span class="mq-star">✳</span>`)
      .join("");
    return `<div class="marquee" aria-hidden="true"><div class="mq-track"><div class="mq-row">${row}</div><div class="mq-row">${row}</div></div></div>`;
  }

  // Các mục tự đánh số theo thứ tự xuất hiện (mục trống thì bỏ qua); tiêu đề & mô tả lấy từ TEXTS
  const section = (titleKey, descKey, body, extra = "", id = "") => `
    <section class="wrap section"${id ? ` id="${id}"` : ""}>
      <div class="section-grid">
        <div class="section-label">
          <span class="section-num" aria-hidden="true">${pad2(++section.n)}</span>
          <h2 class="section-title">${txt(titleKey)}</h2>
          ${id ? `<code class="section-code" aria-hidden="true">&lt;${esc(id)} /&gt;</code>` : ""}
          ${T[descKey] ? `<p class="section-desc">${txt(descKey)}</p>` : ""}
          ${extra}
        </div>
        <div class="section-body">${body}</div>
      </div>
    </section>`;

  const LEVELS = ["", "Mới học", "Cơ bản", "Thành thạo vừa", "Thành thạo", "Chuyên sâu"];

  function sectionLanguages() {
    const langs = P.languages || [];
    if (!langs.length && !EDIT) return "";
    const spoken = (P.spokenLanguages || [])
      .map((s, i) => `<span${item("spokenLanguages", i)}><b>${esc(s.name)}</b> · ${esc(s.level)}</span>`)
      .join("");
    const body = `
      <div class="lang-list"${list("languages")}>
        ${langs
          .map((l, i) => {
            const lv = Math.max(1, Math.min(5, l.level || 1));
            return `
          <div class="lang-row"${item("languages", i)}>
            <div>
              <div class="lang-name">${esc(l.name)}</div>
              ${l.note ? `<div class="lang-note">${esc(l.note)}</div>` : ""}
            </div>
            <div class="meter" role="img" aria-label="Mức độ ${lv}/5">
              ${[1, 2, 3, 4, 5].map((i) => `<i class="${i < lv ? "on" : i === lv ? "on peak" : ""}"></i>`).join("")}
            </div>
            <div class="lang-level">${LEVELS[lv]}</div>
            <div class="lang-years">${l.years ? `${esc(l.years)} năm` : ""}</div>
          </div>`;
          })
          .join("")}
      </div>
      ${spoken || EDIT ? `<div class="spoken"${list("spokenLanguages")}>${spoken}</div>` : ""}`;
    return section("languagesTitle", "languagesDesc", body, "", "languages");
  }

  function sectionSkills() {
    const groups = P.skillGroups || [];
    if (!groups.length && !EDIT) return "";
    const body = `
      <div class="skill-groups"${list("skillGroups")}>
        ${groups
          .map(
            (g, i) => `
          <div class="skill-group"${item("skillGroups", i)}>
            <div class="skill-group-head"><h3>${esc(g.title)}</h3><span class="count">${pad2((g.items || []).length)}</span></div>
            <ul class="skill-list">${(g.items || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          </div>`
          )
          .join("")}
      </div>
      ${
        (P.learning || []).length
          ? `<div class="learning"><span class="learning-label"><span class="dot pulse"></span> ${txt("learningLabel")}</span>${P.learning
              .map((s) => `<span class="item">${esc(s)}</span>`)
              .join("")}</div>`
          : ""
      }`;
    return section("skillsTitle", "skillsDesc", body, "", "skills");
  }

  function sectionRoadmap() {
    const steps = P.roadmap || [];
    if (!steps.length && !EDIT) return "";
    const label = { done: "Đã hoàn thành", current: "Hiện tại", next: "Mục tiêu" };
    const body = `
      <ol class="roadmap"${list("roadmap")}>
        ${steps
          .map(
            (s, i) => `
          <li class="road-step ${esc(s.status)}"${item("roadmap", i)}>
            <div class="road-track"><span class="road-node"></span></div>
            <span class="road-status">${label[s.status] || ""}</span>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.detail || "")}</p>
          </li>`
          )
          .join("")}
      </ol>`;
    return section("roadmapTitle", "roadmapDesc", body, "", "career");
  }

  function sectionExperience() {
    const items = P.experience || [];
    if (!items.length && !EDIT) return "";
    const typeLabel = { work: "Công việc", education: "Học vấn", milestone: "Cột mốc" };
    const body = `
      <div class="exp-list"${list("experience")}>
        ${items
          .map(
            (e, i) => `
          <article class="exp-item ${esc(e.type || "")}"${item("experience", i)}>
            <div class="exp-period">${esc(e.period || "")}<span class="exp-type">${typeLabel[e.type] || esc(e.type || "")}</span></div>
            <div>
              <h3>${esc(e.title)}</h3>
              ${e.org ? `<p class="exp-org">${esc(e.org)}</p>` : ""}
              ${e.description ? `<p class="exp-desc">${esc(e.description)}</p>` : ""}
              ${(e.highlights || []).length ? `<ul class="exp-highlights">${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
              ${(e.tech || []).length ? `<div class="tech">${e.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
            </div>
          </article>`
          )
          .join("")}
      </div>`;
    return section("experienceTitle", "experienceDesc", body, "", "experience");
  }

  /* ---------------- Album ---------------- */

  const FOLDER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

  function albumCard(a, ids, reorder = true) {
    const cover = coverOf(a);
    const subs = kids(a).length;
    const n = countPhotos(a);
    return `
      <a class="album-card ${subs ? "is-folder" : ""}" href="${albumHref(ids)}"${ratioAttr(ratioOf(cover && findPhoto(a, cover)))}${item("album", a._id, reorder ? "" : " data-fixed")}>
        <div class="album-cover">
          ${cover ? `<img src="${esc(img(cover, 900))}" alt="${esc(a.title)}" loading="lazy" />` : ""}
          ${subs ? `<span class="album-badge">${FOLDER_ICON} ${subs} album</span>` : ""}
        </div>
        <div class="album-info">
          <h3>${esc(a.title)}</h3>
          <span class="count">${n} ảnh</span>
        </div>
        ${a.description || a.date ? `<p class="album-sub">${[a.date && formatDate(a.date), a.description && esc(a.description)].filter(Boolean).join(" · ")}</p>` : ""}
      </a>`;
  }

  function breadcrumb(chain) {
    const parts = [`<a href="#/albums">Album</a>`];
    chain.forEach((a, i) => {
      const ids = chain.slice(0, i + 1).map((x) => x.id);
      parts.push(
        i === chain.length - 1
          ? `<span aria-current="page">${esc(a.title)}</span>`
          : `<a href="${albumHref(ids)}">${esc(a.title)}</a>`
      );
    });
    return `<nav class="crumbs" aria-label="Đường dẫn album">${parts.join('<span class="sep">/</span>')}</nav>`;
  }

  const albumGrid = (albums, ids, parentId) =>
    albums.length || EDIT
      ? `<div class="album-grid justified"${list("album", ` data-parent="${esc(parentId || "")}"`)}>${albums.map((c) => albumCard(c, [...ids, c.id])).join("")}</div>`
      : "";

  function viewAlbums(ids) {
    if (!ids.length) {
      return `
        <section class="wrap page-head">
          <span class="eyebrow">${txt("albumsEyebrow")}</span>
          <h1 class="page-title">${rich("albumsHeading")}</h1>
          <p class="page-meta">${pad2(totalAlbums)} album · ${totalPhotos} ảnh</p>
        </section>
        <div class="wrap page-body">
          ${ALBUMS.length || EDIT ? albumGrid(ALBUMS, [], "") : empty("Chưa có album nào.")}
        </div>`;
    }

    const chain = resolvePath(ids);
    if (!chain) return viewNotFound();
    const a = chain[chain.length - 1];
    const photos = ownPhotos(a);
    const subs = kids(a);
    const parentHref = chain.length > 1 ? albumHref(ids.slice(0, -1)) : "#/albums";

    return `
      <section class="wrap page-head"${item("album", a._id, " data-fixed data-here")}>
        ${breadcrumb(chain)}
        <h1 class="page-title">${ed(`ALBUM.${a._id}.title`, esc(a.title))}</h1>
        <p class="page-meta">${[a.date && formatDate(a.date), subs.length && `${subs.length} album con`, `${countPhotos(a)} ảnh`].filter(Boolean).join(" · ")}</p>
        ${a.description || EDIT ? `<p class="page-desc">${ed(`ALBUM.${a._id}.description`, esc(a.description || ""), { multi: true, ph: "Thêm mô tả cho album..." })}</p>` : ""}
      </section>
      <div class="wrap page-body">
        ${albumGrid(subs, ids, a._id)}
        ${
          photos.length || EDIT
            ? `${subs.length || EDIT ? `<h2 class="sub-title">Ảnh tại ${esc(a.title)} <span class="faint mono" style="font-size:13px">${photos.length}</span></h2>` : ""}
               <div class="gallery justified"${list("photo", ` data-album="${esc(a._id)}"`)}>
                ${photos
                  .map(
                    (ph, i) => `
                  <button class="photo"${ratioAttr(ratioOf(ph))} data-path="${esc(ids.join("/"))}" data-index="${i}" aria-label="Xem ảnh ${i + 1}"${item("photo", `${a._id}:${i}`, a.cover === ph.src ? " data-cover" : "")}>
                    <img src="${esc(img(ph.src, ratioOf(ph) > 1.6 ? 1400 : 900))}" alt="${esc(ph.caption || a.title)}" loading="lazy" />
                    ${ph.caption ? `<span class="photo-cap">${esc(ph.caption)}</span>` : ""}
                  </button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
        ${!subs.length && !photos.length && !EDIT ? empty("Album này chưa có ảnh.") : ""}
        <a href="${parentHref}" class="back">← Quay lại</a>
      </div>`;
  }

  /* ---------------- Dự án ---------------- */

  function projectCard(p, i, reorder = true) {
    const title = String(p.title || "");
    const media = p.image
      ? `<img src="${esc(img(p.image, 1200))}" alt="${esc(title)}" loading="lazy" />`
      : `<div class="thumb-fallback">${esc(title.split(/\s+/).slice(0, 2).map((w) => w[0]).join(""))}</div>`;
    const href = p.demo || p.source || "";
    const links = [
      p.demo && `<a href="${esc(p.demo)}" target="_blank" rel="noopener">Xem website ${ARROW_UP}</a>`,
      p.source && `<a href="${esc(p.source)}" target="_blank" rel="noopener">Mã nguồn ${ARROW_UP}</a>`,
    ].filter(Boolean).join("");
    return `
      <article class="project-card" data-tags="${esc((p.tags || []).join("|"))}"${item("project", p._id, reorder ? "" : " data-fixed")}>
        ${href ? `<a class="project-media" href="${esc(href)}" target="_blank" rel="noopener">` : `<div class="project-media">`}
          ${media}
          <span class="project-index" aria-hidden="true">№${pad2(i + 1)}</span>
        ${href ? "</a>" : "</div>"}
        <div class="project-body">
          <div class="project-head"><h3>${esc(title)}</h3><span class="project-year">${esc(p.year || "")}</span></div>
          <p>${esc(p.description || "")}</p>
          ${(p.tags || []).length ? `<div class="tech" data-label="Chất liệu">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
          ${links ? `<div class="project-links">${links}</div>` : ""}
        </div>
      </article>`;
  }

  // Lưới tự điều chỉnh: 1 dự án → thẻ ngang to; số lẻ → thẻ cuối trải ngang
  const projectGrid = (projects, reorder = true) =>
    `<div class="project-grid ${projects.length === 1 ? "solo" : projects.length % 2 ? "odd" : ""}"${reorder ? list("project") : ""}>${projects
      .map((p, i) => projectCard(p, i, reorder))
      .join("")}</div>`;

  function viewProjects() {
    const tags = [...new Set(PROJECTS.flatMap((p) => p.tags || []))];
    return `
      <section class="wrap page-head">
        <span class="eyebrow">${txt("projectsEyebrow")}</span>
        <h1 class="page-title">${rich("projectsHeading")}</h1>
        <p class="page-meta">${pad2(PROJECTS.length)} dự án</p>
        ${
          tags.length > 1
            ? `<div class="filters">
                <button class="filter active" data-filter="*">Tất cả</button>
                ${tags.map((t) => `<button class="filter" data-filter="${esc(t)}">${esc(t)}</button>`).join("")}
              </div>`
            : ""
        }
      </section>
      <div class="wrap page-body">
        ${PROJECTS.length || EDIT ? projectGrid(PROJECTS) : empty("Chưa có dự án nào.")}
      </div>`;
  }

  /* ---------------- Thông tin cá nhân ---------------- */

  function viewAbout() {
    const nameParts = String(P.name || "").trim().split(/\s+/);
    const initials = (nameParts[0]?.[0] || "") + (nameParts[nameParts.length - 1]?.[0] || "");
    const current = (P.roadmap || []).find((r) => r.status === "current");
    // Thẻ "profile.json" kiểu terminal
    const rows = [
      ["name", P.name],
      ["handle", P.handle && `@${P.handle}`],
      ["role", P.role],
      ["now", current && current.title !== P.role ? current.title : ""],
      ["location", P.location],
      ["coding_since", P.startedCoding],
      ["open_to_work", !!P.openToWork],
    ].filter(([, v]) => v !== "" && v !== undefined && v !== null);
    const json = rows
      .map(([k, v], i) => {
        const val = typeof v === "string" ? `<span class="j-str">"${esc(v)}"</span>` : `<span class="j-lit">${esc(String(v))}</span>`;
        return `  <span class="j-key">"${k}"</span>: ${val}${i < rows.length - 1 ? "," : ""}`;
      })
      .join("\n");
    const linkLabel = (k, v) => (k === "email" ? v : String(v).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
    const linkHref = (k, v) => (k === "email" ? `mailto:${v}` : v);
    const linkRows = Object.entries(links)
      .filter(([, v]) => v)
      .sort(([a], [b]) => (a === "email" ? -1 : b === "email" ? 1 : 0))
      .map(
        ([k, v]) => `<li><a href="${esc(linkHref(k, v))}"${k === "email" ? "" : ' target="_blank" rel="noopener"'}>
          <span class="k mono">${esc(k)}</span><span class="v">${esc(linkLabel(k, v))}</span>${ARROW_UP}</a></li>`
      )
      .join("");
    const chips = (arr) => arr.map((s) => `<span>${esc(s)}</span>`).join("");
    const block = (key, body) => (body ? `<div class="about-block"><h3 class="about-h">${txt(key)}</h3>${body}</div>` : "");

    return `
      <section class="wrap page-head">
        <span class="eyebrow">${txt("aboutEyebrow")}</span>
        <h1 class="page-title">${rich("aboutHeading")}</h1>
      </section>
      <div class="wrap page-body about"${item("profile", "me")}>
        <aside class="about-side">
          <figure class="about-photo">
            ${P.avatar ? `<img src="${esc(img(P.avatar, 900))}" alt="${esc(P.name || "")}" />` : `<span class="about-initials">${esc(initials)}</span>`}
            <figcaption class="mono">${esc(P.handle ? `@${P.handle}` : P.name || "")}</figcaption>
          </figure>
          <div class="term" aria-label="Thông tin tóm tắt">
            <div class="term-bar"><i></i><i></i><i></i><span class="mono">~/${esc(P.handle || "me")}/profile.json</span></div>
            <pre class="term-body mono">{\n${json}\n}</pre>
          </div>
        </aside>
        <div class="about-main">
          <p class="about-lede">${ed("P.bio", esc(P.bio || ""), { multi: true, ph: "Viết vài dòng giới thiệu..." })}</p>
          ${P.about || EDIT ? `<div class="about-text">${ed("P.about", esc(P.about || "").replace(/\n/g, "<br/>"), { multi: true, ph: "Kể thêm về bản thân: con đường đến với code, điều bạn quan tâm..." })}</div>` : ""}
          ${block("aboutContact", linkRows && `<ul class="about-links">${linkRows}</ul>`)}
          <div class="about-grid">
            ${block("aboutInterests", (P.interests || []).length && `<div class="chips">${chips(P.interests)}</div>`)}
            ${block("aboutLanguages", (P.spokenLanguages || []).length && `<ul class="about-list">${P.spokenLanguages.map((l) => `<li><b>${esc(l.name)}</b><span>${esc(l.level)}</span></li>`).join("")}</ul>`)}
            ${block("aboutLearning", (P.learning || []).length && `<div class="chips dashed">${chips(P.learning)}</div>`)}
          </div>
        </div>
      </div>`;
  }

  function viewNotFound() {
    return `
      <section class="wrap notfound">
        <span class="eyebrow">404</span>
        <h1 class="page-title">Không tìm thấy <span class="serif">trang này</span></h1>
        <a href="#/" class="btn btn-primary">Về trang chủ ${ARROW}</a>
      </section>`;
  }

  /* ---------------- Router ---------------- */

  function route(keepScroll = false) {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    let html, tab;
    if (parts.length === 0) [html, tab] = [viewOverview(), "overview"];
    else if (parts[0] === "about") [html, tab] = [viewAbout(), "about"];
    else if (parts[0] === "albums") [html, tab] = [viewAlbums(parts.slice(1)), "albums"];
    else if (parts[0] === "projects") [html, tab] = [viewProjects(), "projects"];
    else [html, tab] = [viewNotFound(), null];

    const y = scrollY;
    app.innerHTML = `<div class="view">${html}</div>`;
    document.querySelectorAll(".nav a").forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, keepScroll === true ? y : 0);
    document.documentElement.style.scrollBehavior = "";
    afterRender(tab);
    document.dispatchEvent(new CustomEvent("portfolio:render"));
  }

  let taglineTimer = null;

  // Đổi luân phiên các tagline dưới câu giới thiệu
  function rotateTaglines() {
    clearInterval(taglineTimer);
    const el = app.querySelector("[data-tagline]");
    const list = P.taglines || [];
    if (!el || reduceMotion || EDIT || list.length < 2) return;
    let i = 0;
    taglineTimer = setInterval(() => {
      el.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % list.length;
        el.textContent = list[i];
        el.classList.remove("out");
      }, 400);
    }, 4200);
  }

  /* ---------------- Hero: trường ký tự, giải mã tên, đồng hồ ---------------- */

  let stopHero = () => {};

  const hexRgb = (hex) => {
    const h = hex.trim().replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  // Lưới ký tự gợn sóng theo thời gian, phình sáng quanh con trỏ; màu chuyển từ accent sang accent-2
  function heroField(canvas) {
    const ctx = canvas.getContext("2d");
    const RAMP = " ·:-+=*≡#%@";
    const CELL = 18;
    let w = 0, h = 0, cols = 0, rows = 0, mx = -1e4, my = -1e4, raf = 0, palette = [], frame = 0;

    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const a = hexRgb(css.getPropertyValue("--accent")), b = hexRgb(css.getPropertyValue("--accent-2"));
      palette = Array.from({ length: cols }, (_, i) => {
        const k = cols > 1 ? i / (cols - 1) : 0;
        return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(",")})`;
      });
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 13px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      readColors();
    };
    const draw = (t) => {
      if (++frame % 60 === 0) readColors(); // bắt kịp khi đổi theme
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = palette[i];
        for (let j = 0; j < rows; j++) {
          const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
          const n = Math.sin(i * 0.16 + t * 0.0005) + Math.sin(j * 0.21 - t * 0.0007) + Math.sin((i + j) * 0.08 + t * 0.0003);
          const d = Math.hypot(x - mx, y - my);
          const v = ((n + 3) / 6) * 0.78 + Math.max(0, 1 - d / 190) * 0.75;
          if (v < 0.26) continue;
          ctx.globalAlpha = Math.min(1, (v - 0.18) * 1.5);
          ctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))], x, y);
        }
      }
      ctx.globalAlpha = 1;
    };
    const loop = (t) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };

    resize();
    addEventListener("resize", resize);
    if (reduceMotion) draw(0);
    else {
      addEventListener("pointermove", onMove, { passive: true });
      // chỉ chạy khi hero còn trong khung nhìn
      const io = new IntersectionObserver(([e]) => {
        cancelAnimationFrame(raf);
        if (e.isIntersecting) raf = requestAnimationFrame(loop);
      });
      io.observe(canvas);
      return () => {
        io.disconnect();
        cancelAnimationFrame(raf);
        removeEventListener("pointermove", onMove);
        removeEventListener("resize", resize);
      };
    }
    return () => removeEventListener("resize", resize);
  }

  // Chữ hiện ra như đang được giải mã
  function scramble(el, delay = 0) {
    const text = el.textContent;
    const GLYPHS = "01<>/{}[]=+*#_~";
    let frame = -Math.round(delay / 16), raf = 0;
    const tick = () => {
      frame++;
      let done = true;
      el.textContent = [...text]
        .map((c, i) => {
          if (c === " " || frame >= 10 + i * 3) return c;
          done = false;
          return frame < 0 ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        })
        .join("");
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }

  function startHero() {
    stopHero();
    const canvas = app.querySelector(".hero-field");
    if (!canvas) return (stopHero = () => {});
    const stops = [heroField(canvas)];
    if (!reduceMotion && !EDIT) app.querySelectorAll("[data-scramble]").forEach((el, i) => stops.push(scramble(el, i * 260)));

    const clock = app.querySelector("[data-clock]");
    const fmt = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tickClock = () => (clock.textContent = fmt.format(new Date()));
    tickClock();
    const timer = setInterval(tickClock, 1000);
    stops.push(() => clearInterval(timer));

    stopHero = () => stops.forEach((s) => s());
  }

  function afterRender(tab) {
    rotateTaglines();
    startHero();
    // Khi chỉnh sửa, trang vẽ lại liên tục nên bỏ hiệu ứng hiện dần
    if (EDIT) return app.querySelectorAll(".sig-draw").forEach((el) => el.classList.add("in"));
    if (tab === "overview") countUp();
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    app
      .querySelectorAll(".section-grid, .album-card, .project-card, .photo, .lang-row, .skill-group, .road-step, .exp-item")
      .forEach((el, i) => {
        el.classList.add("reveal");
        el.style.transitionDelay = `${(i % 4) * 70}ms`;
        io.observe(el);
      });
    app.querySelectorAll(".sig-draw").forEach((el) => io.observe(el));
  }

  function countUp() {
    if (reduceMotion) return;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      const start = performance.now();
      const step = (t) => {
        const k = Math.min((t - start) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------------- Click trong trang ---------------- */

  app.addEventListener("click", (e) => {
    // Đang chỉnh sửa: bấm vào chữ để sửa, không mở link / lightbox
    if (EDIT && e.target.closest("[data-edit], .ed-tools, .ed-add, .ed-drop")) return;
    // Cuộn tới mục trong trang (không đổi hash để router không chạy lại)
    const jump = e.target.closest("[data-scroll]");
    if (jump) {
      e.preventDefault();
      const target = document.getElementById(jump.getAttribute("href").slice(1));
      if (target) {
        const top = target.getBoundingClientRect().top + scrollY - document.getElementById("site-header").offsetHeight - 8;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      }
      return;
    }
    const f = e.target.closest(".filter");
    if (f) {
      app.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === f));
      const tag = f.dataset.filter;
      app.querySelectorAll(".project-card").forEach((c) => {
        c.hidden = tag !== "*" && !c.dataset.tags.split("|").includes(tag);
      });
      return;
    }
    const ph = e.target.closest(".photo");
    if (ph) openLightbox(ph.dataset.path.split("/"), +ph.dataset.index);
  });

  /* ---------------- Lightbox ---------------- */

  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-caption");
  const lbCount = document.getElementById("lb-count");
  let lbPhotos = [], lbIndex = 0, lastFocus = null;

  function openLightbox(ids, index) {
    const chain = resolvePath(ids);
    if (!chain) return;
    lbPhotos = ownPhotos(chain[chain.length - 1]);
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    showPhoto(index);
    lb.querySelector('[data-lb="close"]').focus();
  }

  function showPhoto(i) {
    lbIndex = (i + lbPhotos.length) % lbPhotos.length;
    const ph = lbPhotos[lbIndex];
    lbImg.classList.remove("loaded");
    lbImg.onload = () => lbImg.classList.add("loaded");
    lbImg.src = img(ph.src, 2000);
    lbImg.alt = ph.caption || "";
    lbCount.textContent = `${pad2(lbIndex + 1)} / ${pad2(lbPhotos.length)}`;
    lbCap.textContent = ph.caption || "";
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
    lbImg.src = "";
    lastFocus && lastFocus.focus();
  }

  lb.addEventListener("click", (e) => {
    const action = e.target.closest("[data-lb]")?.dataset.lb;
    if (action === "close" || e.target === lb || e.target.classList.contains("lb-figure")) closeLightbox();
    else if (action === "prev") showPhoto(lbIndex - 1);
    else if (action === "next") showPhoto(lbIndex + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") showPhoto(lbIndex - 1);
    else if (e.key === "ArrowRight") showPhoto(lbIndex + 1);
  });

  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------------- Khởi động ---------------- */

  // Cho lớp chỉnh sửa (admin.js) đọc & sửa dữ liệu rồi vẽ lại trang
  window.Portfolio = {
    P, ALBUMS, PROJECTS, T: () => T, kids, photoOf, ownPhotos,
    refresh() {
      derive();
      renderFooter();
      route(true);
    },
  };

  renderFooter();
  addEventListener("hashchange", () => route());
  route();
  document.dispatchEvent(new CustomEvent("portfolio:ready"));
})();
