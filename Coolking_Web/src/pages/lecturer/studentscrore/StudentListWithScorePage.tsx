import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStudent, type StudentWithScore } from '../../../hooks/useStudent';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';
import SendWarningModal from './SendWarningModal';
import StudentInfoModal from './StudentInfoModal';

const StudentListWithScorePage: React.FC = () => {
  const { course_section_id } = useParams<{ course_section_id: string }>();
  const { loading, error, courseSectionData, studentInfo, fetchStudentsByCourseSection, fetchStudentInfo } = useStudent();
  
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showStudentInfoModal, setShowStudentInfoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithScore | null>(null);

  useEffect(() => {
    if (course_section_id) {
      fetchStudentsByCourseSection(course_section_id);
    }
  }, [course_section_id, fetchStudentsByCourseSection]);

  const handleSendWarning = (student: StudentWithScore) => {
    setSelectedStudent(student);
    setShowWarningModal(true);
  };

  const handleSendSuccess = () => {
    setShowWarningModal(false);
    setSelectedStudent(null);
    if (course_section_id) {
      void fetchStudentsByCourseSection(course_section_id);
    }
  };

  const handleStudentClick = (student: StudentWithScore) => {
    setSelectedStudent(student);
    fetchStudentInfo(student.student_id);
    setShowStudentInfoModal(true);
  };

  const formatScore = (score: number | null) => {
    return score !== null && score !== undefined ? score.toFixed(1) : '-';
  };

  const getEvaluationBadge = (evaluate: string) => {
    if (evaluate === 'danger' || evaluate === 'Not passed') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Cần cảnh báo
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Danh sách sinh viên và điểm số
            </h1>
            
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
                          disabled={student.initial_evaluate === 'ok' || student.isWarningYet === true}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            student.initial_evaluate !== 'ok' && !student.isWarningYet
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {student.isWarningYet ? 'Đã yêu cầu' : 'Gửi yêu cầu cảnh báo'}
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
    </div>
  );
};

export default StudentListWithScorePage;
