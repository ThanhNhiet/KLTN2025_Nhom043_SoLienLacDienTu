# E-Contact-Book-CoolKing Server

Đây là server backend cho dự án Sổ liên lạc điện tử (E-Contact Book). Server được xây dựng bằng Node.js, Express và kết nối với database MariaDB thông qua Sequelize và MongoDB thông qua Mongoose.

## Yêu cầu hệ thống 📋

Để có thể chạy được dự án, bạn cần cài đặt các phần mềm sau:

- Node.js (phiên bản 18.x trở lên)
- NPM (thường đi kèm với Node.js) hoặc Yarn
- MariaDB (hoặc MySQL)

## Hướng dẫn cài đặt 🚀

Thực hiện các bước sau để cài đặt và khởi chạy server.

### 1. Tải mã nguồn

Clone repository này về máy của bạn:

```bash
git clone https://github.com/ThanhNhiet/KLTN2025_Nhom043_SoLienLacDienTu.git
```

Di chuyển vào thư mục của server:

```bash
cd KLTN2025_Nhom043_SoLienLacDienTu/Coolking_Server
```

### 2. Cài đặt dependencies

Cài đặt tất cả các thư viện cần thiết đã được định nghĩa trong file package.json:

```bash
npm install
```

### 3. Cấu hình môi trường

Server sử dụng file .env để quản lý các biến môi trường. Hãy tạo một file mới tên là .env ở thư mục gốc của server (Coolking_Server) bằng cách sao chép từ file .env.example

### 4. Khởi tạo Database

Hãy tạo trước một database rỗng trong phần mềm quản trị cơ sở dữ liệu. Theo .env.example sẽ là econtact.

## Khởi chạy Server ▶️

Sau khi đã hoàn tất các bước cài đặt, bạn có thể khởi chạy server với các lệnh sau:

```bash
npm start
```

Hoặc

```bash
npm run start
```

Sau khi chạy thành công, server sẽ lắng nghe tại địa chỉ http://localhost:3000 (có thể thay đổi địa chỉ PORT ở file server.js)