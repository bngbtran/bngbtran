(async () => {
  "use strict";

  const app = document.getElementById("app");
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = Store.img;
  const ARROW = `<span class="arrow" aria-hidden="true">→</span>`;
  const ARROW_UP = `<span class="arrow" aria-hidden="true">↗</span>`;

  setupChrome();
  app.innerHTML = `<div class="loading mono"><span class="dot pulse"></span> đang tải</div>`;
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

  const totalPhotos = ALBUMS.reduce((n, a) => n + countPhotos(a), 0);
  const totalAlbums = countAlbums(ALBUMS);
  const yearsCoding = P.startedCoding ? Math.max(1, new Date().getFullYear() - P.startedCoding) : 0;
  const allSkills = (P.skillGroups || []).flatMap((g) => g.items || []);
  const links = P.links || {};

  /* ---------------- Khung chung: header, footer, theme ---------------- */

  function setupChrome() {
    const header = document.getElementById("site-header");
    const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    document.getElementById("theme-toggle").addEventListener("click", () => {
      const root = document.documentElement;
      const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      const next = current === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (_) {}
    });
  }

  function renderFooter() {
    const social = Object.entries(links)
      .filter(([k, v]) => v && k !== "email")
      .map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k[0].toUpperCase() + k.slice(1))}</a>`)
      .join("");
    document.getElementById("site-footer").innerHTML = `
      <div class="wrap footer-cta">
        <div>
          <p class="eyebrow">Liên hệ</p>
          <h2 style="margin-top:18px">Cùng tạo nên<br/>điều gì đó <span class="serif">thật tốt.</span></h2>
          ${links.email ? `<a class="footer-mail" href="mailto:${esc(links.email)}">${esc(links.email)} ${ARROW_UP}</a>` : ""}
        </div>
      </div>
      <div class="wrap footer-bottom">
        <span>© ${new Date().getFullYear()} ${esc(P.name || "")}</span>
        <nav class="footer-links">${social}</nav>
      </div>`;
    const contact = document.getElementById("header-contact");
    if (links.email) contact.href = `mailto:${links.email}`;
    else contact.hidden = true;
  }

  /* ---------------- Tổng quan ---------------- */

  function viewOverview() {
    const current = (P.roadmap || []).find((r) => r.status === "current");
    const featured = PROJECTS.filter((p) => p.featured);
    const nameParts = String(P.name || "").trim().split(/\s+/);
    const last = nameParts.pop() || "";
    const facts = [
      ["Vị trí", esc(P.role || "")],
      current && current.title !== P.role && ["Hiện tại", esc(current.title)],
      P.location && ["Nơi ở", esc(P.location)],
      links.email && ["Email", `<a class="v" href="mailto:${esc(links.email)}">${esc(links.email)}</a>`],
      links.github && ["GitHub", `<a class="v" href="${esc(links.github)}" target="_blank" rel="noopener">${esc(links.github.replace(/^https?:\/\/(www\.)?/, ""))}</a>`],
    ].filter(Boolean);

    return `
      <section class="wrap hero">
        <div class="hero-top">
          <span class="eyebrow">Portfolio · ${new Date().getFullYear()}</span>
          ${P.openToWork ? `<span class="status"><span class="dot pulse"></span> Sẵn sàng cho cơ hội mới</span>` : ""}
        </div>
        <h1 class="hero-name">${esc(nameParts.join(" "))} <span class="serif">${esc(last)}</span></h1>
        <p class="hero-role"><strong>${esc(P.role || "")}</strong>${P.taglines && P.taglines[0] ? ` — ${esc(P.taglines[0])}` : ""}</p>

        <div class="hero-bottom">
          <div>
            <p class="hero-bio">${esc(P.bio || "")}</p>
            <div class="hero-actions">
              <a href="#/projects" class="btn btn-primary">Xem dự án ${ARROW}</a>
              <a href="#career" class="btn btn-outline" data-scroll>Lộ trình nghề nghiệp</a>
            </div>
          </div>
          <ul class="facts">
            ${facts.map(([k, v]) => `<li><span class="k">${k}</span>${v.startsWith("<a") ? v : `<span class="v">${v}</span>`}</li>`).join("")}
          </ul>
        </div>
      </section>

      <div class="wrap">
        <div class="stats">
          ${stat(yearsCoding, "năm viết code", "+")}
          ${stat((P.languages || []).length, "ngôn ngữ lập trình")}
          ${stat(allSkills.length, "công nghệ & công cụ")}
          ${stat(PROJECTS.length, "website đã xây dựng")}
        </div>
      </div>

      ${sectionLanguages()}
      ${sectionSkills()}
      ${sectionRoadmap()}
      ${sectionExperience()}

      ${
        featured.length
          ? section("05", "Dự án nổi bật", "Một vài sản phẩm tiêu biểu mình đã thiết kế và phát triển.",
              `<div class="project-grid">${featured.map(projectCard).join("")}</div>`,
              `<a href="#/projects" class="section-link">Tất cả dự án ${ARROW}</a>`, "featured")
          : ""
      }

      ${
        ALBUMS.length
          ? section("06", "Ngoài giờ code", `${totalPhotos} khung hình từ ${totalAlbums} album, những nơi mình đã đi qua.`,
              `<div class="album-grid">${ALBUMS.slice(0, 3).map((a) => albumCard(a, [a.id])).join("")}</div>`,
              `<a href="#/albums" class="section-link">Xem album ${ARROW}</a>`)
          : ""
      }
    `;
  }

  const stat = (n, label, sup = "") =>
    `<div class="stat"><span class="stat-num"><span data-count="${n}">${n}</span>${sup ? `<sup>${sup}</sup>` : ""}</span><span class="stat-label">${label}</span></div>`;

  const empty = (msg) => `<p class="empty">${msg}</p>`;

  const section = (num, title, desc, body, extra = "", id = "") => `
    <section class="wrap section"${id ? ` id="${id}"` : ""}>
      <div class="section-grid">
        <div class="section-label">
          <span class="section-num">${num} /</span>
          <h2 class="section-title">${esc(title)}</h2>
          ${desc ? `<p class="section-desc">${esc(desc)}</p>` : ""}
          ${extra}
        </div>
        <div class="section-body">${body}</div>
      </div>
    </section>`;

  const LEVELS = ["", "Mới học", "Cơ bản", "Thành thạo vừa", "Thành thạo", "Chuyên sâu"];

  function sectionLanguages() {
    const langs = P.languages || [];
    if (!langs.length) return "";
    const spoken = (P.spokenLanguages || [])
      .map((s) => `<span><b>${esc(s.name)}</b> · ${esc(s.level)}</span>`)
      .join("");
    const body = `
      <div class="lang-list">
        ${langs
          .map((l) => {
            const lv = Math.max(1, Math.min(5, l.level || 1));
            return `
          <div class="lang-row">
            <div>
              <div class="lang-name">${esc(l.name)}</div>
              ${l.note ? `<div class="lang-note">${esc(l.note)}</div>` : ""}
            </div>
            <div class="meter" role="img" aria-label="Mức độ ${lv}/5">
              ${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= lv ? "on" : ""}" style="--i:${i}"></i>`).join("")}
            </div>
            <div class="lang-level">${LEVELS[lv]}</div>
            <div class="lang-years">${l.years ? `${esc(l.years)} năm` : ""}</div>
          </div>`;
          })
          .join("")}
      </div>
      ${spoken ? `<div class="spoken">${spoken}</div>` : ""}`;
    return section("01", "Ngôn ngữ lập trình", "Mức độ tự đánh giá trên thang 5 và số năm sử dụng thực tế.", body, "", "languages");
  }

  function sectionSkills() {
    const groups = P.skillGroups || [];
    if (!groups.length) return "";
    const body = `
      <div class="skill-groups">
        ${groups
          .map(
            (g) => `
          <div class="skill-group">
            <div class="skill-group-head"><h3>${esc(g.title)}</h3><span class="count">${pad2((g.items || []).length)}</span></div>
            <ul class="skill-list">${(g.items || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          </div>`
          )
          .join("")}
      </div>
      ${
        (P.learning || []).length
          ? `<div class="learning"><span class="learning-label"><span class="dot pulse"></span> Đang học</span>${P.learning
              .map((s) => `<span class="item">${esc(s)}</span>`)
              .join("")}</div>`
          : ""
      }`;
    return section("02", "Kỹ năng & công nghệ", "Bộ công cụ mình dùng hằng ngày, chia theo từng mảng.", body, "", "skills");
  }

  function sectionRoadmap() {
    const steps = P.roadmap || [];
    if (!steps.length) return "";
    const label = { done: "Đã hoàn thành", current: "Hiện tại", next: "Mục tiêu" };
    const body = `
      <ol class="roadmap" style="--n:${steps.length}">
        ${steps
          .map(
            (s) => `
          <li class="road-step ${esc(s.status)}">
            <div class="road-track"><span class="road-node"></span></div>
            <span class="road-status">${label[s.status] || ""}</span>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.detail || "")}</p>
          </li>`
          )
          .join("")}
      </ol>`;
    return section("03", "Lộ trình nghề nghiệp", "Mình đang ở đâu và hướng tới đâu.", body, "", "career");
  }

  function sectionExperience() {
    const items = P.experience || [];
    if (!items.length) return "";
    const typeLabel = { work: "Công việc", education: "Học vấn", milestone: "Cột mốc" };
    const body = `
      <div class="exp-list">
        ${items
          .map(
            (e) => `
          <article class="exp-item ${esc(e.type || "")}">
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
    return section("04", "Kinh nghiệm & học vấn", "Những nơi mình đã làm việc, học tập và các cột mốc đáng nhớ.", body, "", "experience");
  }

  /* ---------------- Album ---------------- */

  const FOLDER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

  function albumCard(a, ids) {
    const cover = coverOf(a);
    const subs = kids(a).length;
    const n = countPhotos(a);
    return `
      <a class="album-card ${subs ? "is-folder" : ""}" href="${albumHref(ids)}">
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

  function viewAlbums(ids) {
    if (!ids.length) {
      return `
        <section class="wrap page-head">
          <span class="eyebrow">Album ảnh</span>
          <h1 class="page-title">Những nơi <span class="serif">đã đi qua</span></h1>
          <p class="page-meta">${pad2(totalAlbums)} album · ${totalPhotos} ảnh</p>
        </section>
        <div class="wrap page-body">
          <div class="album-grid">${ALBUMS.map((a) => albumCard(a, [a.id])).join("") || empty("Chưa có album nào.")}</div>
        </div>`;
    }

    const chain = resolvePath(ids);
    if (!chain) return viewNotFound();
    const a = chain[chain.length - 1];
    const photos = ownPhotos(a);
    const subs = kids(a);
    const parentHref = chain.length > 1 ? albumHref(ids.slice(0, -1)) : "#/albums";

    return `
      <section class="wrap page-head">
        ${breadcrumb(chain)}
        <h1 class="page-title">${esc(a.title)}</h1>
        <p class="page-meta">${[a.date && formatDate(a.date), subs.length && `${subs.length} album con`, `${countPhotos(a)} ảnh`].filter(Boolean).join(" · ")}</p>
        ${a.description ? `<p class="page-desc">${esc(a.description)}</p>` : ""}
      </section>
      <div class="wrap page-body">
        ${subs.length ? `<div class="album-grid">${subs.map((c) => albumCard(c, [...ids, c.id])).join("")}</div>` : ""}
        ${
          photos.length
            ? `${subs.length ? `<h2 class="sub-title">Ảnh tại ${esc(a.title)} <span class="faint mono" style="font-size:13px">${photos.length}</span></h2>` : ""}
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
        <a href="${parentHref}" class="back">← Quay lại</a>
      </div>`;
  }

  /* ---------------- Dự án ---------------- */

  function projectCard(p, i) {
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
      <article class="project-card" data-tags="${esc((p.tags || []).join("|"))}">
        ${href ? `<a class="project-media" href="${esc(href)}" target="_blank" rel="noopener">` : `<div class="project-media">`}
          ${media}
          <span class="project-index">${pad2(i + 1)}</span>
        ${href ? "</a>" : "</div>"}
        <div class="project-body">
          <div class="project-head"><h3>${esc(title)}</h3><span class="project-year">${esc(p.year || "")}</span></div>
          <p>${esc(p.description || "")}</p>
          ${(p.tags || []).length ? `<div class="tech">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
          ${links ? `<div class="project-links">${links}</div>` : ""}
        </div>
      </article>`;
  }

  function viewProjects() {
    const tags = [...new Set(PROJECTS.flatMap((p) => p.tags || []))];
    return `
      <section class="wrap page-head">
        <span class="eyebrow">Dự án</span>
        <h1 class="page-title">Những website <span class="serif">mình đã xây</span></h1>
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
        <div class="project-grid">${PROJECTS.map(projectCard).join("") || empty("Chưa có dự án nào.")}</div>
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

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    let html, tab;
    if (parts.length === 0) [html, tab] = [viewOverview(), "overview"];
    else if (parts[0] === "albums") [html, tab] = [viewAlbums(parts.slice(1)), "albums"];
    else if (parts[0] === "projects") [html, tab] = [viewProjects(), "projects"];
    else [html, tab] = [viewNotFound(), null];

    app.innerHTML = `<div class="view">${html}</div>`;
    document.querySelectorAll(".nav a").forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = "";
    afterRender(tab);
  }

  function afterRender(tab) {
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

  renderFooter();
  addEventListener("hashchange", route);
  route();
})();
