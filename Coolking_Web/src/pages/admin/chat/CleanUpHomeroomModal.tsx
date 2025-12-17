import React, { useState } from 'react';
import { useChat } from '../../../hooks/useChat';

interface CleanUpHomeroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CleanUpHomeroomModal: React.FC<CleanUpHomeroomModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { cleanupHomeroomChatsByClazzName, loading } = useChat();
  const [clazzName, setClazzName] = useState('');
  const [error, setError] = useState('');

  // Regex để validate chuỗi phải kết thúc bằng số
  const classNameRegex = /.*\d+$/;

  const validateClassName = (name: string): boolean => {
    return classNameRegex.test(name.trim());
  };

  const handleSubmit = async () => {
    const trimmedName = clazzName.trim();
    
    if (!trimmedName) {
      setError('Vui lòng nhập tên lớp');
      return;
    }

    if (!validateClassName(trimmedName)) {
      setError('Tên lớp phải kết thúc bằng số (ví dụ: DHXXXX17)');
      return;
    }

    setError('');

    try {
      const result = await cleanupHomeroomChatsByClazzName(trimmedName);
      
      if (result?.success) {
        onSuccess(result.message);
        handleClose();
      } else {
        setError(result?.message || 'Có lỗi xảy ra khi xóa nhóm chat chủ nhiệm');
      }
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi xóa nhóm chat chủ nhiệm');
    }
  };

  const handleClose = () => {
    setClazzName('');
    setError('');
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClazzName(value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const isValidInput = clazzName.trim() && validateClassName(clazzName.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Xóa nhóm chat chủ nhiệm
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Hướng dẫn:</strong> Hãy nhập tên lớp chung của khoa hoặc của chuyên ngành kèm theo số khóa.
          </p>
          <p className="text-sm text-blue-600 mt-1">
            <strong>Ví dụ:</strong> DHXXXX17
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label htmlFor="clazzName" className="block text-sm font-medium text-gray-700 mb-2">
            Tên lớp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="clazzName"
            value={clazzName}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Nhập tên lớp (ví dụ: DHCNTT17)"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none ${
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : clazzName.trim() && validateClassName(clazzName.trim())
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {clazzName.trim() && !validateClassName(clazzName.trim()) && (
            <p className="text-xs text-orange-600 mt-1">
              Tên lớp phải kết thúc bằng số
            </p>
          )}
          {clazzName.trim() && validateClassName(clazzName.trim()) && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Định dạng tên lớp hợp lệ
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Warning */}
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Cảnh báo</p>
              <p className="text-sm text-yellow-700 mt-1">
                Hành động này sẽ xóa vĩnh viễn tất cả nhóm chat chủ nhiệm của lớp được chỉ định. Không thể hoàn tác!
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValidInput}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Đang xóa...' : 'Tiến hành xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleanUpHomeroomModal;
