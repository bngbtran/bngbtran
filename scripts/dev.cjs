/* Chạy thử trên máy giống Vercel (có cả /api) rồi mở Edge ẩn danh (InPrivate).
   Chạy:  conda run -n msa --no-capture-output node scripts/dev.cjs   (Ctrl+C để dừng) */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 3000);
const projects = require("../api/github-projects.js");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/api/github-projects") {
    res.setHeader("Content-Type", "application/json");
    try {
      return res.end(JSON.stringify(await projects.loadProjects()));
    } catch (err) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: err.message }));
    }
  }
  // Giống cleanUrls của Vercel: /admin → admin.html
  let file = path.join(ROOT, url === "/" ? "index.html" : url);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  if (!path.extname(file)) file += ".html";
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end("Not found");
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(data);
  });
});

server.listen(PORT, "localhost", () => {
  const link = `http://localhost:${PORT}/`;
  console.log(`Đang chạy: ${link}  (admin: ${link}admin)`);
  // -n: luôn mở cửa sổ mới, nên cờ --inprivate có tác dụng cả khi Edge đang mở sẵn
  spawn("open", ["-na", "Microsoft Edge", "--args", "--inprivate", link], { stdio: "ignore" });
});
