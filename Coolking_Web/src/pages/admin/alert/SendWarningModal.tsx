import React, { useState, useEffect } from 'react';
import { useAlert } from '../../../hooks/useAlert';

interface StudentWarningData {
  course_section_id: string;
  subjectName: string;
  student_id: string;
  studentName: string;
  parent_id?: string;
  mid?: number | null;
  final?: number | null;
  avr?: number | null;
  // Add other scores if needed for display
}

interface SendWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentData: StudentWarningData;
}

const SendWarningModal: React.FC<SendWarningModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentData
}) => {
  const defaultTitle = `Cảnh báo học vụ - Sinh viên ${studentData.student_id} - LHP: ${studentData.course_section_id} - Môn: ${studentData.subjectName}`;
  const defaultContent = `Thông báo đến sinh viên ${studentData.studentName} (MSSV: ${studentData.student_id}) và Quý Phụ huynh.

Trong môn học ${studentData.subjectName} (mã lớp học phần: ${studentData.course_section_id}), tôi nhận thấy rằng:

Kết quả học tập vừa qua của em đang ở mức dưới trung bình. Đây là kết quả rất đáng lo ngại và có ảnh hưởng lớn đến điểm tổng kết của môn học. Kết quả này cho thấy em đang bị hổng kiến thức nghiêm trọng và có nguy cơ rất cao sẽ không đạt môn học này.

Đề nghị sinh viên nghiêm túc xem lại và củng cố lại toàn bộ kiến thức đã học và bài kiểm tra vừa rồi. Lên kế hoạch học tập chi tiết cho phần còn lại của học kỳ.

Nhà trường và giảng viên luôn tạo điều kiện hỗ trợ, nhưng sự nỗ lực từ chính bản thân em mới là yếu tố quyết định.

Trân trọng.`;

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
  const { loading, sendAlertPersonal } = useAlert(); // This is from useAlertAD, not useAlert

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen && studentData) {
      setTitle(`Cảnh báo học vụ - Sinh viên ${studentData.student_id} - LHP: ${studentData.course_section_id} - Môn: ${studentData.subjectName}`);
      setContent(`Thông báo đến sinh viên ${studentData.studentName} (MSSV: ${studentData.student_id}) và Quý Phụ huynh.

Trong môn học ${studentData.subjectName} (mã lớp học phần: ${studentData.course_section_id}), tôi nhận thấy rằng:

Kết quả học tập vừa qua của em đang ở mức dưới trung bình. Đây là kết quả rất đáng lo ngại và có ảnh hưởng lớn đến điểm tổng kết của môn học. Kết quả này cho thấy em đang bị hổng kiến thức nghiêm trọng và có nguy cơ rất cao sẽ không đạt môn học này.

Đề nghị sinh viên nghiêm túc xem lại và củng cố lại toàn bộ kiến thức đã học và bài kiểm tra vừa rồi. Lên kế hoạch học tập chi tiết cho phần còn lại của học kỳ.

Nhà trường và giảng viên luôn tạo điều kiện hỗ trợ, nhưng sự nỗ lực từ chính bản thân em mới là yếu tố quyết định.

Trân trọng.`);
    }
  }, [isOpen, studentData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSend = async () => {
    try {
      const receiverIDs = [studentData.student_id];
      if (studentData.parent_id) {
        receiverIDs.push(studentData.parent_id);
      }

      const response = await sendAlertPersonal(title, content, receiverIDs);
      if (response.success) {
        showToast(`Gửi cảnh báo đến ${receiverIDs.join(', ')} thành công!`, 'success');
        setTimeout(() => { onClose(); }, 1500);
        onSuccess();
      } else {
        showToast(response.error || 'Có lỗi xảy ra khi gửi yêu cầu', 'error');
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi gửi yêu cầu', 'error');
    }
  };

  const formatScore = (score: number | null | undefined) => {
    return score !== null && score !== undefined ? score.toFixed(1) : '-';
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
            <h2 className="text-xl font-semibold text-gray-900">Gửi cảnh báo học vụ</h2>
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
                <div><span className="font-medium">Họ tên:</span> {studentData.studentName}</div>
                <div><span className="font-medium">MSSV:</span> {studentData.student_id}</div>
                <div><span className="font-medium">Môn học:</span> {studentData.subjectName}</div>
                <div><span className="font-medium">LHP:</span> {studentData.course_section_id}</div>
              </div>
              <h3 className="font-semibold text-red-800 mt-4 mb-2">Điểm số đáng chú ý</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div><span className="font-medium">Điểm giữa kỳ:</span> {formatScore(studentData.mid)}</div>
                <div><span className="font-medium">Điểm cuối kỳ:</span> {formatScore(studentData.final)}</div>
                <div><span className="font-medium">Điểm trung bình:</span> {formatScore(studentData.avr)}</div>
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
          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
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
              {loading ? 'Đang gửi...' : 'Gửi cảnh báo'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SendWarningModal;