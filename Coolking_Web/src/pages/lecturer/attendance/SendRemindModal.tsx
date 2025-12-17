import React, { useState } from 'react';
import type { AttendanceData, StudentRaw } from '../../../hooks/useAttendance';
import { useAlert } from '../../../hooks/useAlert';

interface SendWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentRaw: StudentRaw;
  attendanceData: AttendanceData;
  studentInfo: any; // Thông tin chi tiết sinh viên bao gồm phụ huynh
}

const SendWarningModal: React.FC<SendWarningModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentRaw,
  attendanceData,
  studentInfo
}) => {

  const remindAtCredit = () => {
    if(studentRaw.remindAtCredit === 'theo') return 'Lý thuyết';
    if(studentRaw.remindAtCredit === 'pra') return 'Thực hành';
  };

  const defaultTitle = `Nhắc nhở chuyên cần - Sinh viên ${studentRaw.student_id} - LHP: ${attendanceData.course_section_id} - Môn: ${attendanceData.subjectName}`;
  const defaultContent = `Thông báo đến sinh viên ${studentRaw.name} (MSSV: ${studentRaw.student_id}) và Quý Phụ huynh.

Trong môn học ${attendanceData.subjectName} (mã lớp học phần: ${attendanceData.course_section_id}), thuộc lớp ${attendanceData.className}, học kỳ ${attendanceData.sessionName}, tôi nhận thấy rằng:

Thống kê đến thời điểm hiện tại, sinh viên đã vắng không phép ${studentRaw.absentTheo} buổi lý thuyết và vắng ${studentRaw.absentPra} buổi thực hành. Điều này có nghĩa là nếu sinh viên vắng 20% số tiết thuộc tín chỉ ${remindAtCredit()}, nếu vắng vượt quá 20% sẽ có nguy cơ bị cấm thi.
Đề nghị sinh viên nghiêm túc đi học đầy đủ . Nếu có lý do chính đáng cho việc vắng mặt, xin vui lòng liên hệ với giảng viên bộ môn để được hỗ trợ.

Quý Phụ huynh vui lòng phối hợp cùng nhà trường để nhắc nhở và hỗ trợ sinh viên trong việc học tập, nhằm đảm bảo kết quả học tập tốt nhất.

Trân trọng.
Giảng viên phụ trách môn học: ${attendanceData.lecturerName}
Email: ${attendanceData.lecturerEmail}
Số điện thoại: ${attendanceData.lecturerPhone}`;

  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const { loading, sendAlertPersonal } = useAlert();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSend = async () => {
    try {
      if (!studentInfo) {
        showToast('Không có thông tin sinh viên', 'error');
        return;
      }

      // Tạo danh sách người nhận: sinh viên + phụ huynh
      const receiverIDs: string[] = [];

      // Thêm sinh viên
      if (studentRaw.student_id) {
        receiverIDs.push(studentRaw.student_id);
      }

      // Thêm phụ huynh từ studentInfo (single parent object)
      if (studentInfo.parent && studentInfo.parent.parent_id) {
        receiverIDs.push(studentInfo.parent.parent_id);
      }

      //Thêm giảng viên chủ nhiệm từ studentInfo
      if (studentInfo.homeroomLeId) {
        receiverIDs.push(studentInfo.homeroomLeId);
      }

      if (receiverIDs.length === 0) {
        showToast('Không tìm thấy người nhận hợp lệ', 'error');
        return;
      }

      const response = await sendAlertPersonal(title, content, receiverIDs);
      if (response.success) {
        showToast('Gửi yêu cầu cảnh báo thành công!', 'success');
        // Delay closing modal to show success toast
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 500); // Wait 1 second before closing
      } else {
        showToast(response.error || 'Có lỗi xảy ra khi gửi yêu cầu', 'error');
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi gửi yêu cầu', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg transform transition-all duration-300 ${toast.type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
          }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Gửi nhắc nhở chuyên cần</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Student Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Thông tin sinh viên</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Họ tên:</span> {studentRaw.name}</div>
                <div><span className="font-medium">MSSV:</span> {studentRaw.student_id}</div>
                <div><span className="font-medium">Ngày sinh:</span> {studentRaw.dob}</div>
              </div>
            </div>

            {/* Receivers Info */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người nhận
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Sinh viên:</span> {studentRaw.name} ({studentRaw.student_id})
                  </div>
                  {studentInfo?.parent && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Phụ huynh:</span> {studentInfo.parent.name || 'N/A'} ({studentInfo.parent.parent_id || 'N/A'})
                    </div>
                  )}
                  {!studentInfo?.parent && (
                    <div className="text-sm text-gray-500">
                      Không có thông tin phụ huynh
                    </div>
                  )}
                  {studentInfo?.homeroomTeacherName && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Giảng viên chủ nhiệm:</span> {studentInfo.homeroomTeacherName} ({studentInfo.homeroomLeId})
                    </div>
                  )}
                  {!studentInfo?.homeroomTeacherName && (
                    <div className="text-sm text-gray-500">
                      Không có thông tin giảng viên chủ nhiệm
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Title Input */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Nhập tiêu đề cảnh báo"
                disabled={loading}
                readOnly
              />
            </div>

            {/* Content Textarea */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                rows={15}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Nhập nội dung cảnh báo"
                disabled={loading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 p-2 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={loading}
              // Bạn cũng nên thêm 'flex items-center justify-center' vào nút Hủy để chữ nằm giữa nút chuẩn hơn
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              Hủy
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SendWarningModal;