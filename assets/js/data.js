/* =========================================================
   DỮ LIỆU PORTFOLIO — chỉ cần sửa file này
   ---------------------------------------------------------
   • PROFILE  : thông tin cá nhân + chuyên môn (tab Tổng quan)
   • ALBUMS   : album ảnh dạng cây, lồng bao nhiêu tầng cũng được
   • PROJECTS : các website đã code (tab Dự án web)

   Ảnh có thể là đường dẫn trong repo, ví dụ:
     "images/albums/viet-nam/binh-dinh/01.jpg"
   hoặc 1 link ảnh trên mạng (https://...).
   Ảnh mẫu bên dưới lấy từ picsum.photos, hãy thay bằng ảnh của bạn.
   ========================================================= */

const PROFILE = {
  name: "Bùi Ngọc Bảo Trân",
  handle: "bngbtran",
  role: "Frontend Developer",
  // Năm bắt đầu code, dùng để tính "số năm kinh nghiệm"
  startedCoding: 2022,
  openToWork: true,
  // Các dòng chữ sẽ lần lượt "gõ" ở trang Tổng quan
  taglines: [
    "Biến thiết kế thành giao diện nhanh, mượt, dễ dùng.",
    "Viết code sạch, dễ đọc, dễ bảo trì.",
    "Đang trên đường trở thành Fullstack Developer.",
  ],
  bio: "Mình là Trân, một lập trình viên web tập trung vào frontend. Mình thích xây những giao diện gọn gàng, hiệu năng tốt và chăm chút trải nghiệm người dùng, đồng thời đang mở rộng sang backend để làm chủ toàn bộ sản phẩm. Ngoài code, mình đi đây đi đó và chụp ảnh.",
  location: "Việt Nam",
  avatar: "", // để trống sẽ hiện chữ cái đầu; hoặc "images/avatar.jpg"
  links: {
    github: "https://github.com/bngbtran",
    email: "tranbnb.2004@gmail.com",
    // linkedin: "https://linkedin.com/in/...",
    // cv: "files/cv.pdf",
  },

  /* ---------- Ngôn ngữ lập trình ----------
     level: 1 → 5 (1 = mới học, 3 = dùng tốt, 5 = rất thành thạo)
     years: số năm đã dùng                                      */
  languages: [
    { name: "JavaScript", level: 4, years: 3, note: "ES2022+, async, DOM, module" },
    { name: "TypeScript", level: 3, years: 2, note: "Generics, kiểu dữ liệu cho React" },
    { name: "HTML5", level: 5, years: 4, note: "Semantic, accessibility, SEO" },
    { name: "CSS3 / SCSS", level: 4, years: 4, note: "Flexbox, Grid, animation, responsive" },
    { name: "SQL", level: 3, years: 2, note: "PostgreSQL, MySQL, truy vấn & thiết kế bảng" },
    { name: "Python", level: 2, years: 1, note: "Script, xử lý dữ liệu cơ bản" },
  ],

  /* ---------- Kỹ năng theo nhóm ---------- */
  skillGroups: [
    { title: "Frontend", icon: "</>", items: ["React", "Next.js", "Vue", "Tailwind CSS", "Redux / Zustand", "Responsive design"] },
    { title: "Backend", icon: "{ }", items: ["Node.js", "Express", "REST API", "JWT / Auth", "Prisma"] },
    { title: "Database", icon: "db", items: ["PostgreSQL", "MySQL", "MongoDB", "Firebase"] },
    { title: "DevOps & Công cụ", icon: "$_", items: ["Git / GitHub", "GitHub Actions", "Docker", "Vercel", "Linux CLI"] },
    { title: "Thiết kế & UX", icon: "◐", items: ["Figma", "Design system", "Accessibility (a11y)"] },
    { title: "Kỹ năng mềm", icon: "∞", items: ["Làm việc nhóm", "Agile / Scrum", "Đọc tài liệu tiếng Anh", "Tự học"] },
  ],

  // Những thứ đang tìm hiểu
  learning: ["Next.js App Router", "Docker", "Testing (Vitest, Playwright)", "System design"],

  /* ---------- Career path: lộ trình phát triển ----------
     status: "done" (đã qua) · "current" (đang ở đây) · "next" (mục tiêu) */
  roadmap: [
    { title: "Nền tảng", detail: "HTML, CSS, JavaScript, Git", status: "done" },
    { title: "Frontend Developer", detail: "React, TypeScript, tối ưu hiệu năng", status: "current" },
    { title: "Fullstack Developer", detail: "Node.js, database, triển khai sản phẩm", status: "next" },
    { title: "Senior / Tech Lead", detail: "Kiến trúc hệ thống, dẫn dắt team", status: "next" },
  ],

  /* ---------- Kinh nghiệm & học vấn (mới nhất ở trên) ----------
     type: "work" | "education" | "milestone"                    */
  experience: [
    {
      type: "work",
      period: "2025 — nay",
      title: "Frontend Developer (Thực tập)", // ← sửa thành vị trí thật
      org: "Tên công ty",
      description: "Mô tả ngắn công việc: phát triển giao diện cho sản phẩm X, làm việc với đội backend qua REST API.",
      highlights: [
        "Xây dựng 10+ màn hình bằng React + TypeScript",
        "Giảm thời gian tải trang 30% nhờ lazy-load và tối ưu ảnh",
      ],
      tech: ["React", "TypeScript", "Tailwind CSS"],
    },
    {
      type: "milestone",
      period: "2024",
      title: "Dự án cá nhân đầu tiên lên production",
      org: "Freelance",
      description: "Thiết kế và code website cho một khách hàng nhỏ, từ Figma đến triển khai.",
      tech: ["HTML", "CSS", "JavaScript"],
    },
    {
      type: "education",
      period: "2022 — 2026",
      title: "Cử nhân Công nghệ Thông tin", // ← sửa thành ngành/trường thật
      org: "Tên trường đại học",
      description: "Học cấu trúc dữ liệu & giải thuật, lập trình hướng đối tượng, cơ sở dữ liệu, mạng máy tính.",
    },
  ],

  // Ngôn ngữ giao tiếp (không bắt buộc)
  spokenLanguages: [
    { name: "Tiếng Việt", level: "Bản ngữ" },
    { name: "Tiếng Anh", level: "Đọc hiểu tài liệu kỹ thuật" },
  ],
};

