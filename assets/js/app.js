(async () => {
  "use strict";

  const app = document.getElementById("app");
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = Store.img;

  app.innerHTML = `<div class="loading mono"><span class="dot"></span> đang tải dữ liệu...</div>`;
  const { PROFILE: P, ALBUMS, PROJECTS } = await Store.load();

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m] = String(d).split("-");
    return m ? `${m}/${y}` : y;
  };
  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();

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

  const totalPhotos = ALBUMS.reduce((n, a) => n + countPhotos(a), 0);
  const totalAlbums = countAlbums(ALBUMS);
  const yearsCoding = P.startedCoding ? Math.max(1, new Date().getFullYear() - P.startedCoding) : 0;
  const allSkills = (P.skillGroups || []).flatMap((g) => g.items);

  /* ---------------- Tổng quan ---------------- */

  function viewOverview() {
    const avatar = P.avatar
      ? `<img src="${esc(img(P.avatar, 240))}" alt="${esc(P.name)}" />`
      : `<span>${esc(initials(P.name))}</span>`;
    const links = Object.entries(P.links || {})
      .filter(([, v]) => v)
      .map(([k, v]) => {
        const href = k === "email" ? `mailto:${v}` : v;
        return `<a class="chip-link" href="${esc(href)}" target="_blank" rel="noopener">${esc(k)}</a>`;
      })
      .join("");
    const stack = (P.languages || []).slice(0, 3).map((l) => `<span class="s">"${esc(l.name)}"</span>`).join(", ");
    const current = (P.roadmap || []).find((r) => r.status === "current");
    const next = (P.roadmap || []).find((r) => r.status === "next");
    const featured = PROJECTS.filter((p) => p.featured);

    return `
      <section class="hero">
        <div class="hero-text">
          <p class="mono kicker"><span class="dot"></span> xin chào, mình là</p>
          <h1 class="hero-name"><span class="grad">${esc(P.name)}</span></h1>
          <p class="hero-role mono">${esc(P.role)}${P.openToWork ? ` <span class="badge-open">● open to work</span>` : ""}</p>
          <p class="hero-typed mono"><span class="prompt">&gt;</span> <span id="typed"></span><span class="caret">▍</span></p>
          <p class="hero-bio">${esc(P.bio)}</p>
          <div class="hero-actions">
            <a href="#/projects" class="btn btn-primary">Xem dự án</a>
            <a href="#career" class="btn btn-ghost" data-scroll>Career path</a>
          </div>
        </div>

        <div class="terminal">
          <div class="term-bar"><i></i><i></i><i></i><span class="mono">~/${esc(P.handle)}/dev.ts</span></div>
          <div class="term-body mono">
            <div class="avatar">${avatar}</div>
            <p><span class="k">const</span> dev: <span class="t">Developer</span> = {</p>
            <p class="ind">name: <span class="s">"${esc(P.name)}"</span>,</p>
            <p class="ind">role: <span class="s">"${esc(P.role)}"</span>,</p>
            <p class="ind">stack: [${stack}],</p>
            ${current ? `<p class="ind">now: <span class="s">"${esc(current.title)}"</span>,</p>` : ""}
            ${next ? `<p class="ind">next: <span class="s">"${esc(next.title)}"</span>,</p>` : ""}
            <p class="ind">experience: <span class="n">${yearsCoding}</span>, <span class="c">// năm</span></p>
            <p class="ind">openToWork: <span class="k">${P.openToWork ? "true" : "false"}</span>,</p>
            <p>};</p>
            <div class="links">${links}</div>
          </div>
        </div>
      </section>

      <section class="stats">
        ${stat(yearsCoding, "năm code", "+")}
        ${stat((P.languages || []).length, "ngôn ngữ lập trình")}
        ${stat(allSkills.length, "công nghệ & kỹ năng")}
        ${stat(PROJECTS.length, "website đã code")}
      </section>

      <nav class="subnav mono" aria-label="Mục lục">
        <a href="#languages" data-scroll>languages</a>
        <a href="#skills" data-scroll>skills</a>
        <a href="#career" data-scroll>career</a>
        <a href="#experience" data-scroll>experience</a>
        <a href="#featured" data-scroll>projects</a>
      </nav>

      ${sectionLanguages()}
      ${sectionSkills()}
      ${sectionRoadmap()}
      ${sectionExperience()}

      <section class="block" id="featured">
        <div class="section-head">
          ${title("05", "Dự án nổi bật")}
          <a href="#/projects" class="more mono">tất cả dự án →</a>
        </div>
        <div class="project-grid">${featured.map(projectCard).join("") || empty("Đánh dấu featured: true cho dự án muốn hiện ở đây.")}</div>
      </section>

      <section class="block">
        <div class="section-head">
          ${title("06", "Ngoài giờ code: album ảnh")}
          <a href="#/albums" class="more mono">${totalPhotos} ảnh · ${totalAlbums} album →</a>
        </div>
        <div class="album-grid">${ALBUMS.slice(0, 3).map((a) => albumCard(a, [a.id])).join("") || empty("Chưa có album nào.")}</div>
      </section>
    `;
  }

  const title = (num, text) =>
    `<h2 class="section-title"><span class="mono num">${num}.</span> ${esc(text)}</h2>`;

  const stat = (n, label, suffix = "") =>
    `<div class="stat"><span class="stat-num"><span data-count="${n}">0</span>${suffix}</span><span class="stat-label">${label}</span></div>`;

  const empty = (msg) => `<p class="empty mono">${msg}</p>`;

  const LEVELS = ["", "Mới học", "Cơ bản", "Dùng tốt", "Thành thạo", "Rất thành thạo"];

  function sectionLanguages() {
    const langs = P.languages || [];
    if (!langs.length) return "";
    const spoken = (P.spokenLanguages || [])
      .map((s) => `<span><b>${esc(s.name)}</b> <span class="dim">· ${esc(s.level)}</span></span>`)
      .join("");
    return `
      <section class="block" id="languages">
        ${title("01", "Ngôn ngữ lập trình")}
        <div class="lang-grid">
          ${langs
            .map((l) => {
              const lv = Math.max(1, Math.min(5, l.level || 1));
              return `
            <div class="lang-card">
              <div class="lang-top">
                <h3 class="mono">${esc(l.name)}</h3>
                <span class="lang-years mono">${l.years ? `${esc(l.years)} năm` : ""}</span>
              </div>
              <div class="meter" role="img" aria-label="Mức độ ${lv}/5">
                ${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= lv ? "on" : ""}" style="--i:${i}"></i>`).join("")}
              </div>
              <div class="lang-level mono">${LEVELS[lv]}</div>
              ${l.note ? `<p class="lang-note">${esc(l.note)}</p>` : ""}
            </div>`;
            })
            .join("")}
        </div>
        ${spoken ? `<div class="spoken mono"><span class="c">// giao tiếp:</span> ${spoken}</div>` : ""}
      </section>`;
  }

  function sectionSkills() {
    const groups = P.skillGroups || [];
    if (!groups.length) return "";
    return `
      <section class="block" id="skills">
        ${title("02", "Kỹ năng & công nghệ")}
        <div class="skill-groups">
          ${groups
            .map(
              (g) => `
            <div class="skill-group">
              <div class="skill-group-head">
                <span class="skill-icon mono">${esc(g.icon || "#")}</span>
                <h3>${esc(g.title)}</h3>
                <span class="count mono">${g.items.length}</span>
              </div>
              <div class="skills">${g.items.map((s) => `<span class="skill">${esc(s)}</span>`).join("")}</div>
            </div>`
            )
            .join("")}
        </div>
        ${
          (P.learning || []).length
            ? `<div class="learning">
                <span class="mono learning-label"><span class="dot"></span> đang học</span>
                ${P.learning.map((s) => `<span class="skill skill-learning">${esc(s)}</span>`).join("")}
              </div>`
            : ""
        }
      </section>`;
  }

  function sectionRoadmap() {
    const steps = P.roadmap || [];
    if (!steps.length) return "";
    const label = { done: "đã qua", current: "hiện tại", next: "mục tiêu" };
    return `
      <section class="block" id="career">
        ${title("03", "Career path")}
        <ol class="roadmap">
          ${steps
            .map(
              (s, i) => `
            <li class="road-step ${esc(s.status)}">
              <div class="road-node mono">${s.status === "done" ? "✓" : String(i + 1).padStart(2, "0")}</div>
              <div class="road-text">
                <span class="road-status mono">${label[s.status] || ""}</span>
                <h3>${esc(s.title)}</h3>
                <p>${esc(s.detail || "")}</p>
              </div>
            </li>`
            )
            .join("")}
        </ol>
      </section>`;
  }

  function sectionExperience() {
    const items = P.experience || [];
    if (!items.length) return "";
    const typeLabel = { work: "work", education: "education", milestone: "milestone" };
    return `
      <section class="block" id="experience">
        ${title("04", "Kinh nghiệm & học vấn")}
        <div class="timeline">
          ${items
            .map(
              (e) => `
            <article class="tl-item ${esc(e.type || "")}">
              <div class="tl-dot"></div>
              <div class="tl-card">
                <div class="tl-meta mono">
                  <span class="tl-type">${typeLabel[e.type] || esc(e.type || "")}</span>
                  <span class="dim">${esc(e.period || "")}</span>
                </div>
                <h3>${esc(e.title)}</h3>
                ${e.org ? `<p class="tl-org">@ ${esc(e.org)}</p>` : ""}
                ${e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ""}
                ${
                  (e.highlights || []).length
                    ? `<ul class="tl-highlights">${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
                    : ""
                }
                ${(e.tech || []).length ? `<div class="tags">${e.tech.map((t) => `<span class="tag mono">${esc(t)}</span>`).join("")}</div>` : ""}
              </div>
            </article>`
            )
            .join("")}
        </div>
      </section>`;
  }

  /* ---------------- Album ---------------- */

  function albumCard(a, ids) {
    const cover = coverOf(a);
    const subs = kids(a).length;
    const n = countPhotos(a);
    const meta = [subs && `${subs} album con`, `${n} ảnh`].filter(Boolean).join(" · ");
    return `
      <a class="album-card ${subs ? "is-folder" : ""}" href="${albumHref(ids)}">
        <div class="album-cover">
          ${cover ? `<img src="${esc(img(cover, 800))}" alt="${esc(a.title)}" loading="lazy" />` : ""}
          <span class="album-count mono">${meta}</span>
          ${subs ? `<span class="album-folder mono">▸ thư mục</span>` : ""}
        </div>
        <div class="album-info">
          <h3>${esc(a.title)}</h3>
          <p class="mono dim">${a.date ? formatDate(a.date) : ""}${a.date && a.description ? " · " : ""}${esc(a.description || "")}</p>
        </div>
      </a>`;
  }

  function breadcrumb(chain) {
    const parts = [`<a href="#/albums">albums</a>`];
    chain.forEach((a, i) => {
      const ids = chain.slice(0, i + 1).map((x) => x.id);
      parts.push(
        i === chain.length - 1
          ? `<span aria-current="page">${esc(a.title)}</span>`
          : `<a href="${albumHref(ids)}">${esc(a.title)}</a>`
      );
    });
    return `<nav class="crumbs mono" aria-label="Đường dẫn album">${parts.join('<span class="sep">/</span>')}</nav>`;
  }

  function viewAlbums(ids) {
    if (!ids.length) {
      return `
        <section class="page-head">
          <p class="mono kicker"><span class="dot"></span> 02 / album ảnh</p>
          <h1>Những nơi mình đã <span class="grad">đi qua</span></h1>
          <p class="dim">${totalAlbums} album · ${totalPhotos} ảnh. Bấm vào để đi sâu vào từng nơi.</p>
        </section>
        <div class="album-grid">${ALBUMS.map((a) => albumCard(a, [a.id])).join("") || empty("Chưa có album nào. Thêm album trong assets/js/data.js")}</div>`;
    }

    const chain = resolvePath(ids);
    if (!chain) return viewNotFound();
    const a = chain[chain.length - 1];
    const photos = ownPhotos(a);
    const subs = kids(a);
    const parentHref = chain.length > 1 ? albumHref(ids.slice(0, -1)) : "#/albums";

    return `
      <section class="page-head">
        ${breadcrumb(chain)}
        <h1><span class="grad">${esc(a.title)}</span></h1>
        <p class="mono dim">${[a.date && formatDate(a.date), subs.length && `${subs.length} album con`, `${countPhotos(a)} ảnh`].filter(Boolean).join(" · ")}</p>
        ${a.description ? `<p class="album-desc">${esc(a.description)}</p>` : ""}
      </section>
      ${
        subs.length
          ? `<div class="album-grid">${subs.map((c) => albumCard(c, [...ids, c.id])).join("")}</div>`
          : ""
      }
      ${
        photos.length
          ? `${subs.length ? `<h2 class="section-title sub-title"><span class="mono num">//</span> Ảnh tại ${esc(a.title)}</h2>` : ""}
             <div class="masonry">
              ${photos
                .map(
                  (ph, i) => `
                <button class="photo" data-path="${esc(ids.join("/"))}" data-index="${i}" aria-label="Xem ảnh ${i + 1}">
                  <img src="${esc(img(ph.src, 900))}" alt="${esc(ph.caption || a.title)}" loading="lazy" />
                  ${ph.caption ? `<span class="photo-cap">${esc(ph.caption)}</span>` : ""}
                </button>`
                )
                .join("")}
            </div>`
          : ""
      }
      ${!subs.length && !photos.length ? empty("Album này chưa có ảnh.") : ""}
      <a href="${parentHref}" class="back mono back-bottom">← quay lại</a>
    `;
  }

  /* ---------------- Dự án ---------------- */

  function projectCard(p) {
    const thumb = p.image
      ? `<img src="${esc(img(p.image, 900))}" alt="${esc(p.title)}" loading="lazy" />`
      : `<div class="thumb-fallback mono">${esc(p.title.slice(0, 2).toUpperCase())}</div>`;
    const links = [
      p.demo && `<a href="${esc(p.demo)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Xem website ↗</a>`,
      p.source && `<a href="${esc(p.source)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Mã nguồn</a>`,
    ]
      .filter(Boolean)
      .join("");
    return `
      <article class="project-card" data-tags="${esc((p.tags || []).join("|"))}">
        <div class="project-thumb">
          <div class="browser-bar"><i></i><i></i><i></i></div>
          ${thumb}
        </div>
        <div class="project-body">
          <div class="project-meta mono dim">${p.year ? esc(p.year) : ""}</div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag mono">${esc(t)}</span>`).join("")}</div>
          ${links ? `<div class="project-links">${links}</div>` : ""}
        </div>
      </article>`;
  }

  function viewProjects() {
    const tags = [...new Set(PROJECTS.flatMap((p) => p.tags || []))];
    return `
      <section class="page-head">
        <p class="mono kicker"><span class="dot"></span> 03 / dự án web</p>
        <h1>Những website mình đã <span class="grad">code</span></h1>
        <p class="dim">Lọc theo công nghệ:</p>
        <div class="filters">
          <button class="filter active mono" data-filter="*">tất cả</button>
          ${tags.map((t) => `<button class="filter mono" data-filter="${esc(t)}">${esc(t)}</button>`).join("")}
        </div>
      </section>
      <div class="project-grid">${PROJECTS.map(projectCard).join("") || empty("Chưa có dự án nào.")}</div>
    `;
  }

  function viewNotFound() {
    return `
      <section class="page-head notfound">
        <p class="mono kicker"><span class="dot"></span> 404</p>
        <h1>Không tìm thấy <span class="grad">trang này</span></h1>
        <a href="#/" class="btn btn-primary">Về Tổng quan</a>
      </section>`;
  }

  /* ---------------- Router ---------------- */

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    let html, tab;
    if (parts.length === 0) [html, tab] = [viewOverview(), "overview"];
    else if (parts[0] === "albums") [html, tab] = [viewAlbums(parts.slice(1)), "albums"];
    else if (parts[0] === "projects") [html, tab] = [viewProjects(), "projects"];
    else [html, tab] = [viewNotFound(), null];

    app.innerHTML = `<div class="view">${html}</div>`;
    setActiveTab(tab);
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = "";
    afterRender(tab);
  }

  function setActiveTab(tab) {
    const indicator = document.querySelector(".tab-indicator");
    let active = null;
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.tab === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
      if (on) active = t;
    });
    if (active) {
      indicator.style.opacity = 1;
      indicator.style.width = active.offsetWidth + "px";
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    } else indicator.style.opacity = 0;
  }

  function afterRender(tab) {
    if (tab === "overview") {
      startTyping();
      countUp();
    }
    // Hiện dần các khối khi cuộn tới
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    app
      .querySelectorAll(".album-card, .project-card, .photo, .stat, .lang-card, .skill-group, .road-step, .tl-item")
      .forEach((el, i) => {
        el.classList.add("reveal");
        el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
        io.observe(el);
      });
  }

  /* ---------------- Hiệu ứng trang Tổng quan ---------------- */

  let typingTimer;
  function startTyping() {
    clearTimeout(typingTimer);
    const el = document.getElementById("typed");
    const lines = P.taglines || [];
    if (!el || !lines.length) return;
    if (reduceMotion) return void (el.textContent = lines[0]);
    let li = 0, ci = 0, deleting = false;
    const tick = () => {
      if (!document.body.contains(el)) return;
      const line = lines[li];
      ci += deleting ? -1 : 1;
      el.textContent = line.slice(0, ci);
      let delay = deleting ? 25 : 55;
      if (!deleting && ci === line.length) [deleting, delay] = [true, 1800];
      else if (deleting && ci === 0) [deleting, li, delay] = [false, (li + 1) % lines.length, 300];
      typingTimer = setTimeout(tick, delay);
    };
    tick();
  }

  function countUp() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      if (reduceMotion) return void (el.textContent = target);
      const start = performance.now();
      const step = (t) => {
        const k = Math.min((t - start) / 1000, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------------- Click trong trang ---------------- */

  app.addEventListener("click", (e) => {
    // Cuộn tới mục trong trang Tổng quan (không đổi hash để router không chạy lại)
    const jump = e.target.closest("[data-scroll]");
    if (jump) {
      e.preventDefault();
      const target = document.getElementById(jump.getAttribute("href").slice(1));
      if (target) {
        const top = target.getBoundingClientRect().top + scrollY - document.querySelector(".topbar").offsetHeight - 16;
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
  let lbPhotos = [], lbIndex = 0, lastFocus = null;

  function openLightbox(ids, index) {
    const chain = resolvePath(ids);
    if (!chain) return;
    lbPhotos = ownPhotos(chain[chain.length - 1]);
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    showPhoto(index);
    lb.querySelector(".lb-close").focus();
  }

  function showPhoto(i) {
    lbIndex = (i + lbPhotos.length) % lbPhotos.length;
    const ph = lbPhotos[lbIndex];
    lbImg.classList.remove("loaded");
    lbImg.onload = () => lbImg.classList.add("loaded");
    lbImg.src = img(ph.src, 2000);
    lbImg.alt = ph.caption || "";
    lbCap.innerHTML = `<span class="mono">${lbIndex + 1} / ${lbPhotos.length}</span>${ph.caption ? ` · ${esc(ph.caption)}` : ""}`;
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
    lbImg.src = "";
    lastFocus && lastFocus.focus();
  }

  lb.addEventListener("click", (e) => {
    const action = e.target.closest("[data-lb]")?.dataset.lb;
    if (action === "close" || e.target === lb) closeLightbox();
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

  /* ---------------- Nền "mạng lưới" động ---------------- */

  function startBackground() {
    const c = document.getElementById("bg-canvas");
    const ctx = c.getContext("2d");
    let w, h, nodes;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr;
      h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
      const count = Math.round(Math.min(70, (innerWidth * innerHeight) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
      }));
    };
    resize();
    addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const maxD = 150 * (w / innerWidth);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxD) {
            const t = a.x / w;
            ctx.strokeStyle = `rgba(${Math.round(14 * t)}, ${Math.round(229 - 64 * t)}, ${Math.round(160 + 95 * t)}, ${0.18 * (1 - d / maxD)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = n.x / w < 0.5 ? "rgba(0,229,160,.55)" : "rgba(14,165,255,.55)";
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.6 * (w / innerWidth), 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------------- Khởi động ---------------- */

  document.getElementById("brand-name").textContent = P.handle;
  document.getElementById("footer-name").textContent = P.name;
  document.getElementById("year").textContent = new Date().getFullYear();
  addEventListener("hashchange", route);
  addEventListener("resize", () => setActiveTab(document.querySelector(".tab.active")?.dataset.tab));
  startBackground();
  route();
})();
