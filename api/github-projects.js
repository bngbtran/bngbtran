/* =========================================================
   Danh sách dự án lấy từ GitHub Star Lists: "Study" (tab Sản phẩm),
   "FPT University" và "FSB" (tab Học tập).
   Gắn sao cho repo nào là repo đó tự lên trang (không cần deploy lại).
   Không cần token: đọc trang danh sách công khai; thông tin repo lấy từ REST API công khai.
   Kết quả lưu tạm ở CDN của Vercel để không gọi GitHub quá nhiều.
   ========================================================= */
const OWNER = "bngbtran";
const PRODUCT_LIST = "study";
const COURSE_LISTS = { fpt: "fpt-university", fsb: "fsb" };
const PAGE_SIZE = 30; // GitHub hiện tối đa 30 repo mỗi trang danh sách
const HEADERS = { "User-Agent": "bngbtran-portfolio" };

const decode = (s = "") =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// Mỗi repo trong trang danh sách là một khối <h2><a href="/chủ/tên">...
function parseList(html) {
  const start = html.indexOf('id="user-list-repositories"');
  if (start < 0) return [];
  const blocks = html.slice(start).split('<div class="d-inline-block mb-1">').slice(1);
  return blocks.flatMap((b) => {
    const m = b.match(/<a href="\/([\w.-]+)\/([\w.-]+)">/);
    if (!m) return [];
    const desc = b.match(/<p[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/p>/) || b.match(/<div class="py-1">\s*<p[^>]*>([\s\S]*?)<\/p>/);
    const lang = b.match(/itemprop="programmingLanguage">([^<]+)</);
    return [{ owner: m[1], name: m[2], description: desc ? decode(desc[1]) : "", language: lang ? lang[1] : "" }];
  });
}

async function readList(slug) {
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`https://github.com/stars/${OWNER}/lists/${slug}?page=${page}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Star list: ${res.status}`);
    const found = parseList(await res.text());
    const fresh = found.filter((r) => !repos.some((x) => x.owner === r.owner && x.name === r.name));
    repos.push(...fresh);
    if (found.length < PAGE_SIZE || !fresh.length) break;
  }
  return repos;
}

// Một lần gọi lấy đủ website, mô tả, năm của mọi repo; lỗi thì vẫn dùng được thông tin ở trang danh sách
async function readRepoDetails() {
  try {
    const res = await fetch(`https://api.github.com/users/${OWNER}/repos?per_page=100`, { headers: { ...HEADERS, Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) } });
    if (!res.ok) return {};
    return Object.fromEntries((await res.json()).map((r) => [r.name.toLowerCase(), r]));
  } catch {
    return {};
  }
}

const toRepo = (details) => (r) => {
  const d = (r.owner === OWNER && details[r.name.toLowerCase()]) || {};
  return {
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
    description: d.description || r.description,
    language: d.language || r.language,
    homepage: d.name ? d.homepage || "" : null, // null = chưa biết (REST lỗi), khác với "" = repo không có website
    topics: d.topics || [],
    year: d.created_at ? Number(d.created_at.slice(0, 4)) : null,
    image: `https://opengraph.githubassets.com/portfolio/${r.owner}/${r.name}`,
  };
};

async function loadProjects() {
  const [list, details, ...courseLists] = await Promise.all([
    readList(PRODUCT_LIST),
    readRepoDetails(),
    // Danh sách môn học lỗi thì trang dùng bản dự phòng, không làm hỏng cả tab Sản phẩm
    ...Object.values(COURSE_LISTS).map((slug) => readList(slug).catch(() => null)),
  ]);
  if (!list.length) throw new Error("Không đọc được repo nào từ star list");
  const courses = Object.fromEntries(
    Object.keys(COURSE_LISTS).map((k, i) => [k, courseLists[i] && courseLists[i].length ? courseLists[i].map(toRepo(details)) : null])
  );
  return { repos: list.map(toRepo(details)), courses };
}

module.exports = async (req, res) => {
  try {
    const data = await loadProjects();
    // Trên CDN: dùng lại 2 phút (REST không token chỉ có 60 lượt/giờ), sau đó trả bản cũ trong lúc lấy bản mới ở nền
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=120, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "Không đọc được danh sách từ GitHub" });
  }
};
module.exports.parseList = parseList;
module.exports.loadProjects = loadProjects;
