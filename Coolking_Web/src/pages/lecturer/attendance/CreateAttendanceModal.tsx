import React, { useState } from 'react';

interface CreateAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startLesson: number, endLesson: number) => void;
}

const CreateAttendanceModal: React.FC<CreateAttendanceModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [startLesson, setStartLesson] = useState<number>(1);
  const [endLesson, setEndLesson] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    // Validation
    if (startLesson < 1 || endLesson < 1) {
      setError('Tiết học phải lớn hơn 0');
      return;
    }
    
    if (startLesson > endLesson) {
      setError('Tiết học bắt đầu phải nhỏ hơn hoặc bằng tiết học kết thúc');
      return;
    }
    
    if (startLesson > 15 || endLesson > 15) {
      setError('Tiết học không được vượt quá 15');
      return;
    }
    
    setError('');
    onConfirm(startLesson, endLesson);
  };

  const handleClose = () => {
    setError('');
    setStartLesson(1);
    setEndLesson(1);
    onClose();
  };

  const isValid = startLesson >= 1 && endLesson >= 1 && startLesson <= endLesson && startLesson <= 15 && endLesson <= 15;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Tạo buổi điểm danh</h3>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiết học bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={startLesson}
                onChange={(e) => setStartLesson(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiết học kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={endLesson}
                onChange={(e) => setEndLesson(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            <strong>Lưu ý:</strong> Buổi điểm danh sẽ được tạo với ngày hôm nay. 
            Tiết học từ 1 đến 12, tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc.
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAttendanceModal;