/* =========================================================
   ALBUMS — dạng cây
   Mỗi album có thể chứa:
     • children: các album con (vd: Việt Nam → Bình Định)
     • photos  : ảnh của chính album đó
   hoặc cả hai. Lồng bao nhiêu tầng cũng được.
   id: viết thường, không dấu, nối bằng "-" (dùng trong đường link)
   ========================================================= */
const ALBUMS = [
  {
    id: "viet-nam",
    title: "Việt Nam",
    description: "Những nơi mình đã đi ở quê nhà.",
    cover: "https://picsum.photos/id/1015/1200/800",
    children: [
      {
        id: "binh-dinh",
        title: "Bình Định",
        date: "2025-07",
        description: "Biển xanh, ghềnh đá và nắng gió miền Trung.",
        cover: "https://picsum.photos/id/1016/1200/800",
        photos: [
          { src: "https://picsum.photos/id/1016/1600/1067", caption: "Eo Gió" },
          { src: "https://picsum.photos/id/1036/1600/1067", caption: "Kỳ Co" },
          "https://picsum.photos/id/1050/1600/1067",
          "https://picsum.photos/id/1053/1067/1600",
        ],
      },
      {
        id: "lam-dong",
        title: "Lâm Đồng",
        description: "Cao nguyên, đồi thông và sương.",
        cover: "https://picsum.photos/id/1018/1200/800",
        children: [
          {
            id: "da-lat",
            title: "Đà Lạt",
            date: "2025-12",
            description: "Thành phố sương mù và những buổi sáng se lạnh.",
            photos: [
              { src: "https://picsum.photos/id/1018/1600/1067", caption: "Đồi thông buổi sớm" },
              { src: "https://picsum.photos/id/1039/1600/1067", caption: "Thác nước" },
              "https://picsum.photos/id/1043/1067/1600",
              { src: "https://picsum.photos/id/1044/1600/1067", caption: "Hoàng hôn" },
            ],
          },
        ],
      },
      {
        id: "quang-nam",
        title: "Quảng Nam",
        date: "2025-04",
        description: "Phố cổ Hội An, đèn lồng và những con hẻm vàng.",
        photos: [
          "https://picsum.photos/id/1067/1600/1067",
          "https://picsum.photos/id/1076/1600/1067",
          "https://picsum.photos/id/1078/1067/1600",
        ],
      },
    ],
  },
];

const PROJECTS = [
  {
    title: "Portfolio cá nhân",
    description: "Chính là trang này: site tĩnh thuần HTML/CSS/JS, không framework, có router riêng, album ảnh lồng nhiều tầng và lightbox.",
    image: "", // ảnh chụp màn hình website, để trống sẽ hiện ô màu
    tags: ["HTML", "CSS", "JavaScript"],
    demo: "https://bngbtran.vercel.app/",
    source: "https://github.com/bngbtran/bngbtran",
    year: 2026,
    featured: true,
  },
  {
    title: "Dự án mẫu #2",
    description: "Mô tả ngắn về website: làm gì, cho ai, điểm nổi bật về kỹ thuật. Thay nội dung này bằng dự án thật của bạn.",
    image: "https://picsum.photos/id/0/1200/750",
    tags: ["React", "TypeScript", "Tailwind CSS"],
    demo: "",
    source: "",
    year: 2025,
    featured: true,
  },
  {
    title: "Dự án mẫu #3",
    description: "Một website khác bạn đã làm, ví dụ có backend riêng và database.",
    image: "https://picsum.photos/id/180/1200/750",
    tags: ["Node.js", "Express", "PostgreSQL"],
    demo: "",
    source: "",
    year: 2025,
  },
];
