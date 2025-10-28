import React, { useState } from 'react';
import { useChat } from '../../../hooks/useChat';

interface CleanUpChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CleanUpChatModal: React.FC<CleanUpChatModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { cleanupInactiveChats, loading } = useChat();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmText.toLowerCase() !== 'clean') {
      setError('Vui lòng nhập chính xác từ "clean" để xác nhận.');
      return;
    }

    try {
      setError('');
      const result = await cleanupInactiveChats();
      
      if (result && result.success) {
        onSuccess(result.message);
        onClose();
        setConfirmText('');
      } else {
        setError('Có lỗi xảy ra khi xóa chat.');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi xóa chat.');
      console.error('Error cleaning up chats:', error);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dọn dẹp chat riêng không hoạt động
        </h3>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Hành động này sẽ xóa nhiều đoạn chat và không thể hoàn tác.
          </p>
          <p className="text-sm text-red-600 mb-4">
            Nhập "clean" và chọn Xóa để tiếp tục.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Nhập 'clean' để xác nhận"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || confirmText.toLowerCase() !== 'clean'}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{loading ? 'Đang xóa...' : 'Xóa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleanUpChatModal;
