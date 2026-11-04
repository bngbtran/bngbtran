#!/usr/bin/env node
/* Lấy dữ liệu README bằng chính store.js của web, nên dự án, thứ tự và nội dung luôn khớp với trang:
   GitHub Star Lists (qua /api/github-projects) + Firestore + data.js.
   Không đọc được nguồn sống thì báo lỗi, để không ghi đè README bằng dữ liệu dự phòng. */
const fs = require("fs"), path = require("path"), vm = require("vm");

const SITE = process.env.README_SITE || "https://bngbtran.vercel.app";
const API = "/api/github-projects";
let apiOk = false;

const siteFetch = async (url, opts = {}) => {
  if (!String(url).startsWith(API)) return fetch(url, opts);
  // Bỏ giới hạn 5 giây của trình duyệt: hàm serverless có thể đang khởi động lại
  const res = await fetch(SITE + url);
  apiOk = res.ok;
  return res;
};
const sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const ctx = vm.createContext({ fetch: siteFetch, sessionStorage, console: { error: console.error, log() {} }, AbortController, setTimeout, clearTimeout, encodeURIComponent });
const js = path.join(__dirname, "..", "assets", "js");
const source = ["config.js", "data.js", "store.js"].map((f) => fs.readFileSync(path.join(js, f), "utf8")).join("\n;\n");

vm.runInContext(`${source}\n;this.TEXTS_ = TEXTS; this.load_ = () => Store.load();`, ctx);

ctx.load_().then((d) => {
  if (d.source !== "online") throw new Error(`Không đọc được Firestore (source=${d.source})`);
  if (!apiOk) throw new Error(`Không đọc được ${SITE}${API}`);
  process.stdout.write(JSON.stringify({ PROFILE: d.PROFILE, PROJECTS: d.PROJECTS, COURSES: d.COURSES, TEXTS: ctx.TEXTS_ }));
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
