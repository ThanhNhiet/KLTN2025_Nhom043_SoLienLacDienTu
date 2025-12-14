import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStudent, type StudentWithScore } from '../../../hooks/useStudent';
import { useStatistics } from '../../../hooks/useStatistics';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';
import SendWarningModal from './SendWarningModal';
import StudentInfoModal from './StudentInfoModal';
import SendFormModal from '../alert/SendFormModal';
import CourseStatisticsModal from '../statistics/CourseStatisticsModal';

const StudentListWithScorePage: React.FC = () => {
  const { course_section_id } = useParams<{ course_section_id: string }>();
  const { loading, error, courseSectionData, studentInfo, fetchStudentsByCourseSection, fetchStudentInfo } = useStudent();
  
  const { getCourseSectionStatistics } = useStatistics();
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithScore | null>(null);
  const [showSendFormModal, setShowSendFormModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  
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
    if (course_section_id) {
      fetchStudentsByCourseSection(course_section_id);
    }
  }, [course_section_id, fetchStudentsByCourseSection]);

  const handleSendWarning = async (student: StudentWithScore) => {
    setSelectedStudent(student);
    await fetchStudentInfo(student.student_id);
    setShowWarningModal(true);
  };

  const handleSendSuccess = () => {
    setShowWarningModal(false);
    setSelectedStudent(null);
    if (course_section_id) {
      void fetchStudentsByCourseSection(course_section_id);
    }
  };

  const handleStudentClick = async (student: StudentWithScore) => {
    setSelectedStudent(student);
    await fetchStudentInfo(student.student_id);
    setShowStudentInfoModal(true);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleShowStatistics = async () => {
    if (!courseSectionData?.course_section_id || !courseSectionData?.sessionId) {
      showToast('Không thể tải thống kê: thiếu thông tin lớp học phần', 'error');
      return;
    }

    try {
      setIsFetchingStats(true); 
      setShowStatisticsModal(true);
      const data = await getCourseSectionStatistics(courseSectionData.course_section_id, courseSectionData.sessionId);
      setStatisticsData(data);
    } catch (error) {
      console.error(error);
      showToast('Có lỗi xảy ra khi tải thống kê', 'error');
    } finally {
      setIsFetchingStats(false);
    }
  };

  const formatScore = (score: number | null) => {
    return score !== null && score !== undefined ? score.toFixed(1) : '-';
  };

  const getEvaluationBadge = (evaluate: string) => {
    if (evaluate === 'danger' || evaluate === 'Not passed') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Cần nhắc nhở
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Bình thường
        </span>
      );
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderLeCpn />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Lỗi</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </main>
        <FooterLeCpn />
      </div>
    );
  }

  if (!courseSectionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderLeCpn />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-600">
            Không tìm thấy dữ liệu lớp học phần
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
          {/* Header with Course Section Info */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Danh sách sinh viên và điểm số
              </h1>
              
              <div className="flex gap-3">
                <button
                  onClick={handleShowStatistics}
                  disabled={!courseSectionData}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Thống kê
                </button>
                <button
                  onClick={() => setShowSendFormModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Gửi thông báo
                </button>
              </div>
            </div>
            
            {/* Course Section Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50 rounded-lg p-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Mã lớp học phần:</span>
                <div className="text-base font-semibold text-blue-800">{courseSectionData.course_section_id}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Môn học:</span>
                <div className="text-base font-semibold text-gray-800">{courseSectionData.subjectName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Lớp danh nghĩa:</span>
                <div className="text-base font-semibold text-gray-800">{courseSectionData.className}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Học kỳ:</span>
                <div className="text-base font-semibold text-gray-800">{courseSectionData.sessionName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Khoa:</span>
                <div className="text-base font-semibold text-gray-800">{courseSectionData.facultyName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Giảng viên phụ trách:</span>
                <div className="text-base font-semibold text-gray-800">{courseSectionData.lecturerName}</div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider left-0 bg-gray-50 z-10">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider left-12 bg-gray-50 z-10">MSSV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider left-32 bg-gray-50 z-10">Họ tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">LT TK1</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">LT TK2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">LT TK3</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TH TK1</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TH TK2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TH TK3</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GK</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CK</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm TB</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá sơ bộ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseSectionData.students.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-6 py-4 text-center text-gray-500">
                      Không có sinh viên nào trong lớp học phần này
                    </td>
                  </tr>
                ) : (
                  courseSectionData.students.map((student) => (
                    <tr 
                      key={student.student_id} 
                      onClick={() => handleStudentClick(student)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 left-0 bg-white z-10">
                        {student.no}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 left-12 bg-white z-10">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 left-32 bg-white z-10">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.dob}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.theo_regular1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.theo_regular2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.theo_regular3)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.pra_regular1)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.pra_regular2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.pra_regular3)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.mid)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {formatScore(student.score.final)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                        {formatScore(student.score.avr)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {getEvaluationBadge(student.initial_evaluate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWarning(student);
                          }}
                          disabled={student.initial_evaluate === 'ok' || student.isRemindYet === true}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            student.initial_evaluate !== 'ok' && !student.isRemindYet
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {student.isRemindYet ? 'Đã nhắc nhở' : 'Gửi nhắc nhở'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <FooterLeCpn />

      {/* Send Warning Modal */}
      {showWarningModal && selectedStudent && courseSectionData && (
        <SendWarningModal
          isOpen={showWarningModal}
          onClose={() => {
            setShowWarningModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={handleSendSuccess}
          student={selectedStudent}
          courseSectionData={courseSectionData}
          studentInfo={studentInfo}
        />
      )}

      {/* Student Info Modal */}
      {showStudentInfoModal && selectedStudent && (
        <StudentInfoModal
          isOpen={showStudentInfoModal}
          onClose={() => {
            setShowStudentInfoModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          studentInfo={studentInfo}
          loading={loading}
        />
      )}

      {/* Send Form Modal */}
      {showSendFormModal && (
        <SendFormModal
          isOpen={showSendFormModal}
          onClose={() => setShowSendFormModal(false)}
          onSuccess={(message) => {
            showToast(message, 'success');
            setShowSendFormModal(false);
          }}
          subjectName={courseSectionData?.subjectName}
          courseSectionId={courseSectionData?.course_section_id}
        />
      )}

      {/* Course Statistics Modal */}
      <CourseStatisticsModal
        isOpen={showStatisticsModal}
        onClose={() => {
          setShowStatisticsModal(false);
          setStatisticsData(null);
        }}
        data={statisticsData}
        loading={isFetchingStats}
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

export default StudentListWithScorePage;