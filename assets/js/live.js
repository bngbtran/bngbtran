/* =========================================================
   Cập nhật realtime cho trang chính: lắng nghe Firestore, có thay đổi
   (vừa sửa trong trang quản trị) là trang tự vẽ lại, không cần tải lại.
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// So sánh không phụ thuộc thứ tự khóa, để lần nhận dữ liệu đầu tiên (giống hệt lúc tải) không vẽ lại thừa
const stable = (v) =>
  Array.isArray(v) ? `[${v.map(stable).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`
  : JSON.stringify(v);

if (Store.online() && !window.EDIT_MODE) {
  const ready = new Promise((r) => (window.Portfolio ? r() : document.addEventListener("portfolio:ready", r, { once: true })));
  const db = getFirestore(initializeApp(FIREBASE));
  const raw = { profile: undefined, albums: undefined, projects: undefined };
  let last = null;

  const push = async () => {
    if (Object.values(raw).includes(undefined)) return; // chờ đủ cả 3 nguồn
    await ready;
    const data = Store.shape(raw.profile, raw.albums, raw.projects);
    const key = stable(data);
    const pf = window.Portfolio;
    if (last === null) last = stable({ PROFILE: pf.P, ALBUMS: pf.ALBUMS, PROJECTS: pf.PROJECTS });
    if (key === last) return;
    last = key;
    Store.saveCache(data);
    pf.replace(data);
  };

  const docs = (snap) => snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
  const fail = (err) => console.warn("Không nghe được cập nhật realtime:", err);
  onSnapshot(doc(db, "site", "profile"), (s) => ((raw.profile = s.exists() ? s.data() : null), push()), fail);
  onSnapshot(collection(db, "albums"), (s) => ((raw.albums = docs(s)), push()), fail);
  onSnapshot(collection(db, "projects"), (s) => ((raw.projects = docs(s)), push()), fail);
}
