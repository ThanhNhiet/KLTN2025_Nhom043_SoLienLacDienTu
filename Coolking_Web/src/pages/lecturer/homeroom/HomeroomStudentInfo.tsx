import React, { useState, useEffect } from 'react';
import { useStudent, type HomeroomStudentCourseSection } from '../../../hooks/useStudent';
import type { StudentInHomeroom } from '../../../hooks/useLecturer';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';
import AttendanceDetailModal from './AttendanceDetailModal';
import SendFormModalHRInfo from './SendFormModalHRInfo';

interface HomeroomStudentInfoProps {
  student: StudentInHomeroom;
  onBack: () => void;
}

const HomeroomStudentInfo: React.FC<HomeroomStudentInfoProps> = ({ student, onBack }) => {
  const { 
    loading,
    error,
    studentScores,
    homeroomStudentCourseSections,
    homeroomStudentRemindStudyList,
    homeroomStudentRemindAttendanceList,
    getStudentScores,
    getHomeroomStudentCourseSections,
    getHomeroomStudentRemindStudyList,
    getHomeroomStudentRemindAttendanceList,
    getStudentAttendanceByCSID_SJID4Lecturer,
    studentAttendanceByCSID_SJID4Lecturer
  } = useStudent();

  const [activeTab, setActiveTab] = useState<'scores' | 'attendance'>('scores');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAttendanceSemester, setSelectedAttendanceSemester] = useState<string>('all');
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [showRemindStudyModal, setShowRemindStudyModal] = useState(false);
  const [showRemindAttendanceModal, setShowRemindAttendanceModal] = useState(false);
  const [showAttendanceDetailModal, setShowAttendanceDetailModal] = useState(false);
  const [showSendNotificationModal, setShowSendNotificationModal] = useState(false);
  const [selectedCourseSection, setSelectedCourseSection] = useState<HomeroomStudentCourseSection | null>(null);
  
  // Pagination states for remind lists
  const [remindStudyPage, setRemindStudyPage] = useState(1);
  const [remindAttendancePage, setRemindAttendancePage] = useState(1);
  
  const pageSize = 10;

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const loadStudentData = async () => {
      if (student?.student_id) {
        try {
          // Load initial data
          await getStudentScores(student.student_id);
          await getHomeroomStudentCourseSections(student.student_id, 1, 1000); // Load tất cả dữ liệu
          
          // Load remind counts (just get first page to see totals)
          await getHomeroomStudentRemindStudyList(student.student_id, 1, pageSize);
          await getHomeroomStudentRemindAttendanceList(student.student_id, 1, pageSize);
        } catch (error) {
          console.error('Error loading student data:', error);
          showToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
        }
      }
    };

    loadStudentData();
  }, [student?.student_id]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    return dateString.replace(/-/g, '/');
  };

  const formatGender = (gender: string) => {
    return gender === 'Nam' ? 'Nam' : 'Nữ';
  };

  // Lấy tất cả học kỳ có sẵn
  const availableSemesters = studentScores ? studentScores.map(score => `${score.semester} ${score.academic_year}`) : [];
  const uniqueSemesters = [...new Set(availableSemesters)];

  // Lấy tất cả môn học từ tất cả học kỳ hoặc từ học kỳ được chọn
  const allSubjectsWithSemester = studentScores ? studentScores.flatMap(scoreData => 
    scoreData.subjects.map(subject => ({
      ...subject,
      semester: scoreData.semester,
      academic_year: scoreData.academic_year,
      semesterDisplay: `${scoreData.semester} ${scoreData.academic_year}`,
      gpa: scoreData.gpa
    }))
  ) : [];

  // Lọc theo học kỳ được chọn
  const subjectsBySemester = selectedSemester === 'all' ? 
    allSubjectsWithSemester : 
    allSubjectsWithSemester.filter(subject => subject.semesterDisplay === selectedSemester);

  // Lọc theo từ khóa tìm kiếm
  const filteredSubjects = subjectsBySemester.filter(subject =>
    subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lấy tất cả học kỳ từ course sections cho filter chuyên cần
  const availableAttendanceSemesters = homeroomStudentCourseSections ? 
    [...new Set(homeroomStudentCourseSections.courseSections.map(cs => cs.sessionName))] : [];

  // Lọc course sections theo học kỳ được chọn
  const courseSectionsBySemester = selectedAttendanceSemester === 'all' ? 
    (homeroomStudentCourseSections?.courseSections || []) :
    (homeroomStudentCourseSections?.courseSections || []).filter(cs => cs.sessionName === selectedAttendanceSemester);

  // Lọc course sections theo từ khóa tìm kiếm
  const filteredCourseSections = courseSectionsBySemester.filter(cs =>
    cs.subjectName.toLowerCase().includes(attendanceSearchTerm.toLowerCase())
  );

  const handleRemindStudyDetail = async () => {
    setShowRemindStudyModal(true);
    await getHomeroomStudentRemindStudyList(student.student_id, remindStudyPage, pageSize);
  };

  const handleRemindAttendanceDetail = async () => {
    setShowRemindAttendanceModal(true);
    await getHomeroomStudentRemindAttendanceList(student.student_id, remindAttendancePage, pageSize);
  };

  const handleCourseSectionSelect = async (courseSection: HomeroomStudentCourseSection) => {
    setSelectedCourseSection(courseSection);
    await getStudentAttendanceByCSID_SJID4Lecturer({
      course_section_id: courseSection.course_section_id,
      subject_id: courseSection.subject_id,
      student_id: student.student_id
    });
    setShowAttendanceDetailModal(true);
  };

  const handleRemindStudyPageChange = async (page: number) => {
    setRemindStudyPage(page);
    await getHomeroomStudentRemindStudyList(student.student_id, page, pageSize);
  };

  const handleRemindAttendancePageChange = async (page: number) => {
    setRemindAttendancePage(page);
    await getHomeroomStudentRemindAttendanceList(student.student_id, page, pageSize);
  };

  // Check if student data is available
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderLeCpn />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <div className="text-lg font-medium mb-2">Lỗi</div>
            <div>Không có thông tin sinh viên</div>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Quay lại
            </button>
          </div>
        </main>
        <FooterLeCpn />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderLeCpn />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <div className="text-lg font-medium mb-2">Lỗi</div>
            <div>{error}</div>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Quay lại
            </button>
          </div>
        </main>
        <FooterLeCpn />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderLeCpn />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center">
            <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-medium text-gray-700">Đang tải...</span>
          </div>
        </main>
        <FooterLeCpn />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderLeCpn />
      
      <main className="flex-1 max-w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                Thông tin chi tiết sinh viên
              </h1>
              <button
                onClick={() => setShowSendNotificationModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Gửi thông báo
              </button>
            </div>
          </div>

          {/* Student Information */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Student Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Thông tin sinh viên</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">MSSV:</span>
                    <div className="text-base font-semibold text-gray-800">{student.student_id}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Họ tên:</span>
                    <div className="text-base font-semibold text-gray-800">{student.name}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Ngày sinh:</span>
                    <div className="text-base font-semibold text-gray-800">{formatDate(student.dob)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Giới tính:</span>
                    <div className="text-base font-semibold text-gray-800">{formatGender(student.gender)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <div className="text-base font-semibold text-gray-800">{student.email}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">SĐT:</span>
                    <div className="text-base font-semibold text-gray-800">{student.phone}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm font-medium text-gray-600">Địa chỉ:</span>
                    <div className="text-base font-semibold text-gray-800">{student.address}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Số lần nhắc nhở học tập:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-800">
                        {homeroomStudentRemindStudyList?.total || 0}
                      </span>
                      <button
                        onClick={handleRemindStudyDetail}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Số lần nhắc nhở chuyên cần:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-800">
                        {homeroomStudentRemindAttendanceList?.total || 0}
                      </span>
                      <button
                        onClick={handleRemindAttendanceDetail}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Thông tin phụ huynh</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">MSPH:</span>
                    <div className="text-base font-semibold text-gray-800">{student.parent_id}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Họ tên:</span>
                    <div className="text-base font-semibold text-gray-800">{student.parentName}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Ngày sinh:</span>
                    <div className="text-base font-semibold text-gray-800">{formatDate(student.parentDob)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Giới tính:</span>
                    <div className="text-base font-semibold text-gray-800">{formatGender(student.parentGender)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <div className="text-base font-semibold text-gray-800">{student.parentEmail}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">SĐT:</span>
                    <div className="text-base font-semibold text-gray-800">{student.parentPhone}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm font-medium text-gray-600">Địa chỉ:</span>
                    <div className="text-base font-semibold text-gray-800">{student.parentAddress}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('scores')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'scores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Điểm số từng môn
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chuyên cần
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {activeTab === 'scores' && (
              <div>
                {/* Search and Filter */}
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative max-w-lg flex-1 ">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm theo tên môn học..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="max-w-xs">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="all">Tất cả học kỳ</option>
                      {uniqueSemesters.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* GPA Summary */}
                {filteredSubjects.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    {selectedSemester !== 'all' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Học kỳ</div>
                          <div className="text-lg font-bold text-blue-600">{selectedSemester}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">Tổng số môn</div>
                          <div className="text-lg font-bold text-blue-600">{filteredSubjects.length}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">GPA Học Kỳ</div>
                          <div className="text-lg font-bold text-blue-600">
                            {filteredSubjects[0]?.gpa || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Tổng học kỳ</div>
                          <div className="text-lg font-bold text-blue-600">{uniqueSemesters.length}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">Tổng số môn</div>
                          <div className="text-lg font-bold text-blue-600">{filteredSubjects.length}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">GPA Tích Lũy</div>
                          <div className="text-lg font-bold text-blue-600">
                            {studentScores && studentScores.length > 0 ? 
                              (() => {
                                const totalWeightedGPA = studentScores.reduce((sum, score) => 
                                  sum + (parseFloat(score.gpa) * score.total_credits), 0
                                );
                                const totalCredits = studentScores.reduce((sum, score) => 
                                  sum + score.total_credits, 0
                                );
                                return totalCredits > 0 ? (totalWeightedGPA / totalCredits).toFixed(2) : 'N/A';
                              })() : 
                              'N/A'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scores Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn học</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tín chí</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">LT1</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">LT2</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">LT3</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TH1</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TH2</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TH3</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Giữa kỳ</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cuối kỳ</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trung bình</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Điểm chữ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubjects.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
                            {searchTerm ? 'Không tìm thấy môn học nào phù hợp' : 'Không có dữ liệu điểm số'}
                          </td>
                        </tr>
                      ) : (
                        filteredSubjects.map((subject, index) => (
                          <tr key={`${subject.semesterDisplay}-${subject.subject_name}-${index}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{subject.semesterDisplay}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.subject_name}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.credits}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.theo_regular1 || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.theo_regular2 || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.theo_regular3 || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.pra_regular1 || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.pra_regular2 || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.pra_regular3 || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.midterm || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.final || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-semibold">{subject.average || '-'}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-semibold">{subject.grade_point || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                {/* Search and Filter */}
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative max-w-lg flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={attendanceSearchTerm}
                      onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm theo tên môn học..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="max-w-xs">
                    <select
                      value={selectedAttendanceSemester}
                      onChange={(e) => setSelectedAttendanceSemester(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="all">Tất cả học kỳ</option>
                      {availableAttendanceSemesters.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn học</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảng viên</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCourseSections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            {attendanceSearchTerm ? 'Không tìm thấy lớp học phần nào phù hợp' : 
                             (selectedAttendanceSemester === 'all' ? 'Không có dữ liệu lớp học phần' : 'Không có lớp học phần nào trong học kỳ này')}
                          </td>
                        </tr>
                      ) : (
                        filteredCourseSections.map((courseSection) => (
                          <tr key={courseSection.course_section_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{courseSection.subjectName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{courseSection.className}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{courseSection.sessionName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{courseSection.lecturerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(courseSection.createdAt)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleCourseSectionSelect(courseSection)}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <FooterLeCpn />

      {/* Remind Study Detail Modal */}
      {showRemindStudyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRemindStudyModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chi tiết nhắc nhở học tập ({homeroomStudentRemindStudyList?.total || 0})
                  </h3>
                  <button
                    onClick={() => setShowRemindStudyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {homeroomStudentRemindStudyList?.alerts.map((remind) => (
                    <div key={remind._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{remind.header}</h4>
                        <span className="text-xs text-gray-500">{remind.createdAt}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{remind.body}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {homeroomStudentRemindStudyList && homeroomStudentRemindStudyList.pages.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {homeroomStudentRemindStudyList.pages.map(page => (
                      <button
                        key={page}
                        onClick={() => handleRemindStudyPageChange(page)}
                        className={`px-3 py-2 rounded ${
                          page === remindStudyPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remind Attendance Detail Modal */}
      {showRemindAttendanceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRemindAttendanceModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chi tiết nhắc nhở chuyên cần ({homeroomStudentRemindAttendanceList?.total || 0})
                  </h3>
                  <button
                    onClick={() => setShowRemindAttendanceModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {homeroomStudentRemindAttendanceList?.alerts.map((remind) => (
                    <div key={remind._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{remind.header}</h4>
                        <span className="text-xs text-gray-500">{remind.createdAt}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{remind.body}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {homeroomStudentRemindAttendanceList && homeroomStudentRemindAttendanceList.pages.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {homeroomStudentRemindAttendanceList.pages.map(page => (
                      <button
                        key={page}
                        onClick={() => handleRemindAttendancePageChange(page)}
                        className={`px-3 py-2 rounded ${
                          page === remindAttendancePage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      {showAttendanceDetailModal && selectedCourseSection && (
        <AttendanceDetailModal
          isOpen={showAttendanceDetailModal}
          onClose={() => {
            setShowAttendanceDetailModal(false);
            setSelectedCourseSection(null);
          }}
          courseSection={selectedCourseSection}
          attendanceData={studentAttendanceByCSID_SJID4Lecturer}
          loading={loading}
        />
      )}

      {/* Send Notification Modal */}
      <SendFormModalHRInfo
        isOpen={showSendNotificationModal}
        onClose={() => setShowSendNotificationModal(false)}
        onSuccess={showToast}
        student={student}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeroomStudentInfo;
