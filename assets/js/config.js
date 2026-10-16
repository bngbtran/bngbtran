/* =========================================================
   CẤU HÌNH KẾT NỐI ONLINE
   ---------------------------------------------------------
   Điền sau khi tạo tài khoản (xem HUONG_DAN.md, mục "Lưu dữ liệu online").
   Để trống FIREBASE.projectId thì trang sẽ dùng dữ liệu mẫu trong data.js.

   Các giá trị ở đây là CÔNG KHAI theo thiết kế của Firebase/Cloudinary,
   an toàn khi đưa lên GitHub. Quyền ghi được bảo vệ bởi firestore.rules.
   ========================================================= */

const FIREBASE = {
  apiKey: "AIzaSyBnspfqkLqFljvM_d5DhgswsIH6iGO0DyM",
  authDomain: "bngbtran.firebaseapp.com",
  projectId: "bngbtran",
  appId: "1:540552365075:web:730954f184ff407b47abe6",
};

const CLOUDINARY = {
  cloudName: "db2bvhhbe", // tên cloud, xem ở trang Dashboard của Cloudinary
  uploadPreset: "",     // tên upload preset dạng "Unsigned"
  folder: "portfolio",  // thư mục gốc chứa ảnh trên Cloudinary
};

// Chỉ email này đăng nhập được trang quản trị (phải khớp với firestore.rules)
const ADMIN_EMAIL = "tranbnb.2004@gmail.com";
