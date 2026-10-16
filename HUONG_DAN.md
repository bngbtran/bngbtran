# Hướng dẫn cập nhật portfolio

Site có hai chế độ:

- **Chưa cấu hình online:** nội dung lấy từ `assets/js/data.js`, bạn sửa file rồi đẩy lên GitHub.
- **Đã cấu hình online:** dữ liệu nằm trên **Cloud Firestore**, ảnh nằm trên **Cloudinary**.
  Bạn vào `admin.html`, đăng nhập Google, rồi thêm/sửa/upload ngay trên web, không cần đụng vào code.

## Xem thử trên máy

```bash
npx serve .
```

Rồi mở `http://localhost:3000` (trang chính) và `http://localhost:3000/admin.html` (quản trị).
Trang quản trị không chạy được khi mở thẳng file bằng `file://`.

## Lưu dữ liệu online (miễn phí, không cần thẻ)

| Dịch vụ | Dùng để | Gói miễn phí |
|---|---|---|
| Cloud Firestore (gói Spark) | Hồ sơ, album, dự án | 1 GiB dữ liệu, 50.000 lượt đọc + 20.000 lượt ghi mỗi ngày |
| Firebase Authentication | Đăng nhập trang quản trị | Miễn phí |
| Cloudinary (gói Free) | Lưu ảnh | 25 credit/tháng, 1 credit = 1 GB lưu trữ **hoặc** 1 GB băng thông |

1 GiB dữ liệu chữ là quá đủ (mỗi ảnh chỉ tốn khoảng 200 byte trong Firestore).
Phần ảnh: trang admin tự nén ảnh về tối đa 2560px trước khi tải lên (khoảng 0,5–1 MB/ảnh),
và trang chính chỉ tải bản thu nhỏ vừa khung hiển thị, nên 25 credit đủ cho vài nghìn ảnh.

### Bước 1: Firebase (dữ liệu + đăng nhập)

1. Vào https://console.firebase.google.com → **Create a project** (không cần bật Google Analytics).
2. **Build → Firestore Database → Create database**, chọn vị trí `asia-southeast1` (Singapore), chế độ **production**.
3. Trong Firestore, mở tab **Rules**, dán toàn bộ nội dung file `firestore.rules` vào, rồi bấm **Publish**.
4. **Build → Authentication → Get started → Sign-in method → Google → Enable**.
5. Ở **Authentication → Settings → Authorized domains**, thêm domain Vercel của bạn (vd: `bngbtran.vercel.app`).
6. Bấm ⚙ **Project settings → General → Your apps → biểu tượng `</>` (Web)**, đặt tên app rồi bấm Register.
   Chép các giá trị `apiKey`, `authDomain`, `projectId`, `appId` vào `FIREBASE` trong `assets/js/config.js`.

### Bước 2: Cloudinary (ảnh)

1. Đăng ký tại https://cloudinary.com (gói Free). Ở trang Dashboard, chép **Cloud name** vào `CLOUDINARY.cloudName`.
2. Vào **Settings → Upload → Upload presets → Add upload preset**:
   - **Signing mode: Unsigned**
   - **Asset folder:** `portfolio`
   - Nên giới hạn **Allowed formats:** `jpg, png, webp, heic`, và **Max file size** khoảng 15 MB
   - Lưu lại, rồi chép tên preset vào `CLOUDINARY.uploadPreset`.

> Preset "Unsigned" nghĩa là ai biết tên preset cũng tải ảnh lên Cloudinary của bạn được (nhưng không xóa hay sửa được gì).
> Với portfolio cá nhân thì rủi ro này thấp. Các giới hạn ở trên giúp hạn chế bị lạm dụng. Nếu thấy lạ, chỉ cần đổi tên preset.

### Bước 3: Đưa dữ liệu lên

1. Chạy `npx serve .`, mở `http://localhost:3000/admin.html`, đăng nhập bằng Google (đúng email trong `ADMIN_EMAIL`).
2. Vào tab **Công cụ → Nhập dữ liệu** để đẩy toàn bộ nội dung đang có trong `data.js` lên Firestore.
3. Từ giờ mọi thay đổi đều làm trong trang admin. File `data.js` chỉ còn là dữ liệu dự phòng
   (trang chính sẽ dùng nó nếu không kết nối được Firestore).

### Dùng trang quản trị

- **Album:** cây album bên trái. Chọn album để sửa thông tin, bấm **+ Album con** để tạo tầng dưới.
  Kéo thả nhiều ảnh vào khung để tải lên. Với từng ảnh: sửa chú thích (tự lưu), ← → để đổi thứ tự,
  ★ để đặt làm ảnh bìa, ✕ để bỏ khỏi album.
