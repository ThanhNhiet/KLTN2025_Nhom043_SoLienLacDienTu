import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseSection } from '../../../hooks/useCourseSection';
import { useStatistics } from '../../../hooks/useStatistics';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';

const ClazzListPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        courseSections,
        loading,
        error,
        page,
        pageSize,
        pages,
        totalPages,
        linkPrev,
        linkNext,
        fetchCourseSectionsByLecturer,
        searchCourseSectionsByKeyword,
        filterCourseSectionsByLecturer
    } = useCourseSection();

    const {
        sessions,
        faculties,
        fetchAllSessions,
        fetchAllFaculties
    } = useStatistics();

    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [sessionSearch, setSessionSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');
    const [showSessionDropdown, setShowSessionDropdown] = useState(false);
    const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

    // Filtered options for dropdowns
    const filteredSessions = sessions.filter(session =>
        session.nameSession.toLowerCase().includes(sessionSearch.toLowerCase())
    );

    const filteredFaculties = faculties.filter(faculty =>
        faculty.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        faculty.faculty_id.toLowerCase().includes(facultySearch.toLowerCase())
    );

    useEffect(() => {
        fetchCourseSectionsByLecturer(1, 10);
        fetchAllSessions();
        fetchAllFaculties();
    }, [fetchCourseSectionsByLecturer, fetchAllSessions, fetchAllFaculties]);

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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);    const handleSearch = async () => {
        if (searchKeyword.trim()) {
            await searchCourseSectionsByKeyword(searchKeyword, 1, pageSize);
        } else {
            fetchCourseSectionsByLecturer(1, pageSize);
        }
    };

    const handleFilter = async () => {
        if (selectedSession && selectedFaculty) {
            await filterCourseSectionsByLecturer(selectedSession, selectedFaculty, 1, pageSize);
        }
    };

    const handleReset = () => {
        setSearchKeyword('');
        setSelectedSession('');
        setSelectedFaculty('');
        setSessionSearch('');
        setFacultySearch('');
        setShowSessionDropdown(false);
        setShowFacultyDropdown(false);
        fetchCourseSectionsByLecturer(1, pageSize);
    };

    const handlePageChange = (newPage: number) => {
        if (searchKeyword.trim()) {
            searchCourseSectionsByKeyword(searchKeyword, newPage, pageSize);
        } else if (selectedSession && selectedFaculty) {
            filterCourseSectionsByLecturer(selectedSession, selectedFaculty, newPage, pageSize);
        } else {
            fetchCourseSectionsByLecturer(newPage, pageSize);
        }
    };

    const handleActionClick = (courseSectionId: string) => {
        setShowActionMenu(showActionMenu === courseSectionId ? null : courseSectionId);
    };

    const handleViewStudents = (courseSectionId: string) => {
        navigate(`/lecturer/clazz/students/${courseSectionId}`);
        setShowActionMenu(null);
    };

    const handleViewAttendance = (courseSectionId: string) => {
        console.log('Navigating to attendance for course section:', courseSectionId);
        navigate(`/lecturer/clazz/students-attendance/${courseSectionId}`);
        setShowActionMenu(null);
    };

    const getSessionName = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        return session ? session.nameSession : sessionId;
    };

    const getFacultyName = (facultyId: string) => {
        const faculty = faculties.find(f => f.faculty_id === facultyId);
        return faculty ? faculty.name : facultyId;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderLeCpn />

            <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
                <div className="bg-white rounded-lg shadow-sm border">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Lớp học phần</h1>

                        {/* Search and Filter Controls */}
                        <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="flex items-center gap-3 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo từ khóa..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Filter Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Session Dropdown */}
                                <div className="relative session-dropdown">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Học kỳ
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm và chọn học kỳ..."
                                            value={selectedSession ? getSessionName(selectedSession) : sessionSearch}
                                            onChange={(e) => {
                                                setSessionSearch(e.target.value);
                                                if (selectedSession && e.target.value !== getSessionName(selectedSession)) {
                                                    setSelectedSession('');
                                                }
                                            }}
                                            onFocus={() => setShowSessionDropdown(true)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        {showSessionDropdown && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredSessions.length > 0 ? (
                                                    filteredSessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            onClick={() => {
                                                                setSelectedSession(session.id);
                                                                setSessionSearch('');
                                                                setShowSessionDropdown(false);
                                                            }}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                                        >
                                                            {session.nameSession}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-500">Không tìm thấy học kỳ</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Faculty Dropdown */}
                                <div className="relative faculty-dropdown">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khoa
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm và chọn khoa..."
                                            value={selectedFaculty ? getFacultyName(selectedFaculty) : facultySearch}
                                            onChange={(e) => {
                                                setFacultySearch(e.target.value);
                                                if (selectedFaculty && e.target.value !== getFacultyName(selectedFaculty)) {
                                                    setSelectedFaculty('');
                                                }
                                            }}
                                            onFocus={() => setShowFacultyDropdown(true)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        {showFacultyDropdown && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredFaculties.length > 0 ? (
                                                    filteredFaculties.map((faculty) => (
                                                        <div
                                                            key={faculty.faculty_id}
                                                            onClick={() => {
                                                                setSelectedFaculty(faculty.faculty_id);
                                                                setFacultySearch('');
                                                                setShowFacultyDropdown(false);
                                                            }}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                                        >
                                                            <div className="font-medium">{faculty.name}</div>
                                                            <div className="text-sm text-gray-500">{faculty.faculty_id}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-500">Không tìm thấy khoa</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={handleFilter}
                                        disabled={!selectedSession || !selectedFaculty}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 font-medium"
                                    >
                                        Lọc
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto relative">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã lớp học phần</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang tải...
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                                            Lỗi: {error}
                                        </td>
                                    </tr>
                                ) : courseSections.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                ) : (
                                    courseSections.map((courseSection) => (
                                        <tr
                                            key={courseSection.course_section_id}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                {courseSection.course_section_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {courseSection.subjectName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {courseSection.className}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {courseSection.facultyName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {courseSection.sessionName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                                                <button
                                                    data-course-id={courseSection.course_section_id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleActionClick(courseSection.course_section_id);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                                >
                                                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>
                                                
                                                {showActionMenu === courseSection.course_section_id && (
                                                    <div className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-72" 
                                                         style={{
                                                           top: `${(document.querySelector(`[data-course-id="${courseSection.course_section_id}"]`) as HTMLElement)?.getBoundingClientRect()?.bottom + 5 || 0}px`,
                                                           right: `${window.innerWidth - (document.querySelector(`[data-course-id="${courseSection.course_section_id}"]`) as HTMLElement)?.getBoundingClientRect()?.right || 0}px`
                                                         }}>
                                                        <div className="py-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewStudents(courseSection.course_section_id);
                                                                }}
                                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 transition-colors duration-200 flex items-center gap-2"
                                                            >
                                                                <span className="text-blue-500">👥</span>
                                                                <span>Xem điểm và thông tin sinh viên</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewAttendance(courseSection.course_section_id);
                                                                }}
                                                                className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm text-gray-700 transition-colors duration-200 flex items-center gap-2"
                                                            >
                                                                <span className="text-green-500">📋</span>
                                                                <span>Xem buổi điểm danh</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && !error && courseSections.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Trang {page} / {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={!linkPrev}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Trước
                                    </button>

                                    {pages.map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-2 border rounded-md text-sm font-medium ${pageNum === page
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={!linkNext}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <FooterLeCpn />

            {/* Click outside to close action menu */}
            {showActionMenu && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowActionMenu(null)}
                />
            )}
        </div>
    );
};

export default ClazzListPage;
