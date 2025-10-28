import React, { useState } from 'react';
import { useAlert } from '../../../hooks/useAlertAD';

interface SendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const SendFormModal: React.FC<SendFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { sendAlertToAll } = useAlert();
  
  const [formData, setFormData] = useState({
    header: '',
    body: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      header: '',
      body: ''
    });
    setServerError(null);
  };

  const validateForm = () => {
    return formData.header.trim() && formData.body.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);
    
    try {
      await sendAlertToAll(formData.header, formData.body);
      onSuccess('Đã gửi thông báo hệ thống thành công!');
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Send alert error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi server không xác định';
      setServerError(`Lỗi gửi thông báo: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Tạo thông báo hệ thống</h2>
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
          <form id="send-alert-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Header/Title */}
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

            {/* Body/Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Nhập nội dung thông báo"
                rows={6}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Server Error Display */}
            {serverError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">{serverError}</p>
              </div>
            )}
          </form>
        </div>

        {/* Action Buttons */}
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
            form="send-alert-form"
            disabled={!validateForm() || isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendFormModal;