- **Dự án:** thêm/sửa website, tải ảnh chụp màn hình lên.
- **Hồ sơ:** sửa phần chuyên môn dạng JSON (các trường giống mục bên dưới), và tải ảnh đại diện lên.
- **Công cụ:** tải file sao lưu JSON về máy, nên làm định kỳ.

Lưu ý: xóa ảnh/album trong admin chỉ gỡ khỏi portfolio, còn file ảnh vẫn nằm trên Cloudinary
(xóa file thật cần khóa bí mật, không thể để lộ trên web). Muốn dọn dung lượng thì vào Cloudinary Console → Media Library.

Trang chính lưu tạm dữ liệu 5 phút trong trình duyệt. Nếu vừa sửa xong mà chưa thấy cập nhật, hãy mở tab mới.

---

*Các mục dưới đây mô tả cấu trúc dữ liệu: dùng khi sửa `data.js` (chế độ offline) hoặc JSON ở tab Hồ sơ.*

## Phần chuyên môn (tab Tổng quan)

Trong `PROFILE` của `data.js`:

| Trường | Hiện ở đâu |
|---|---|
| `role`, `bio`, `taglines`, `openToWork`, `startedCoding` | Phần đầu trang + khung code |
| `languages` | **01. Ngôn ngữ lập trình**: `level` từ 1 → 5, `years` là số năm dùng |
| `skillGroups`, `learning` | **02. Kỹ năng & công nghệ** (theo nhóm) + "đang học" |
| `roadmap` | **03. Career path**: `status` là `"done"`, `"current"` hoặc `"next"` |
| `experience` | **04. Kinh nghiệm & học vấn**: `type` là `"work"`, `"education"` hoặc `"milestone"` |
| `spokenLanguages` | Dòng "giao tiếp" dưới phần ngôn ngữ |

Dự án có `featured: true` sẽ hiện ở mục **05. Dự án nổi bật**.

## Album ảnh nhiều tầng

Album có dạng cây. Mỗi album có thể chứa `children` (album con), `photos` (ảnh), hoặc cả hai,
và lồng bao nhiêu tầng cũng được. Ví dụ: **Việt Nam → Bình Định → ảnh**:

1. Tạo thư mục ảnh tương ứng, ví dụ `images/albums/viet-nam/binh-dinh/`, rồi chép ảnh vào.
2. Khai báo trong mảng `ALBUMS`:

```js
{
  id: "viet-nam",                // viết thường, không dấu, nối bằng "-"
  title: "Việt Nam",
  description: "Những nơi mình đã đi ở quê nhà.",
  cover: "images/albums/viet-nam/binh-dinh/01.jpg",   // bỏ trống sẽ tự lấy ảnh đầu tiên bên trong
  children: [
    {
      id: "binh-dinh",
      title: "Bình Định",
      date: "2025-07",           // năm-tháng
      description: "Biển xanh, ghềnh đá.",
      photos: [
        { src: "images/albums/viet-nam/binh-dinh/01.jpg", caption: "Eo Gió" },
        "images/albums/viet-nam/binh-dinh/02.jpg",    // không cần chú thích thì ghi gọn thế này
      ],
      // muốn thêm tầng nữa (vd: Quy Nhơn) thì thêm children: [ ... ] ở đây
    },
  ],
},
```

Đường link sẽ có dạng `#/albums/viet-nam/binh-dinh`. Trang album hiện đường dẫn để quay lại tầng trên.
Album nằm trên cùng trong mảng sẽ hiện đầu tiên.

> Mẹo: nén ảnh xuống khoảng 2000px chiều dài, dưới 500KB mỗi ảnh để trang tải nhanh (dùng https://squoosh.app).

## Thêm một website đã code

Thêm vào mảng `PROJECTS`:

```js
{
  title: "Tên website",
  description: "Mô tả ngắn.",
  image: "images/projects/ten-website.png",   // ảnh chụp màn hình, để "" nếu chưa có
  tags: ["React", "Tailwind CSS"],            // dùng để lọc
  demo: "https://...",                        // link xem website
  source: "https://github.com/...",           // link mã nguồn
  year: 2026,
},
```

## Đưa lên mạng bằng Vercel

1. Đẩy code lên GitHub (`git push`).
2. Vào https://vercel.com/new, đăng nhập bằng GitHub, chọn repo `bngbtran` → **Import**.
3. **Framework Preset:** `Other`. Để trống Build Command và Output Directory (site tĩnh, không cần build) → **Deploy**.
4. Xem domain Vercel cấp ở **Settings → Domains** (vd: `bngbtran.vercel.app`). Thêm domain đó vào
   Firebase → **Authentication → Settings → Authorized domains**, nếu không sẽ không đăng nhập được trang admin.

Từ đó, mỗi lần `git push` lên nhánh `main`, Vercel sẽ tự deploy lại.
Trang quản trị nằm ở `https://<domain>/admin`.
