import React from 'react';

interface GradeDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  fail: number;
}

interface CourseInfo {
  subjectId: string | null;
  subjectName: string;
  subjectCredit: number;
  className: string;
  sessionName: string;
  facultyName: string;
  lecturerName: string;
  lecturerId: string | null;
}

interface StudentStatistics {
  total_students: number;
  students_with_scores: number;
  students_passed: number;
  pass_rate: number;
}

interface ScoreStatistics {
  average_score: number;
  min_score: number;
  max_score: number;
  grade_distribution: GradeDistribution;
}

interface AttendanceStatistics {
  total_class_sessions: number;
  attendance_rate: number;
  absent_rate: number;
  late_rate: number;
  present_count: number;
  absent_count: number;
  late_count: number;
}

interface CourseSectionData {
  course_section_id: string;
  course_section_info: CourseInfo;
  student_statistics: StudentStatistics;
  score_statistics: ScoreStatistics;
  attendance_statistics: AttendanceStatistics;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: CourseSectionData | null;
  loading?: boolean;
}

const CourseStatisticsModal: React.FC<Props> = ({ isOpen, onClose, data, loading = false }) => {
  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center">
            <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-medium text-gray-700">Đang tải thống kê...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Lỗi</div>
            <div className="text-gray-600 mb-4">Không thể tải dữ liệu thống kê</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    course_section_id,
    course_section_info,
    student_statistics,
    score_statistics,
    attendance_statistics
  } = data;

  // Calculate percentages for grade distribution chart
  const totalGrades = Object.values(score_statistics.grade_distribution).reduce((sum, count) => sum + count, 0);
  const gradePercentages = totalGrades > 0 ? {
    excellent: (score_statistics.grade_distribution.excellent / totalGrades) * 100,
    good: (score_statistics.grade_distribution.good / totalGrades) * 100,
    fair: (score_statistics.grade_distribution.fair / totalGrades) * 100,
    poor: (score_statistics.grade_distribution.poor / totalGrades) * 100,
    fail: (score_statistics.grade_distribution.fail / totalGrades) * 100
  } : { excellent: 0, good: 0, fair: 0, poor: 0, fail: 0 };

  const basicInfoData = [
    { label: 'Mã lớp học phần', value: course_section_id, icon: '🆔' },
    { label: 'Môn học', value: course_section_info.subjectName, icon: '📚' },
    { label: 'Lớp', value: course_section_info.className, icon: '🏛️' },
    { label: 'Số tín chỉ', value: course_section_info.subjectCredit, icon: '📊' },
    { label: 'Giảng viên', value: course_section_info.lecturerName, icon: '👨‍🏫' },
    { label: 'Khoa', value: course_section_info.facultyName, icon: '🏢' },
    { label: 'Học kỳ', value: course_section_info.sessionName, icon: '📅' }
  ];

  const studentStatsData = [
    { label: 'Tổng sinh viên', value: student_statistics.total_students, icon: '👥' },
    { label: 'Sinh viên có điểm', value: student_statistics.students_with_scores, icon: '📊' },
    { label: 'Sinh viên đậu', value: student_statistics.students_passed, icon: '✅' },
    { label: 'Tỷ lệ đậu', value: `${student_statistics.pass_rate}%`, icon: '🎯' }
  ];

  const scoreStatsData = [
    { label: 'Điểm trung bình', value: score_statistics.average_score.toFixed(2), icon: '📈' },
    { label: 'Điểm thấp nhất', value: score_statistics.min_score > 0 ? score_statistics.min_score.toFixed(2) : 'N/A', icon: '📉' },
    { label: 'Điểm cao nhất', value: score_statistics.max_score > 0 ? score_statistics.max_score.toFixed(2) : 'N/A', icon: '📊' }
  ];

  const attendanceStatsData = [
    { label: 'Tổng buổi học', value: attendance_statistics.total_class_sessions, icon: '📅' },
    { label: 'Có mặt', value: attendance_statistics.present_count, icon: '✅' },
    { label: 'Muộn', value: attendance_statistics.late_count, icon: '⏰' },
    { label: 'Vắng mặt', value: attendance_statistics.absent_count, icon: '❌' },
    { label: 'Tỷ lệ điểm danh', value: `${attendance_statistics.attendance_rate}%`, icon: '📊' },
    { label: 'Tỷ lệ vắng mặt', value: `${attendance_statistics.absent_rate}%`, icon: '📉' },
    { label: 'Tỷ lệ muộn', value: `${attendance_statistics.late_rate}%`, icon: '⏱️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Chi tiết thống kê lớp học phần</h2>
              <p className="text-purple-100">
                <span className="font-semibold">{course_section_info.subjectName}</span> - {course_section_info.className}
              </p>
              <p className="text-purple-100 text-sm">
                {course_section_info.facultyName} - {course_section_info.sessionName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors duration-200 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6 border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">ℹ️</span>
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {basicInfoData.map((info, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{info.icon}</span>
                    <div className="text-sm text-gray-600">{info.label}</div>
                  </div>
                  <div className="text-lg font-semibold text-gray-800 break-all">
                    {info.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Statistics */}
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-2xl mr-2">👥</span>
              Thống kê sinh viên
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {studentStatsData.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{stat.icon}</span>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Statistics */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📈</span>
                Thống kê điểm số
              </h3>
              <div className="space-y-4 mb-6">
                {scoreStatsData.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{stat.icon}</span>
                      <span className="text-gray-700">{stat.label}</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grade Distribution Summary */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Phân bố điểm</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  {Object.entries(score_statistics.grade_distribution).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      excellent: 'Xuất sắc',
                      good: 'Giỏi',
                      fair: 'Khá',
                      poor: 'Trung bình',
                      fail: 'Yếu'
                    };
                    const colors: Record<string, string> = {
                      excellent: 'text-green-600 bg-green-50',
                      good: 'text-blue-600 bg-blue-50',
                      fair: 'text-yellow-600 bg-yellow-50',
                      poor: 'text-orange-600 bg-orange-50',
                      fail: 'text-red-600 bg-red-50'
                    };
                    return (
                      <div key={key} className={`p-3 rounded-lg border ${colors[key]}`}>
                        <div className="text-xl font-bold">
                          {value}
                        </div>
                        <div className="text-sm">{labels[key]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Attendance Statistics */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📅</span>
                Thống kê điểm danh
              </h3>
              <div className="space-y-3">
                {attendanceStatsData.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{stat.icon}</span>
                      <span className="text-gray-700">{stat.label}</span>
                    </div>
                    <div className="text-lg font-semibold text-purple-600">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grade Distribution Chart */}
          {totalGrades > 0 && (
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Biểu đồ phân bố điểm số
              </h3>
              
              <div className="space-y-4">
                {[
                  { key: 'excellent', label: 'Xuất sắc (8.5-10)', color: 'bg-green-500', count: score_statistics.grade_distribution.excellent },
                  { key: 'good', label: 'Giỏi (7.0-8.4)', color: 'bg-blue-500', count: score_statistics.grade_distribution.good },
                  { key: 'fair', label: 'Khá (5.5-6.9)', color: 'bg-yellow-500', count: score_statistics.grade_distribution.fair },
                  { key: 'poor', label: 'Trung bình (4.0-5.4)', color: 'bg-orange-500', count: score_statistics.grade_distribution.poor },
                  { key: 'fail', label: 'Yếu (<4.0)', color: 'bg-red-500', count: score_statistics.grade_distribution.fail }
                ].map((grade) => (
                  <div key={grade.key} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700 mr-4">
                      {grade.label}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div
                        className={`${grade.color} h-8 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${gradePercentages[grade.key as keyof typeof gradePercentages]}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                        {grade.count} ({gradePercentages[grade.key as keyof typeof gradePercentages].toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStatisticsModal;