import React, { useState, useEffect } from 'react';
import { useStatistics } from '../../../hooks/useStatistics';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';
import FacultyStatisticsChart from './FacultyStatisticsChart';
import LecturerStatisticsChart from './LecturerStatisticsChart';
import CourseSectionStatisticsChart from './CourseSectionStatisticsChart';

type StatisticsType = 'faculty' | 'lecturer' | 'course_section' | '';

const StatisticsMainPage: React.FC = () => {
  const {
    loading,
    error,
    sessions,
    faculties,
    fetchAllSessions,
    fetchAllFaculties,
    getFacultyStatistics,
    getLecturersStatistics,
    getCoursesSectionsStatistics
  } = useStatistics();

  const [statisticsType, setStatisticsType] = useState<StatisticsType>('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

  // Filtered options for dropdowns
  const filteredSessions = sessions.filter(session =>
    session.nameSession.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredFaculties = faculties.filter(faculty =>
    faculty.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
    faculty.faculty_id.toLowerCase().includes(facultySearch.toLowerCase())
  );

  // Check if all required fields are selected
  const canShowResults = statisticsType && selectedSession && selectedFaculty;

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
    if (sessions.length > 0 && !selectedSession) {
      const currentSessionId = getCurrentSessionId();
      setSelectedSession(currentSessionId);
    }
  }, [sessions, selectedSession]);

  useEffect(() => {
    fetchAllSessions();
    fetchAllFaculties();
  }, [fetchAllSessions, fetchAllFaculties]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside session dropdown
      if (!target.closest('.session-dropdown')) {
        setShowSessionDropdown(false);
      }

      // Check if click is outside faculty dropdown
      if (!target.closest('.faculty-dropdown')) {
        setShowFacultyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewResults = async () => {
    if (!canShowResults) return;

    setLoadingResults(true);
    try {
      let data;
      switch (statisticsType) {
        case 'faculty':
          data = await getFacultyStatistics(selectedFaculty, selectedSession);
          break;
        case 'lecturer':
          data = await getLecturersStatistics(selectedFaculty, selectedSession);
          break;
        case 'course_section':
          data = await getCoursesSectionsStatistics(selectedFaculty, selectedSession);
          break;
        default:
          return;
      }
      setStatisticsData(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
    setLoadingResults(false);
  };

  const handleReset = () => {
    setShowResults(false);
    setStatisticsData(null);
    setStatisticsType('');
    setSelectedSession('');
    setSelectedFaculty('');
    setSessionSearch('');
    setFacultySearch('');
    setShowSessionDropdown(false);
    setShowFacultyDropdown(false);
  };

  const renderResultsComponent = () => {
    if (!showResults || !statisticsData) return null;

    switch (statisticsType) {
      case 'faculty':
        return <FacultyStatisticsChart data={statisticsData} />;
      case 'lecturer':
        return <LecturerStatisticsChart data={statisticsData} sessionId={selectedSession} />;
      case 'course_section':
        return <CourseSectionStatisticsChart data={statisticsData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdCpn />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Thống kê</h1>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Statistics Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thống kê theo <span className="text-red-500">*</span>
                </label>
                <select
                  value={statisticsType}
                  onChange={(e) => {
                    const newType = e.target.value as StatisticsType;
                    setStatisticsType(newType);
                    // Reset results when changing statistics type
                    if (newType !== statisticsType) {
                      setShowResults(false);
                      setStatisticsData(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Chọn loại thống kê --</option>
                  <option value="faculty">Khoa</option>
                  <option value="lecturer">Giảng viên</option>
                  <option value="course_section">Lớp học phần</option>
                </select>
              </div>

              {/* Session Dropdown with Search */}
              <div className="session-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Học kỳ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm và chọn học kỳ..."
                    value={selectedSession ? sessions.find(s => s.id === selectedSession)?.nameSession || '' : sessionSearch}
                    onChange={(e) => {
                      setSessionSearch(e.target.value);
                      if (selectedSession && e.target.value !== sessions.find(s => s.id === selectedSession)?.nameSession) {
                        setSelectedSession('');
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
                              setSelectedSession(session.id);
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

              {/* Faculty Dropdown with Search */}
              <div className="faculty-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm và chọn khoa..."
                    value={selectedFaculty ? faculties.find(f => f.faculty_id === selectedFaculty)?.name || '' : facultySearch}
                    onChange={(e) => {
                      setFacultySearch(e.target.value);
                      if (selectedFaculty && e.target.value !== faculties.find(f => f.faculty_id === selectedFaculty)?.name) {
                        setSelectedFaculty('');
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
                              setSelectedFaculty(faculty.faculty_id);
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

              {/* Action Buttons */}
              <div className="flex items-end gap-3">
                <button
                  onClick={handleViewResults}
                  disabled={!canShowResults || loadingResults}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${canShowResults && !loadingResults
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {loadingResults ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải...
                    </div>
                  ) : (
                    'Xem kết quả'
                  )}
                </button>

                {showResults && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="p-6">
            {loading && !showResults && sessions.length === 0 && faculties.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Đang tải dữ liệu ban đầu...</span>
              </div>
            )}

            {error && !showResults && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lỗi: {error}
                </div>
              </div>
            )}

            {!showResults && !loading && !error && (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có kết quả thống kê</h3>
                <p className="text-gray-500">
                  Vui lòng chọn đầy đủ các tiêu chí và nhấn "Xem kết quả" để hiển thị thống kê
                </p>
              </div>
            )}

            {renderResultsComponent()}
          </div>
        </div>
      </main>

      <FooterAdCpn />
    </div>
  );
};

export default StatisticsMainPage;
