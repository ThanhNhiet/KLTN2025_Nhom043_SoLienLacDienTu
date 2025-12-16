import React, { useState, useEffect } from 'react';
import { useChat } from '../../../hooks/useChat';
import { useStatistics } from '../../../hooks/useStatistics';

interface BulkCreateGrChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const BulkCreateGrChatsModal: React.FC<BulkCreateGrChatsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { getNonChatCourseSectionsBySessionAndFaculty, bulkCreateGroupChats, loading } = useChat();
  const { fetchAllSessions, fetchAllFaculties, sessions, faculties, loading: optionsLoading } = useStatistics();
  
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'select' | 'info' | 'create'>('select');
  
  // Data from getNonChatCourseSectionsBySessionAndFaculty
  const [courseData, setCourseData] = useState<{
    totalCount: number;
    courseSections: Array<{
      subjectName: string;
      className: string;
      course_section_id: string;
      start_lesson: number;
      end_lesson: number;
    }>;
    sessionInfo: string;
  } | null>(null);

  const filteredSessions = sessions.filter(session =>
    session.nameSession.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredFaculties = faculties.filter(faculty =>
    faculty.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
    faculty.faculty_id.toLowerCase().includes(facultySearch.toLowerCase())
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

  useEffect(() => {
    if (isOpen) {
      fetchAllSessions();
      fetchAllFaculties();
    }
  }, [isOpen, fetchAllSessions, fetchAllFaculties]);

  // Set current session as default when sessions are loaded
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const currentSessionId = getCurrentSessionId();
      setSelectedSessionId(currentSessionId);
    }
  }, [sessions, selectedSessionId]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('.session-dropdown')) {
        setShowSessionDropdown(false);
      }
      
      if (!target.closest('.faculty-dropdown')) {
        setShowFacultyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetInfo = async () => {
    if (!selectedSessionId || !selectedFacultyId) {
      setError('Vui lòng chọn đầy đủ học kỳ và khoa');
      return;
    }

    setError('');

    try {
      const result = await getNonChatCourseSectionsBySessionAndFaculty(selectedSessionId, selectedFacultyId);
      
      if (result?.success) {
        setCourseData(result);
        setStep('info');
      } else {
        setError(result?.message || 'Không thể lấy thông tin lớp học phần');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi lấy thông tin');
    }
  };

  const handleBulkCreate = async () => {
    if (!courseData) {
      setError('Không có dữ liệu để tạo nhóm chat');
      return;
    }

    setError('');
    setStep('create');

    try {
      const result = await bulkCreateGroupChats(courseData.courseSections, courseData.sessionInfo);
      
      if (result?.success) {
        onSuccess(result.message);
        handleClose();
      } else {
        setError(result?.message || 'Có lỗi xảy ra khi tạo nhóm chat');
        setStep('info');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi tạo nhóm chat hàng loạt');
      setStep('info');
    }
  };

  const handleClose = () => {
    setSelectedSessionId('');
    setSelectedFacultyId('');
    setSessionSearch('');
    setFacultySearch('');
    setShowSessionDropdown(false);
    setShowFacultyDropdown(false);
    setError('');
    setStep('select');
    setCourseData(null);
    onClose();
  };

//   const getSelectedSessionName = () => {
//     const session = sessions.find(s => s.id === selectedSessionId);
//     return session?.nameSession || '';
//   };

  const getSelectedFacultyName = () => {
    const faculty = faculties.find(f => f.faculty_id === selectedFacultyId);
    return faculty?.name || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[100vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Tạo nhóm chat hàng loạt
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

        {step === 'select' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Session Selection */}
              <div className="session-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Học kỳ <span className="text-red-500">*</span>
                </label>
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
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              setSessionSearch('');
                              setShowSessionDropdown(false);
                            }}
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
              </div>

              {/* Faculty Selection */}
              <div className="faculty-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm và chọn khoa..."
                    value={selectedFacultyId ? faculties.find(f => f.faculty_id === selectedFacultyId)?.name || '' : facultySearch}
                    onChange={(e) => {
                      setFacultySearch(e.target.value);
                      if (selectedFacultyId && e.target.value !== faculties.find(f => f.faculty_id === selectedFacultyId)?.name) {
                        setSelectedFacultyId('');
                      }
                    }}
                    onFocus={() => setShowFacultyDropdown(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {showFacultyDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredFaculties.length > 0 ? (
                        filteredFaculties.map((faculty) => (
                          <div
                            key={faculty.faculty_id}
                            onClick={() => {
                              setSelectedFacultyId(faculty.faculty_id);
                              setFacultySearch('');
                              setShowFacultyDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{faculty.faculty_id}</div>
                            <div className="text-sm text-gray-600">{faculty.name}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-center">
                          Không tìm thấy khoa nào
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {optionsLoading && (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500">Đang tải dữ liệu...</span>
              </div>
            )}

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
                onClick={handleGetInfo}
                disabled={!selectedSessionId || !selectedFacultyId || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <span>Lấy thông tin</span>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'info' && courseData && (
          <div className="space-y-4">
            {/* Summary Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Thông tin lớp học phần</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p><strong>Học kỳ:</strong> {courseData.sessionInfo}</p>
                    <p><strong>Khoa:</strong> {getSelectedFacultyName()}</p>
                    <p><strong>Số lớp học phần chưa có nhóm chat:</strong> {courseData.totalCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Sections List
            {courseData.totalCount > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900">Danh sách lớp học phần</h5>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {courseData.courseSections.map((courseSection, index) => (
                    <div key={courseSection.course_section_id} className={`px-4 py-3 ${index !== courseData.courseSections.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{courseSection.subjectName}</p>
                          <p className="text-sm text-gray-600">Lớp: {courseSection.className}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Tiết {courseSection.start_lesson}-{courseSection.end_lesson}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {courseData.totalCount === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lớp học phần nào</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tất cả lớp học phần trong khoa này đã có nhóm chat hoặc đã hoàn thành.
                </p>
              </div>
            )}

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
                onClick={() => setStep('select')}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              >
                Quay lại
              </button>
              
              {courseData.totalCount > 0 && (
                <button
                  onClick={handleBulkCreate}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                >
                  Tạo hàng loạt ({courseData.totalCount} nhóm chat)
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Đang tạo nhóm chat...</h3>
              <p className="mt-2 text-sm text-gray-500">
                Vui lòng chờ trong giây lát, hệ thống đang xử lý yêu cầu của bạn.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkCreateGrChatsModal;
