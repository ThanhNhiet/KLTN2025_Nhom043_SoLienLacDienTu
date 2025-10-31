# Coolking Web - E-Contact Book

Hệ thống Sổ Liên Lạc Điện Tử (E-Contact Book) - Coolking Web

## Mục tiêu
- Quản lý thông báo, cảnh báo học vụ, điểm số, lịch học, trao đổi giữa nhà trường, giáo viên, phụ huynh và sinh viên.
- Hỗ trợ quản trị viên gửi cảnh báo học vụ, quản lý sinh viên cần cảnh cáo, tìm kiếm, lọc, gửi thông báo cá nhân và toàn trường.

## Công nghệ sử dụng
- React + TypeScript
- TailwindCSS
- React Router
- Axios

## Cấu trúc thư mục
- `src/pages/` - Chứa các trang, modal của trang
- `src/components/` - Các component dùng chung
- `src/hooks/` - Custom hooks cho API, logic dữ liệu
- `src/services/` - Giao tiếp API backend
- `src/configs/` - Cấu hình axios, biến môi trường, kết nối socket
- `src/routes/` - Chứa các url để navigate giữa các trang
- `src/assets/` - Chứa các tài nguyên tĩnh

## Hướng dẫn chạy dự án
1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Chạy ứng dụng:
   ```bash
   npm run dev
   ```
3. Cấu hình backend, database theo hướng dẫn trong thư mục `Coolking_Server`
