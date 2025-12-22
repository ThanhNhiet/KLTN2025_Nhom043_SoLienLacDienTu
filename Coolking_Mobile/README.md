# CoolKing E-Contact - Ứng dụng Di động

🎓 **Hệ thống quản lý liên lạc giáo dục thông minh**

## 📱 Giới thiệu

CoolKing E-Contact là ứng dụng di động được phát triển để kết nối giữa nhà trường, giảng viên, học sinh và phụ huynh. Ứng dụng cung cấp các tính năng quản lý giáo dục hiện đại, giúp việc theo dõi học tập và giao tiếp trở nên dễ dàng và hiệu quả hơn.

## ✨ Tính năng chính

### 👨‍🎓 Dành cho Học sinh
- **📊 Xem điểm số**: Theo dõi kết quả học tập theo thời gian thực
- **📅 Lịch học**: Xem thời khóa biểu và lịch thi
- **✅ Điểm danh**: Kiểm tra tình trạng attendance
- **💬 Trò chuyện**: Giao tiếp với giảng viên và bạn học
- **👤 Quản lý hồ sơ**: Cập nhật thông tin cá nhân

### 👨‍🏫 Dành cho Giảng viên
- **📝 Quản lý điểm số**: Nhập và chỉnh sửa điểm
- **📋 Điểm danh học sinh**: Ghi nhận attendance
- **📱 Gửi thông báo**: Thông tin quan trọng đến học sinh/phụ huynh
- **💬 Chat**: Trao đổi với học sinh và phụ huynh

### 👨‍👩‍👧‍👦 Dành cho Phụ huynh
- **📈 Theo dõi con em**: Xem điểm số và attendance
- **📞 Liên hệ nhà trường**: Trò chuyện với giảng viên
- **🔔 Nhận thông báo**: Cập nhật tình hình học tập

## 🛠️ Công nghệ sử dụng

- **Frontend**: React Native + Expo
- **Navigation**: React Navigation
- **State Management**: Context API
- **HTTP Client**: Axios
- **UI Components**: Expo Vector Icons
- **Storage**: AsyncStorage, Expo SecureStore
- **Notifications**: Expo Notifications
- **Media**: Expo Image Picker, Document Picker

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **Expo CLI**: Latest version
- **Mobile OS**: 
  - Android: >= API 21 (Android 5.0)
  - iOS: >= iOS 12.0

## 🚀 Cài đặt và Chạy ứng dụng

### 1. Clone repository
```bash
git clone <repository-url>
cd E-Contact-Book-CoolKing/Coolking_Mobile
```

### 2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### 3. Chạy ứng dụng

#### Development mode
```bash
npm start
# hoặc
expo start
```

#### Chạy trên Android
```bash
npm run android
# hoặc
expo start --android
```

#### Chạy trên iOS
```bash
npm run ios
# hoặc
expo start --ios
```

#### Chạy trên Web
```bash
npm run web
# hoặc
expo start --web
```

## 📁 Cấu trúc thư mục

```
src/
├── assets/          # Hình ảnh, fonts và tài nguyên tĩnh
├── components/      # Các component tái sử dụng
│   ├── modals/     # Modal components
│   └── navigations/ # Navigation components
├── configs/         # Cấu hình ứng dụng
├── router/          # Cấu hình routing
├── screens/         # Các màn hình chính
│   ├── attendance/  # Màn hình điểm danh
│   ├── calendar/    # Màn hình lịch
│   ├── chat/        # Màn hình trò chuyện
│   ├── home/        # Màn hình chính
│   ├── login/       # Màn hình đăng nhập
│   ├── profile/     # Màn hình hồ sơ
│   └── score/       # Màn hình điểm số
├── services/        # API và services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🔧 Cấu hình

### 1. Environment Variables
Tạo file `.env` trong thư mục gốc:
```env
API_BASE_URL=your_server_url
FIREBASE_CONFIG=your_firebase_config
```

### 2. Firebase Setup
- Thêm file `google-services.json` cho Android
- Cấu hình Firebase trong `src/configs/`

## 🚀 Build Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### Sử dụng EAS Build (Khuyến nghị)
```bash
eas build --platform android
eas build --platform ios
```

## 📱 Demo và Screenshots

*(Thêm screenshots và video demo ở đây)*

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 🐛 Báo lỗi

Nếu bạn phát hiện lỗi, vui lòng tạo issue mới với các thông tin:
- Mô tả lỗi chi tiết
- Các bước tái tạo lỗi
- Screenshots (nếu có)
- Thông tin thiết bị và phiên bản OS

## 📞 Liên hệ

- **Email**: support@coolking.edu.vn
- **Website**: https://coolking.edu.vn
- **Hotline**: 1900-xxxx

## 📄 Giấy phép

Dự án này được phát triển cho mục đích giáo dục. Vui lòng không sử dụng cho mục đích thương mại mà không có sự cho phép.

---

**Phát triển bởi**: Đội ngũ CoolKing Development Team  
**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: December 2025
