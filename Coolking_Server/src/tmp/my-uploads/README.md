# Data Import Module

Module này cung cấp chức năng import dữ liệu từ file CSV cho các bảng:
- Schedules (Lịch học)
- ScheduleExceptions (Ngoại lệ lịch học) 
- Scores (Điểm số)

## Cách sử dụng

### 1. Import Schedules
```
POST /api/dataimport/schedules
Content-Type: multipart/form-data
Files: files[] (CSV file)
```

### 2. Import Schedule Exceptions
```
POST /api/dataimport/schedule-exceptions
Content-Type: multipart/form-data
Files: files[] (CSV file)
```

### 3. Import Scores
```
POST /api/dataimport/scores
Content-Type: multipart/form-data
Files: files[] (CSV file)
```

### 4. Download Template
```
GET /api/dataimport/template/:type
Params: type = schedules | schedule-exceptions | scores
```

## Cấu trúc CSV

### Schedules Template
- **Required fields**: user_id, course_section_id, room, start_lesson, end_lesson, start_date, end_date
- **Optional fields**: id, isExam, day_of_week, date, isCompleted
- **Notes**: 
  - Nếu có id và record tồn tại → UPDATE
  - Nếu không có id hoặc record không tồn tại → INSERT
  - isExam, isCompleted: true/false hoặc 1/0
  - day_of_week: 1-7 (Chủ nhật = 1)

### Schedule Exceptions Template  
- **Required fields**: schedule_id, exception_type, original_date
- **Optional fields**: id, new_date, new_room, new_start_lesson, new_end_lesson, new_lecturer_id
- **Exception types**: CANCELED, MAKEUP, ROOM_CHANGED, LECTURER_CHANGED

### Scores Template
- **Required fields**: student_id, course_section_id
- **Optional fields**: id, theo_regular1, theo_regular2, theo_regular3, pra_regular1, pra_regular2, pra_regular3, mid, final, avr
- **Notes**: 
  - Nếu có id và record tồn tại → UPDATE
  - Nếu không có id nhưng có student_id + course_section_id tồn tại → UPDATE
  - Nếu hoàn toàn mới → INSERT
  - Điểm số là số thực (float)

## Response Format

```json
{
  "success": true,
  "message": "Import completed. Processed: 100, Inserted: 80, Updated: 20",
  "data": {
    "processed": 100,
    "inserted": 80, 
    "updated": 20,
    "errors": []
  }
}
```

## Error Handling

- Nếu có lỗi validation, các lỗi sẽ được trả về trong mảng `errors`
- Transaction được sử dụng để đảm bảo tính toàn vẹn dữ liệu
- File upload sẽ được xóa sau khi xử lý xong

## Installation

1. Cài đặt csv-parser:
```bash
npm install csv-parser
```

2. Thêm route vào main app:
```javascript
const dataImportRoutes = require('./routes/dataimport.route');
app.use('/api/dataimport', dataImportRoutes);
```

3. Tạo thư mục upload nếu chưa có:
```bash
mkdir -p /tmp/my-uploads
```