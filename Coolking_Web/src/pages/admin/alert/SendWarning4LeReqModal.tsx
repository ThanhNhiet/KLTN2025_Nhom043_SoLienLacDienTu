import React, { useState, useEffect } from 'react';
import { useAlert, type Alert } from '../../../hooks/useAlertAD';
import { useStudent } from '../../../hooks/useStudent';

interface SendWarning4LeReqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  alert: Alert | null;
}

const SendWarning4LeReqModal: React.FC<SendWarning4LeReqModalProps> = ({ isOpen, onClose, onSuccess, alert }) => {
  const { sendAlertPersonal } = useAlert();
  const { studentInfo, fetchStudentInfo, loading: studentLoading } = useStudent();

  const [formData, setFormData] = useState({ header: '', body: '' });
  const [receivers, setReceivers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Khi mở modal, xử lý header và gọi fetchStudentInfo
  useEffect(() => {
    if (isOpen && alert) {
      setServerError(null);
      setIsSubmitting(false);
      setReceivers([]);

      // Xử lý header
      const processedHeader = alert.header.split(' ').slice(2).join(' ');
      setFormData({
        header: processedHeader,
        body: alert.body
      });

      // Lấy student_id từ header
      const studentIdMatch = alert.header.match(/SV\d{7}/);
      const studentId = studentIdMatch ? studentIdMatch[0] : null;
      if (studentId) {
        fetchStudentInfo(studentId);
        setReceivers([studentId]); // Tạm thời chỉ gửi cho SV, sẽ cập nhật sau khi có parent
      } else {
        setServerError('Không thể trích xuất mã sinh viên từ tiêu đề.');
      }
    }
  }, [isOpen, alert, fetchStudentInfo]);

  // Khi studentInfo thay đổi, cập nhật receivers
  useEffect(() => {
    if (!isOpen || !alert) return;
    // Lấy student_id từ header
    const studentIdMatch = alert.header.match(/SV\d{7}/);
    const studentId = studentIdMatch ? studentIdMatch[0] : null;
    if (studentInfo && studentId) {
      if (studentInfo.parent && studentInfo.parent.parent_id) {
        setReceivers([studentId, studentInfo.parent.parent_id]);
      } else {
        setReceivers([studentId]);
        setServerError(`Không tìm thấy thông tin phụ huynh cho sinh viên ${studentId}.`);
      }
    }
  }, [studentInfo, isOpen, alert]);

  const validateForm = () => {
    return formData.header.trim() && formData.body.trim() && receivers.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      await sendAlertPersonal(formData.header, formData.body, receivers);
      onSuccess(`Đã gửi cảnh báo học vụ đến ${receivers.join(', ')} thành công!`);
      onClose();
    } catch (error: any) {
      console.error('Send warning alert error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi server không xác định';
      setServerError(`Lỗi gửi cảnh báo: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Gửi Cảnh Báo Học Vụ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="send-warning-form" onSubmit={handleSubmit} className="space-y-4">
            {studentLoading && (
              <div className="text-center text-blue-600">Đang tải thông tin sinh viên và phụ huynh...</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người nhận
              </label>
              <input
                type="text"
                value={receivers.join(', ')}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.header}
                onChange={(e) => setFormData(prev => ({ ...prev, header: e.target.value }))}
                placeholder="Nhập tiêu đề thông báo"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Nhập nội dung thông báo"
                rows={10}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {serverError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">{serverError}</p>
              </div>
            )}
          </form>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="send-warning-form"
            disabled={!validateForm() || isSubmitting || studentLoading}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || studentLoading ? 'Đang xử lý...' : 'Gửi Cảnh Báo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendWarning4LeReqModal;