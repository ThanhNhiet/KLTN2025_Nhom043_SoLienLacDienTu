import React, { useState, useEffect } from 'react';
import { useChat } from '../../../hooks/useChat';
import { useStatistics } from '../../../hooks/useStatistics';

interface CleanUpGrchatOfCSCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CleanUpGrchatOfCSCompleteModal: React.FC<CleanUpGrchatOfCSCompleteModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { cleanupGroupChatsOfCompletedCourseSections, loading } = useChat();
  const { fetchAllSessions, sessions, loading: sessionsLoading } = useStatistics();
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  const filteredSessions = sessions.filter(session =>
    session.nameSession.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  // Get current session based on current date
  const getCurrentSessionId = (): string => {
    if (sessions.length === 0) return '';

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = today.getFullYear();

    let targetSessionName = '';

    // Determine which semester based on current date
    if (currentMonth >= 8 && currentMonth <= 12) {
      // August to December: HK1 of current academic year
      targetSessionName = `HK1 ${currentYear}-${currentYear + 1}`;
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // January to May: HK2 of previous academic year
      targetSessionName = `HK2 ${currentYear - 1}-${currentYear}`;
    } else if (currentMonth === 6 || currentMonth === 7) {
      // June to July: HK3 of previous academic year
      targetSessionName = `HK3 ${currentYear - 1}-${currentYear}`;
    }

    // Find session that matches the target session name
    const currentSession = sessions.find(session =>
      session.nameSession === targetSessionName
    );

    return currentSession ? currentSession.id : (sessions[0]?.id || '');
  };

  // Set current session as default when sessions are loaded
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const currentSessionId = getCurrentSessionId();
      setSelectedSessionId(currentSessionId);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (isOpen) {
      fetchAllSessions();
    }
  }, [isOpen, fetchAllSessions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.session-dropdown')) {
        setShowSessionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSessionSearch('');
    setShowSessionDropdown(false);
    setShowConfirmStep(false);
    setConfirmText('');
    setError('');
  };

  const handleProceedToConfirm = () => {
    if (!selectedSessionId) {
      setError('Vui lòng chọn học kỳ');
      return;
    }
    setShowConfirmStep(true);
    setError('');
  };

  const handleCleanup = async () => {
    if (confirmText.toLowerCase() !== 'clean') {
      setError('Vui lòng nhập "clean" để xác nhận');
      return;
    }

    setError('');

    try {
      const result = await cleanupGroupChatsOfCompletedCourseSections(selectedSessionId);

      if (result?.success) {
        onSuccess(result.message);
        handleClose();
      } else {
        setError(result?.message || 'Có lỗi xảy ra khi dọn dẹp');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi dọn dẹp nhóm chat');
    }
  };

  const handleClose = () => {
    setSelectedSessionId('');
    setSessionSearch('');
    setShowSessionDropdown(false);
    setConfirmText('');
    setError('');
    setShowConfirmStep(false);
    onClose();
  };

  const getSelectedSessionName = () => {
    const session = sessions.find(s => s.id === selectedSessionId);
    return session?.nameSession || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Dọn dẹp nhóm chat đã hoàn thành
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showConfirmStep ? (
          <div className="space-y-4">
            {/* Session Selection */}
            <div className="session-dropdown">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Học kỳ <span className="text-red-500">*</span>
              </label>

              {sessionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-500">Đang tải học kỳ...</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm và chọn học kỳ..."
                    value={selectedSessionId ? sessions.find(s => s.id === selectedSessionId)?.nameSession || '' : sessionSearch}
                    onChange={(e) => {
                      setSessionSearch(e.target.value);
                      if (selectedSessionId && e.target.value !== sessions.find(s => s.id === selectedSessionId)?.nameSession) {
                        setSelectedSessionId('');
                      }
                    }}
                    onFocus={() => setShowSessionDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {showSessionDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSessions.length > 0 ? (
                        filteredSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => handleSessionSelect(session.id)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {session.nameSession}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-center">
                          Không tìm thấy học kỳ nào
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Cảnh báo</h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Thao tác này sẽ xóa vĩnh viễn tất cả các nhóm chat có lớp học phần đã hoàn thành trong học kỳ được chọn.</p>
                    <p className="mt-1 font-medium">Hành động này không thể hoàn tác!</p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                Hủy
              </button>

              <button
                onClick={handleProceedToConfirm}
                disabled={!selectedSessionId}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiến hành xóa
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Confirmation Step */}
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">Xác nhận xóa</h4>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Hành động này sẽ xóa tất cả các nhóm chat có LHP đã hoàn thành của học kỳ <strong>{getSelectedSessionName()}</strong> mà bạn đã chọn.</p>
                    <p className="mt-2">Nhập <strong>"clean"</strong> để xác nhận:</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Nhập 'clean' để xác nhận"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowConfirmStep(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                Quay lại
              </button>

              <button
                onClick={handleCleanup}
                disabled={loading || confirmText.toLowerCase() !== 'clean'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanUpGrchatOfCSCompleteModal;
