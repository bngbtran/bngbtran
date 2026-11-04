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
  role: "Junior Developer",
  // Năm bắt đầu code, dùng để tính "số năm kinh nghiệm"
  startedCoding: 2021,
  openToWork: true,
  // Các dòng chữ sẽ lần lượt "gõ" ở trang Tổng quan
  taglines: [
    "Biến thiết kế thành giao diện nhanh, mượt, dễ dùng.",
    "Viết code sạch, dễ đọc, dễ bảo trì.",
  ],
  bio: "Mình là Trân, lập trình viên fullstack. Mình làm sản phẩm từ giao diện, API, cơ sở dữ liệu đến khi đưa tới tay người dùng.",
  location: "Việt Nam",
  // Trang "Thông tin cá nhân": đoạn giới thiệu dài (xuống dòng = sang đoạn mới) và sở thích
  about: "Mình học chuyên Văn ở THPT chuyên Lê Quý Đôn, Bình Định, rồi chuyển sang Kỹ thuật Phần mềm tại Đại học FPT Quy Nhơn. Mình bắt đầu viết code từ những dòng C đầu tiên hồi đại học, rồi mê luôn cảm giác biến một ý tưởng thành thứ người khác dùng được.\nMình tin một giao diện tốt là nơi thẩm mỹ và kỹ thuật gặp nhau: đẹp để người ta muốn dùng, chắc để người ta tin dùng.\n\nĐi từ Văn sang code, điều mình quan tâm nhất là làm công nghệ hướng tới con người.",
  quote: "Văn học giúp mình hiểu con người và những câu chuyện của họ, công nghệ biến những câu chuyện ấy thành sản phẩm thực tế, có khả năng thay đổi cuộc sống.",
  // Các bài báo nhắc đến (hiện ở trang "Thông tin cá nhân")
  press: [
    { title: "Bùi Ngọc Bảo Trân: Nữ sinh chuyên Văn rẽ hướng học Kỹ thuật phần mềm với học bổng 100%+", source: "Trường Đại học FPT", date: "05/2025", url: "https://daihoc.fpt.edu.vn/bui-ngoc-bao-tran-nu-sinh-chuyen-van-re-huong-hoc-ky-thuat-phan-mem-voi-hoc-bong-100/" },
    { title: "Sinh viên Trường Đại học FPT phát triển ứng dụng AI nhận diện khuôn mặt, nâng tầm trải nghiệm F&B", source: "Trường Đại học FPT", date: "05/2025", url: "https://daihoc.fpt.edu.vn/sinh-vien-truong-dai-hoc-fpt-phat-trien-ung-dung-ai-nhan-dien-khuon-mat-nang-tam-trai-nghiem-fb/" },
    { title: "Học bổng AI 2021 của Trường Đại học FPT", source: "Facebook", url: "https://www.facebook.com/photo/?fbid=190166243035939&set=a.188380729881157" },
    { title: "Điểm sáng phát triển đảng viên trong học sinh", source: "Báo Gia Lai", date: "06/2022", url: "https://baogialai.com.vn/diem-sang-phat-trien-dang-vien-trong-hoc-sinh-post384176.html" },
  ],
  interests: ["Phim", "Nhạc", "Visual art", "Nhiếp ảnh", "Du lịch", "Typography"],
  avatar: "", // để trống sẽ hiện chữ cái đầu; hoặc "images/avatar.jpg"
  links: {
    github: "https://github.com/bngbtran",
    email: "tranbnb.2004@gmail.com",
    // linkedin: "https://linkedin.com/in/...",
    // cv: "files/cv.pdf",
  },

  /* ---------- Ngôn ngữ lập trình ----------
     level: 1 → 5 (1 = mới học, 3 = dùng tốt, 5 = rất thành thạo), không ghi thì không hiện mức độ
     years: số năm đã dùng                                      */
  languages: [
    { name: "C", level: 4 },
    { name: "C++", level: 3 },
    { name: "Java", level: 4 },
    { name: "HTML", level: 3 },
    { name: "CSS", level: 3 },
    { name: "JavaScript", level: 3 },
    { name: "C#", level: 4 },
    { name: "Python", level: 4 },
  ],

  /* ---------- Kỹ năng theo nhóm ---------- */
  skillGroups: [
    { title: "Web & Mobile", icon: "</>", items: ["React", "Node.js", "Vue.js", "Angular", "Mobile"] },
    { title: "AI & Dữ liệu", icon: "{ }", items: ["Machine Learning", "Deep Learning", "Computer Vision", "Natural Language Processing", "Data Mining"] },
    { title: "Xử lý tín hiệu & IoT", icon: "db", items: ["Digital Signal Processing", "Image Processing", "IoT"] },
    { title: "DevOps & Công cụ", icon: "$_", items: ["DevOps", "Docker", "SQL"] },
    { title: "Kỹ năng mềm", icon: "∞", items: ["Làm việc nhóm", "Agile / Scrum", "Đọc tài liệu tiếng Anh"] },
  ],

  /* ---------- Career path: lộ trình phát triển ----------
     status: "done" (đã qua) · "current" (đang ở đây) · "next" (mục tiêu) */
  roadmap: [
    { title: "Nền tảng", detail: "C, C++, Java, HTML, CSS, JavaScript, C#, Python", status: "done" },
    { title: "Junior Developer", detail: "React, Node.js, Vue.js, Angular, Mobile, Docker, SQL, Machine Learning, Deep Learning", status: "current" },
    { title: "Tech Lead", status: "next" },
    { title: "PM", status: "next" },
  ],

  /* ---------- Kinh nghiệm & học vấn (mới nhất ở trên) ----------
     type: "work" | "education" | "milestone"
     links: { "tên link": "đường dẫn" } để dẫn nguồn minh chứng  */
  experience: [
    {
      type: "education",
      period: "2025 — nay",
      title: "Học viên Thạc sĩ Kỹ thuật Phần mềm định hướng Trí tuệ Nhân tạo (MSA)",
      org: "FSB Đà Nẵng",
    },
    {
      type: "milestone",
      period: "2025",
      title: "Đồ án tốt nghiệp SmartMenu",
      org: "Đại học FPT Quy Nhơn",
      description: "Đồ án nhóm 5 người: thực đơn thông minh dùng AI nhận diện khuôn mặt để gợi ý món, kèm nền tảng quản trị thực đơn đồng bộ toàn chuỗi cửa hàng.",
      links: { "Bài viết của Trường Đại học FPT": "https://daihoc.fpt.edu.vn/sinh-vien-truong-dai-hoc-fpt-phat-trien-ung-dung-ai-nhan-dien-khuon-mat-nang-tam-trai-nghiem-fb/" },
    },
    {
      type: "work",
      period: "2023 — 2024",
      title: "OJT",
      org: "FSoft Quy Nhơn",
    },
    {
      type: "education",
      period: "2021 — 2025",
      title: "Sinh viên Kỹ thuật Phần mềm (Software Engineering)",
      org: "Đại học FPT Quy Nhơn",
      highlights: [
        "5 kỳ liên tiếp đạt danh hiệu sinh viên giỏi",
        "2 kỳ lọt Top 100 sinh viên xuất sắc nhất trường",
      ],
      links: { "Bài viết của Trường Đại học FPT": "https://daihoc.fpt.edu.vn/bui-ngoc-bao-tran-nu-sinh-chuyen-van-re-huong-hoc-ky-thuat-phan-mem-voi-hoc-bong-100/" },
    },
    {
      type: "milestone",
      period: "2021",
      title: "Học bổng AI 2021, mức 100%+",
      org: "Trường Đại học FPT",
      description: "Miễn toàn bộ học phí từ đại học đến tiến sĩ, kèm sinh hoạt phí.",
      links: { "Bài viết của Trường Đại học FPT": "https://daihoc.fpt.edu.vn/bui-ngoc-bao-tran-nu-sinh-chuyen-van-re-huong-hoc-ky-thuat-phan-mem-voi-hoc-bong-100/", "Ảnh học bổng trên Facebook": "https://www.facebook.com/photo/?fbid=190166243035939&set=a.188380729881157" },
    },
    {
      type: "education",
      period: "2018 — 2021",
      title: "Học sinh chuyên Văn",
      org: "THPT chuyên Lê Quý Đôn, Bình Định",
      highlights: [
        "Học sinh giỏi Ngữ văn cấp tỉnh: giải Ba năm học 2018-2019, giải Khuyến khích năm học 2019-2020 và 2020-2021",
        "Giải Khuyến khích Olympic khu vực Duyên hải và Đồng bằng Bắc Bộ năm 2019",
      ],
      links: { "Bài viết của Trường Đại học FPT": "https://daihoc.fpt.edu.vn/bui-ngoc-bao-tran-nu-sinh-chuyen-van-re-huong-hoc-ky-thuat-phan-mem-voi-hoc-bong-100/" },
    },
  ],

  // Ngôn ngữ giao tiếp (không bắt buộc)
  spokenLanguages: [
    { name: "Tiếng Việt", level: "Bản ngữ" },
    { name: "Tiếng Anh", level: "Trung cấp" },
    { name: "Tiếng Nhật", level: "Sơ cấp" },
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

/* Tab "Học tập" ở trang Dự án: lấy tự động từ GitHub Star Lists "FPT University" và "FSB".
   Ở đây là tên môn và giới thiệu một câu, ghép theo tên repo (repo:), đồng thời là
   danh sách dự phòng khi không đọc được GitHub. Description trên GitHub được ưu tiên hơn intro. */
const COURSES = [
  { group: "fpt", repo: "PRN211", language: "C#", title: "Lập trình C# cơ bản", intro: "Assignment, lab và bài thi thực hành với C#." },
  { group: "fpt", repo: "PRN221", language: "C#", title: "Lập trình .NET nâng cao", intro: "Assignment, lab, bài thi và dự án môn học trên .NET." },
  { group: "fpt", repo: "EXE101", language: "C#", title: "Khởi nghiệp trải nghiệm", intro: "NiceHouse, sản phẩm thử nghiệm viết bằng C#." },
  { group: "fpt", repo: "SWP391", language: "C#", title: "Đồ án phát triển phần mềm", intro: "Đồ án nhóm FITM, làm trọn quy trình phát triển phần mềm." },
  { group: "fpt", repo: "PRU212", language: "C#", title: "Lập trình game với Unity", intro: "Dự án môn học viết bằng C#." },
  { group: "fpt", repo: "OJT202", language: "HTML", title: "Thực tập doanh nghiệp (OJT)", intro: "Ghi chú và bài luyện frontend trong kỳ OJT, gồm FER201m và Vue.js." },
  { group: "fpt", repo: "PRF192", language: "C++", title: "Nhập môn lập trình", intro: "Các workshop và bài thi thực hành, nơi viết những dòng code đầu tiên." },
  { group: "fpt", repo: "PRO192", language: "Java", title: "Lập trình hướng đối tượng với Java", intro: "Các ứng dụng quản lý nhỏ: ngân hàng, khách sạn, thư viện, nhân viên." },
  { group: "fpt", repo: "PRJ301", language: "Java", title: "Lập trình web với Java", intro: "Giao diện JSP và các ứng dụng Servlet." },
  { group: "fpt", repo: "LAB211", language: "Java", title: "Thực hành Java", intro: "Quản lý sách, đĩa CD và sản phẩm." },
  { group: "fpt", repo: "CSD201", language: "Java", title: "Cấu trúc dữ liệu và giải thuật", intro: "Linked list, stack, queue, đồ thị, biểu thức và cây BST." },
  { group: "fpt", repo: "CEA201", language: "Assembly", title: "Kiến trúc máy tính", intro: "Chín bài tập lập trình Assembly." },
  { group: "fpt", repo: "SEP490", language: "C#", title: "Đồ án tốt nghiệp", intro: "SmartMenu: thực đơn thông minh dùng AI nhận diện khuôn mặt để gợi ý món, gồm backend, web và app mobile." },
  { group: "fpt", repo: "PRN231", language: "C#", title: "Xây dựng backend với .NET", intro: "Assignment, lab, bài thi và dự án môn học." },
  { group: "fpt", repo: "PRM392", language: "Java", title: "Lập trình Android", intro: "Ứng dụng Android xây dựng bằng Gradle." },
  { group: "fpt", repo: "NLP301c", language: "Jupyter Notebook", title: "Xử lý ngôn ngữ tự nhiên", intro: "Bài tập notebook của chuỗi bốn khóa học NLP." },
  { group: "fpt", repo: "AID301c", language: "Jupyter Notebook", title: "Phát triển ứng dụng AI", intro: "Notebook code theo khóa học trực tuyến." },
  { group: "fpt", repo: "MAE101", language: "", title: "Toán cho kỹ thuật", intro: "Hai bài assignment của môn học." },
  { group: "fpt", repo: "OSG202", language: "", title: "Hệ điều hành", intro: "Bốn bài lab có hướng dẫn, bài thuyết trình và bài làm lý thuyết theo từng chương." },
  { group: "fpt", repo: "NWC203c", language: "", title: "Mạng máy tính", intro: "Bốn khóa Coursera về truyền thông mạng, mạng LAN, chuyển mạch gói và TCP/IP." },
  { group: "fpt", repo: "MAD101", language: "", title: "Toán rời rạc", intro: "Bảy assignment, bốn computer project và ba bài progress test." },
  { group: "fpt", repo: "SSL101c", language: "", title: "Kỹ năng học tập đại học", intro: "Năm khóa Coursera về kỹ năng số, giải quyết vấn đề, tư duy phản biện và giao tiếp." },
  { group: "fpt", repo: "SSG104", language: "", title: "Kỹ năng giao tiếp và cộng tác", intro: "Bài luận, bài thuyết trình và báo cáo dự án kinh doanh nhóm." },
  { group: "fpt", repo: "DBI202", language: "TSQL", title: "Cơ sở dữ liệu", intro: "Các bài lab, script SQL và dự án môn học với SQL Server." },
  { group: "fpt", repo: "IOT102", language: "", title: "Internet vạn vật", intro: "Các bài lab với cảm biến, servo, LED 7 đoạn và LCD, kèm dự án mô phỏng trên Tinkercad." },
  { group: "fpt", repo: "WED201c", language: "", title: "Thiết kế web", intro: "Năm khóa Coursera về HTML5, CSS3, JavaScript và responsive design." },
  { group: "fpt", repo: "SWE201c", language: "", title: "Nhập môn Kỹ thuật phần mềm", intro: "Bốn khóa Coursera về quy trình phát triển, Agile, Lean và chất lượng phần mềm." },
  { group: "fpt", repo: "MAS291", language: "", title: "Xác suất thống kê", intro: "Hai bài assignment và computer project làm theo nhóm." },
  { group: "fpt", repo: "JPD123", language: "", title: "Tiếng Nhật sơ cấp 2", intro: "Chín bài kiểm tra, bốn bài hội thoại và bài tự giới thiệu." },
  { group: "fpt", repo: "JPD113", language: "", title: "Tiếng Nhật sơ cấp 1", intro: "Sáu bài kiểm tra, ba bài hội thoại và bản dịch giáo trình Dekiru." },
  { group: "fpt", repo: "SWR302", language: "", title: "Yêu cầu phần mềm", intro: "Mười bài thuyết trình nhóm về quản lý yêu cầu, kèm bài thi thực hành." },
  { group: "fpt", repo: "ITE302c", language: "", title: "Đạo đức trong CNTT", intro: "Sáu khóa Coursera về đạo đức trong công nghệ dựa trên dữ liệu." },
  { group: "fpt", repo: "ENW492c", language: "", title: "Viết học thuật", intro: "Chứng chỉ Coursera về ngữ pháp và viết tiếng Anh, kèm tài liệu và các bài luận mẫu." },
  { group: "fpt", repo: "SWT301", language: "", title: "Kiểm thử phần mềm", intro: "Bốn bài lab và ba bài thuyết trình làm theo nhóm." },
  { group: "fpt", repo: "PMG201c", language: "", title: "Quản lý dự án", intro: "Bốn khóa Coursera về lập kế hoạch, ngân sách, tiến độ và rủi ro dự án." },
  { group: "fpt", repo: "SWD392", language: "", title: "Kiến trúc và thiết kế phần mềm", intro: "Mười sáu bài thuyết trình nhóm về kiến trúc và thiết kế phần mềm." },
  { group: "fpt", repo: "MLN111", language: "", title: "Triết học Mác - Lênin", intro: "Thuyết trình nhóm về cuộc cách mạng triết học của Mác và Ăng-ghen." },
  { group: "fpt", repo: "EXE201", language: "", title: "Khởi nghiệp trải nghiệm 2", intro: "Tiếp tục NiceHouse: báo cáo tiến độ, báo cáo cuối kỳ, slide và bộ logo." },
  { group: "fpt", repo: "WDU203c", language: "", title: "Thiết kế UI/UX", intro: "Sáu khóa Coursera về nguyên lý UX, nhu cầu người dùng, đánh giá thiết kế và prototype." },
  { group: "fpt", repo: "MLN122", language: "", title: "Kinh tế chính trị Mác - Lênin", intro: "Tiểu luận nhóm về công nghiệp hóa và hội nhập kinh tế của Việt Nam, kèm bài luận cá nhân." },
  { group: "fpt", repo: "HCM202", language: "", title: "Tư tưởng Hồ Chí Minh", intro: "Tổ chức fieldtrip Bước chân gắn kết đến bảo tàng và trung tâm bảo trợ xã hội, từ nhận diện đến cẩm nang." },
  { group: "fpt", repo: "MLN131", language: "", title: "Chủ nghĩa xã hội khoa học", intro: "Bài thuyết trình nhóm của môn học." },
  { group: "fpt", repo: "VNR202", language: "", title: "Lịch sử Đảng Cộng sản Việt Nam", intro: "Tiểu luận và ấn phẩm nhóm về quá trình đấu tranh giành chính quyền giai đoạn 1930 đến 1945." },
  { group: "fsb", repo: "PPR501", language: "Jupyter Notebook", title: "Lập trình Python", intro: "Bài tập, thực hành và dự án môn học." },
  { group: "fsb", repo: "DSP501", language: "HTML", title: "Xử lý tín hiệu số", intro: "Bài tập, lab và dự án môn học." },
  { group: "fsb", repo: "IVP501", language: "Jupyter Notebook", title: "Xử lý ảnh và video", intro: "Quiz, lab và dự án môn học." },
  { group: "fsb", repo: "MLE501", language: "Jupyter Notebook", title: "Machine Learning", intro: "Bài tập về nhà, ghi chú, thực hành và dự án." },
  { group: "fsb", repo: "AIN501", language: "Jupyter Notebook", title: "Trí tuệ nhân tạo", intro: "Bài tập, thực hành và dự án Deep-Road." },
  { group: "fsb", repo: "IAD501", language: "Python", title: "Phát triển ứng dụng IoT", intro: "Bài tập, lab và dự án môn học." },
  { group: "fsb", repo: "PHI501", language: "", title: "Triết học", intro: "Thuyết trình nhóm về nguyên tắc thống nhất giữa lý luận và thực tiễn." },
  { group: "fsb", repo: "SWM501", language: "", title: "Quản lý dự án Agile", intro: "Bốn khóa Coursera và dự án nhóm bản địa hóa LibreOffice Writer cho doanh nghiệp vừa và nhỏ ở Việt Nam." },
  { group: "fsb", repo: "DAM501", language: "", title: "Khai phá dữ liệu", intro: "Chứng chỉ Data Mining trên Coursera gồm ba khóa: quy trình, phương pháp và dự án." },
  { group: "fsb", repo: "SEM501", language: "", title: "Seminar chuyên đề", intro: "Báo cáo seminar cùng các khóa học về deep learning, NLP và AI tạo sinh." },
  { group: "fsb", repo: "MLR501", language: "", title: "Nghiên cứu Machine Learning", intro: "Đề xuất nghiên cứu về cân bằng độ chính xác và khả năng giải thích trong hệ gợi ý." },
  { group: "fsb", repo: "MHP501", language: "", title: "Quản trị và phát triển nhóm hiệu suất cao", intro: "Báo cáo đánh giá cuối môn." },
];

/* Danh sách dự án lấy tự động từ GitHub Star List "Study" (xem api/github-projects.js).
   Ở đây chỉ là nội dung riêng cho từng repo, ghép theo tên repo (repo:),
   đồng thời là danh sách dự phòng khi không đọc được GitHub.
   Repo gắn sao Study mà không có ở đây vẫn hiện, với thông tin từ GitHub. */
const PROJECTS = [
  {
    repo: "MergeVN",
    title: "MergeVN",
    description: "Chuyển địa chỉ hành chính cũ sang địa chỉ mới sau đợt sáp nhập 07/2025, tra cứu theo tỉnh, huyện, xã. Dữ liệu chỉ nằm phía server, có thêm app Android.",
    image: "images/projects/mergevn/01.webp",
    gallery: ["images/projects/mergevn/02.webp"],
    tags: ["Vue 3", "Vite", "PrimeVue", "Tailwind CSS", "Vercel Functions", "Kotlin"],
    demo: "https://bngbtran-mergevn.vercel.app",
    source: "https://github.com/bngbtran/MergeVN",
    year: 2026,
    featured: true,
  },
  {
    repo: "DocCon",
    title: "DocCon",
    description: "Chuyển PDF sang Word, giữ font, bảng biểu và bố cục. Hỗ trợ cả PDF văn bản, PDF scan và PDF hỗn hợp nhờ OCR.",
    image: "images/projects/doccon/01.webp",
    tags: ["React", "Vite", "FastAPI", "PyMuPDF", "EasyOCR", "Docker"],
    demo: "https://bngbtran-doccon.vercel.app",
    source: "https://github.com/bngbtran/DocCon",
    year: 2026,
    featured: true,
  },
  {
    repo: "VET",
    title: "Vệt",
    description: "Biến một hành trình thành video lộ trình động trên bản đồ, xuất video ngay trong trình duyệt, không cần backend hay tài khoản.",
    image: "images/projects/vet/01.webp",
    gallery: ["images/projects/vet/02.webp"],
    tags: ["React", "TypeScript", "MapLibre GL", "WebCodecs"],
    demo: "https://bngbtran-vet.vercel.app",
    source: "https://github.com/bngbtran/VET",
    year: 2026,
    featured: true,
  },
  {
    repo: "VUT",
    title: "VÚT",
    description: "Theo dõi chuyến bay trong ngày: giờ bay, cổng, trạng thái và thời tiết ở hai đầu hành trình.",
    image: "images/projects/vut/01.webp",
    gallery: ["images/projects/vut/02.webp"],
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Upstash Redis"],
    demo: "https://bngbtran-vut.vercel.app",
    source: "https://github.com/bngbtran/VUT",
    year: 2026,
    featured: true,
  },
  {
    repo: "Margelle",
    title: "Margelle",
    description: "Kệ sách trích dẫn dùng chung: mỗi playlist là một cuốn sách trên kệ, mỗi trích dẫn là một trang, chân trang ghi tên người đóng góp.",
    image: "images/projects/margelle/01.webp",
    tags: ["React", "Vite", "Tailwind CSS", "shadcn/ui", "Firebase"],
    demo: "https://bngbtran-margelle.vercel.app",
    source: "https://github.com/bngbtran/Margelle",
    year: 2026,
  },
  {
    repo: "TextGen",
    title: "TextGen",
    description: "Công cụ nhỏ giúp ghi nhớ bảng chữ cái: nhập từ hoặc tải file lên, trang sẽ hiển thị từng chữ để luyện.",
    image: "images/projects/textgen/01.webp",
    tags: ["HTML", "CSS", "JavaScript"],
    demo: "https://bngbtran.github.io/TextGen/",
    source: "https://github.com/bngbtran/TextGen",
    year: 2025,
  },
  {
    repo: "Window-Music-Player",
    title: "Window Music Player",
    description: "Ứng dụng nghe nhạc WPF cho Windows: tự tạo playlist theo thư mục, hỗ trợ phím media toàn cục và chế độ Focus đếm giờ làm việc.",
    tags: ["C#", "WPF", ".NET 8"],
    source: "https://github.com/bngbtran/Window-Music-Player",
    year: 2026,
  },
  {
    repo: "bngbtran",
    title: "Portfolio cá nhân",
    description: "Chính là trang này: site tĩnh không dùng framework, có trang quản trị sửa ngay trên giao diện và cập nhật realtime, kèm app Android.",
    image: "images/projects/portfolio/01.webp",
    gallery: ["images/projects/portfolio/02.webp"],
    tags: ["HTML", "CSS", "JavaScript", "Firebase", "Cloudinary"],
    demo: "https://bngbtran.vercel.app",
    source: "https://github.com/bngbtran/bngbtran",
    year: 2026,
  },
];

/* =========================================================
   TEXTS — các dòng chữ trên trang (sửa được trong admin → "Nội dung trang")
   • *chữ*    : chữ nghiêng màu nhấn
   • xuống dòng: ngắt dòng (dùng cho tiêu đề lớn)
   • {photos} {albums} {projects} {location} {year}: tự thay bằng số liệu thật
   ========================================================= */
const TEXTS = {
  heroCommand: "whoami",
  statement: ", người lo cả phần nhìn thấy lẫn phần không ai thấy.",
  openToWork: "Sẵn sàng cho cơ hội mới",
  ctaPrimary: "Xem dự án",
  ctaSecondary: "Lộ trình nghề nghiệp",

  statYears: "năm viết code",
  statLanguages: "ngôn ngữ lập trình",
  statSkills: "công nghệ & công cụ",
  statProjects: "dự án đã xây dựng",

  languagesTitle: "Ngôn ngữ lập trình",
  languagesDesc: "Mức độ tự đánh giá trên thang 5.",
  skillsTitle: "Kỹ năng & công nghệ",
  skillsDesc: "Các mảng công nghệ mình đã làm việc, chia theo từng nhóm.",
  learningLabel: "Đang học",
  roadmapTitle: "Lộ trình nghề nghiệp",
  roadmapDesc: "Mình đang ở đâu và hướng tới đâu.",
  experienceTitle: "Kinh nghiệm & học vấn",
  experienceDesc: "Từ học sinh chuyên Văn đến lập trình viên, mình tập trung làm công nghệ hướng tới con người.",
  featuredTitle: "Dự án nổi bật",
  featuredDesc: "Một vài sản phẩm tiêu biểu mình đã thiết kế và phát triển.",
  featuredLink: "Tất cả dự án",
  albumsPreviewTitle: "Ngoài giờ code",
  albumsPreviewDesc: "{photos} khung hình từ {albums} album, những nơi mình đã đi qua.",
  albumsPreviewLink: "Xem album",

  albumsEyebrow: "Album ảnh",
  albumsHeading: "Những nơi *đã đi qua*",
  projectsEyebrow: "Dự án",
  projectsHeading: "Những dự án *mình đã xây*",
  projectsTabMain: "Sản phẩm",
  projectsTabStudy: "Học tập",
  studyEyebrow: "Học tập",
  studyHeading: "Những môn *mình đã đi qua*",
  studyDesc: "Bài tập, lab và đồ án qua từng môn học, từ những dòng C đầu tiên đến AI.",
  courseGroupFpt: "FPT University",
  courseGroupFptDesc: "Cử nhân Kỹ thuật Phần mềm, 2021 — 2025.",
  courseGroupFsb: "FSB",
  courseGroupFsbDesc: "Thạc sĩ Kỹ thuật Phần mềm định hướng Trí tuệ Nhân tạo, 2025 — nay.",

  aboutEyebrow: "Thông tin cá nhân",
  aboutHeading: "Một chút *về mình*",
  aboutContact: "Liên hệ",
  aboutPress: "Báo chí nhắc đến",
  aboutInterests: "Sở thích",
  aboutLanguages: "Ngôn ngữ",
  aboutLearning: "Đang học",

  footerEyebrow: "Liên hệ",
  footerHeading: "Bạn có ý tưởng?\nMình *cùng làm nhé.*",
  footerRegards: "Thân ái,",
};
