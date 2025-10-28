import React, { useState, useEffect } from 'react';
import SendWarningModal from './SendWarningModal';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../../../hooks/useStudent';
import { useStatistics } from '../../../hooks/useStatistics';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';

const WarningStudentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { fetchStudentsWarningList, searchStudentWarningSubject, loading, error } = useStudent();
    const { sessions, faculties, fetchAllSessions, fetchAllFaculties } = useStatistics();

    // Dropdown states
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [sessionSearch, setSessionSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');
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
    const [selectedOption, setSelectedOption] = useState('all');
    const [studentSearch, setStudentSearch] = useState('');

    // Table data states
    const [students, setStudents] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pages, setPages] = useState<number[]>([]);
    const [searchResult, setSearchResult] = useState<any | null>(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    // Fetch danh sách sinh viên cần cảnh cáo
    const handleFetchStudents = async () => {
        if (!selectedSession || !selectedFaculty || !selectedOption) return;
        setSearchResult(null);
        try {
            const params = {
                sessionId: selectedSession,
                facultyId: selectedFaculty,
                option: selectedOption,
                page,
                pageSize
            };
            const data = await fetchStudentsWarningList(params);
            if (data && data.students) {
                setStudents(data.students);
                setTotal(data.total);
                setPages(data.pages || []);
            } else {
                setStudents([]);
                setTotal(0);
                setPages([]);
            }
        } catch {
            setStudents([]);
            setTotal(0);
            setPages([]);
        }
    };

    // Search theo MSSV
    const handleSearchStudent = async () => {
        if (!studentSearch.trim() || !selectedSession || !selectedFaculty) return;
        try {
            const params = {
                sessionId: selectedSession,
                facultyId: selectedFaculty,
                studentId: studentSearch.trim()
            };
            const data = await searchStudentWarningSubject(params);
            setSearchResult(data);
        } catch {
            setSearchResult(null);
        }
    };

    useEffect(() => {
        fetchAllSessions();
        fetchAllFaculties();
    }, [fetchAllSessions, fetchAllFaculties]);

    // Fetch lại khi đổi trang
    useEffect(() => {
        if (searchResult) return;
        handleFetchStudents();
        // eslint-disable-next-line
    }, [page]);

    // Đóng dropdown khi click ra ngoài
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
    }, []);

    // UI only, logic fetch sẽ thêm sau
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderAdCpn />
            <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
                <div className="bg-white rounded-lg shadow-sm border">
                    {/* Header + Back */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-800">Danh sách sinh viên cần cảnh cáo</h1>
                        <button
                            onClick={() => navigate('/admin/alerts')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Quay lại</span>
                        </button>
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4">
                        {/* Học kỳ: text input + dropdown */}
                        <div className="session-dropdown">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Học kỳ</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm và chọn học kỳ..."
                                    value={selectedSession ? sessions.find(s => s.id === selectedSession)?.nameSession || '' : sessionSearch}
                                    onChange={e => {
                                        setSessionSearch(e.target.value);
                                        if (selectedSession && e.target.value !== sessions.find(s => s.id === selectedSession)?.nameSession) {
                                            setSelectedSession('');
                                        }
                                    }}
                                    onFocus={() => setShowSessionDropdown(true)}
                                    disabled={loading}
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
                                            <div className="px-4 py-2 text-gray-500 text-center">Không tìm thấy học kỳ nào</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Khoa: text input + dropdown */}
                        <div className="faculty-dropdown">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Khoa</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm và chọn khoa..."
                                    value={selectedFaculty ? faculties.find(f => f.faculty_id === selectedFaculty)?.name || '' : facultySearch}
                                    onChange={e => {
                                        setFacultySearch(e.target.value);
                                        if (selectedFaculty && e.target.value !== faculties.find(f => f.faculty_id === selectedFaculty)?.name) {
                                            setSelectedFaculty('');
                                        }
                                    }}
                                    onFocus={() => setShowFacultyDropdown(true)}
                                    disabled={loading}
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
                                            <div className="px-4 py-2 text-gray-500 text-center">Không tìm thấy khoa nào</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Dropdown Options lọc */}
                        <div>
                            <select
                                value={selectedOption}
                                onChange={e => setSelectedOption(e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mt-7"
                            >
                                <option value="all">Tất cả</option>
                                <option value="notWarningYet">Chưa cảnh báo</option>
                            </select>
                        </div>
                        {/* Nút tìm kiếm danh sách */}
                        <div className="flex items-end">
                            <button
                                onClick={handleFetchStudents}
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                disabled={!selectedSession || !selectedFaculty || !selectedOption || loading}
                            >
                                {loading && !studentSearch.trim() ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Đang tìm...
                                    </>
                                ) : 'Tìm kiếm'}
                            </button>
                        </div>
                        {/* Search MSSV */}
                        <div className="flex items-end gap-2">
                            <input
                                type="text"
                                placeholder="Tìm theo MSSV..."
                                value={studentSearch}
                                disabled={loading}
                                onChange={e => setStudentSearch(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <button
                                onClick={handleSearchStudent} disabled={loading || !studentSearch.trim()}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto px-6 pb-6">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã lớp học phần</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên môn học</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MSSV</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LT TK1</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LT TK2</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LT TK3</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TH TK1</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TH TK2</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TH TK3</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GK</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CK</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TB</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 relative">
                                {loading && (
                                    <tr>
                                        <td colSpan={14} className="px-4 py-6 text-center text-gray-500">
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang tải dữ liệu...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {/* Nếu có searchResult thì hiển thị riêng */}
                                {searchResult ? (
                                    searchResult.failedSubjects && searchResult.failedSubjects.length > 0 ? (
                                        searchResult.failedSubjects.map((subject: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{subject.course_section_id}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.subjectName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{searchResult.student_id}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{searchResult.studentName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.theo_regular1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.theo_regular2}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.theo_regular3}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.pra_regular1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.pra_regular2}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.pra_regular3}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.mid}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.final}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{subject.avr}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    <button
                                                        disabled={subject.isWarningYet}
                                                        className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${subject.isWarningYet ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                                        onClick={() => {
                                                            setSelectedStudent({
                                                                ...subject,
                                                                student_id: searchResult.student_id,
                                                                studentName: searchResult.studentName,
                                                                parent_id: searchResult.parent_id
                                                            });
                                                            setShowWarningModal(true);
                                                        }}
                                                    >
                                                        Gửi cảnh báo
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={14} className="px-4 py-6 text-center text-gray-500">Không có dữ liệu</td>
                                        </tr>
                                    )
                                ) : (
                                    !loading && (students.length === 0 || error) ? (
                                        <tr>
                                            <td colSpan={14} className="px-4 py-6 text-center text-gray-500">
                                                {error ? (
                                                    <span className="text-red-500">{error}</span>
                                                ) : 'Không có dữ liệu hoặc bạn chưa chọn Học kỳ và Khoa để tìm kiếm.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        !loading && students.map((student, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{student.course_section_id}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.subjectName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.student_id}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.studentName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.theo_regular1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.theo_regular2}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.theo_regular3}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.pra_regular1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.pra_regular2}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.pra_regular3}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.mid}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.final}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.avr}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    <button
                                                        disabled={student.isWarningYet}
                                                        className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${student.isWarningYet ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setShowWarningModal(true);
                                                        }}
                                                    >
                                                        Gửi cảnh báo
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!searchResult && pages.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
                            <nav className="flex items-center space-x-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    &lt;
                                </button>
                                {pages.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === pages[pages.length - 1]}
                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    &gt;
                                </button>
                            </nav>
                        </div>
                    )}

                    {/* Modal gửi cảnh báo */}
                    {showWarningModal && selectedStudent && (
                        <SendWarningModal
                            isOpen={showWarningModal}
                            onClose={() => {
                                setShowWarningModal(false);
                                setSelectedStudent(null);
                            }}
                            onSuccess={handleFetchStudents} // Refresh list on success
                            studentData={selectedStudent}
                        />
                    )}
                </div>
            </main>
            <FooterAdCpn />
        </div>
    );
};

export default WarningStudentsPage;
