import React, { useState } from 'react';
import CourseSectionStatisticsDetailModal from './CourseSectionStatisticsDetailModal';
import ReactDOM from 'react-dom';

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

interface FacultySummary {
  total_course_sections: number;
  total_students: number;
  total_students_with_scores: number;
  average_score: number;
  pass_rate: number;
  attendance_rate: number;
  grade_distribution: GradeDistribution;
}

interface CourseSectionStatisticsData {
  faculty_id: string;
  faculty_name: string;
  session_name: string;
  faculty_summary: FacultySummary;
  course_sections: CourseSectionData[];
}

interface Props {
  data: CourseSectionStatisticsData;
}

const CourseSectionStatisticsChart: React.FC<Props> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCourseSection, setSelectedCourseSection] = useState<CourseSectionData | null>(null);
  const itemsPerPage = 10;

  // Safety check for data structure
  if (!data || !data.course_sections || !Array.isArray(data.course_sections)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dữ liệu không hợp lệ</h3>
          <p className="text-gray-500">Dữ liệu thống kê lớp học phần không đúng định dạng. Vui lòng thử lại.</p>
        </div>
      </div>
    );
  }

  const {
    faculty_name,
    session_name,
    faculty_summary,
    course_sections
  } = data;

  // Export to CSV function
  const exportToCSV = () => {
    try {
      // Prepare data for CSV
      const csvData = [
        ['THỐNG KÊ LỚP HỌC PHẦN'],
        ['Khoa:', faculty_name],
        ['Mã khoa:', data.faculty_id],
        ['Học kỳ:', session_name],
        ['Tổng số lớp học phần:', faculty_summary.total_course_sections],
        [''],
        ['THỐNG KÊ TỔNG QUAN KHOA'],
        ['Chỉ tiêu', 'Giá trị'],
        ['Tổng lớp học phần', faculty_summary.total_course_sections],
        ['Tổng sinh viên', faculty_summary.total_students],
        ['Sinh viên có điểm', faculty_summary.total_students_with_scores],
        ['Điểm trung bình', faculty_summary.average_score],
        ['Tỷ lệ đậu (%)', faculty_summary.pass_rate],
        ['Tỷ lệ điểm danh (%)', faculty_summary.attendance_rate],
        [''],
        ['PHÂN BỐ ĐIỂM SỐ TỔNG QUAN'],
        ['Loại điểm', 'Số lượng', 'Tỷ lệ (%)'],
        ['Xuất sắc (8.5-10)', faculty_summary.grade_distribution.excellent, 
         ((faculty_summary.grade_distribution.excellent / Object.values(faculty_summary.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Giỏi (7.0-8.4)', faculty_summary.grade_distribution.good,
         ((faculty_summary.grade_distribution.good / Object.values(faculty_summary.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Khá (5.5-6.9)', faculty_summary.grade_distribution.fair,
         ((faculty_summary.grade_distribution.fair / Object.values(faculty_summary.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Trung bình (4.0-5.4)', faculty_summary.grade_distribution.poor,
         ((faculty_summary.grade_distribution.poor / Object.values(faculty_summary.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Yếu (<4.0)', faculty_summary.grade_distribution.fail,
         ((faculty_summary.grade_distribution.fail / Object.values(faculty_summary.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        [''],
        ['CHI TIẾT TỪNG LỚP HỌC PHẦN'],
        ['Mã lớp học phần', 'Môn học', 'Tên lớp', 'Số tín chỉ', 'Giảng viên', 'Mã giảng viên', 
         'Tổng sinh viên', 'Sinh viên có điểm', 'Sinh viên đậu', 'Tỷ lệ đậu (%)', 'Điểm trung bình',
         'Điểm thấp nhất', 'Điểm cao nhất', 'Tổng buổi học', 'Tỷ lệ điểm danh (%)', 'Tỷ lệ vắng (%)', 'Tỷ lệ muộn (%)'],
      ];

      // Add course section data
      course_sections.forEach(cs => {
        csvData.push([
          cs.course_section_id,
          cs.course_section_info.subjectName,
          cs.course_section_info.className,
          cs.course_section_info.subjectCredit,
          cs.course_section_info.lecturerName,
          cs.course_section_info.lecturerId || '',
          cs.student_statistics.total_students,
          cs.student_statistics.students_with_scores,
          cs.student_statistics.students_passed,
          cs.student_statistics.pass_rate,
          cs.score_statistics.average_score,
          cs.score_statistics.min_score,
          cs.score_statistics.max_score,
          cs.attendance_statistics.total_class_sessions,
          cs.attendance_statistics.attendance_rate,
          cs.attendance_statistics.absent_rate,
          cs.attendance_statistics.late_rate
        ]);
      });

      // Convert array to CSV string
      const csvContent = csvData.map(row => 
        row.map(cell => {
          // Handle cells containing commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      // Add UTF-8 BOM for proper encoding
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create and download file
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Thong-ke-lop-hoc-phan-${data.faculty_id}-${data.session_name}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Có lỗi xảy ra khi xuất CSV. Vui lòng thử lại.');
    }
  };

  // Filter course sections by subject name or class name
  const filteredCourseSections = course_sections.filter(cs =>
    cs.course_section_info.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.course_section_info.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.course_section_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCourseSections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourseSections = filteredCourseSections.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCourseSectionClick = (courseSection: CourseSectionData) => {
    setSelectedCourseSection(courseSection);
    setShowDetailModal(true);
  };

  const summaryCards = [
    {
      label: 'Tổng lớp học phần',
      value: faculty_summary.total_course_sections,
      icon: '🏛️',
      color: 'bg-blue-500'
    },
    {
      label: 'Tổng sinh viên',
      value: faculty_summary.total_students,
      icon: '👥',
      color: 'bg-green-500'
    },
    {
      label: 'Sinh viên có điểm',
      value: faculty_summary.total_students_with_scores,
      icon: '📊',
      color: 'bg-purple-500'
    },
    {
      label: 'Điểm trung bình',
      value: faculty_summary.average_score.toFixed(2),
      icon: '📈',
      color: 'bg-orange-500'
    },
    {
      label: 'Tỷ lệ đậu',
      value: `${faculty_summary.pass_rate}%`,
      icon: '✅',
      color: 'bg-emerald-500'
    },
    {
      label: 'Tỷ lệ điểm danh',
      value: `${faculty_summary.attendance_rate}%`,
      icon: '📅',
      color: 'bg-cyan-500'
    }
  ];

  // Calculate grade distribution percentages
  const totalGrades = Object.values(faculty_summary.grade_distribution).reduce((sum, count) => sum + count, 0);
  const gradePercentages = totalGrades > 0 ? {
    excellent: (faculty_summary.grade_distribution.excellent / totalGrades) * 100,
    good: (faculty_summary.grade_distribution.good / totalGrades) * 100,
    fair: (faculty_summary.grade_distribution.fair / totalGrades) * 100,
    poor: (faculty_summary.grade_distribution.poor / totalGrades) * 100,
    fail: (faculty_summary.grade_distribution.fail / totalGrades) * 100
  } : { excellent: 0, good: 0, fair: 0, poor: 0, fail: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Thống kê Lớp học phần</h2>
        <p className="text-purple-100">
          <span className="font-semibold">{faculty_name}</span> - {session_name}
        </p>
        <p className="text-purple-100 mt-1">
          Tổng số lớp học phần: <span className="font-semibold">{faculty_summary.total_course_sections}</span>
        </p>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất CSV
        </button>
      </div>

      {/* Faculty Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <div className={`${card.color} w-3 h-3 rounded-full`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </div>
            <div className="text-sm text-gray-600">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Grade Distribution Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Phân bố điểm số tổng quan</h3>

        <div className="space-y-4 mb-6">
          {[
            { key: 'excellent', label: 'Xuất sắc (8.5-10)', color: 'bg-green-500', count: faculty_summary.grade_distribution.excellent },
            { key: 'good', label: 'Giỏi (7.0-8.4)', color: 'bg-blue-500', count: faculty_summary.grade_distribution.good },
            { key: 'fair', label: 'Khá (5.5-6.9)', color: 'bg-yellow-500', count: faculty_summary.grade_distribution.fair },
            { key: 'poor', label: 'Trung bình (4.0-5.4)', color: 'bg-orange-500', count: faculty_summary.grade_distribution.poor },
            { key: 'fail', label: 'Yếu (<4.0)', color: 'bg-red-500', count: faculty_summary.grade_distribution.fail }
          ].map((grade) => (
            <div key={grade.key} className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700 mr-4">
                {grade.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`${grade.color} h-6 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${gradePercentages[grade.key as keyof typeof gradePercentages]}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {grade.count} ({gradePercentages[grade.key as keyof typeof gradePercentages].toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Sections Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Thống kê từng môn học
            </h3>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm theo môn học, lớp hoặc mã..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <div className="text-sm text-gray-600">
              Tìm thấy: {filteredCourseSections.length} / {course_sections.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã lớp học phần
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Môn học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên lớp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tín chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sinh viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tỷ lệ đậu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm TB
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCourseSections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy lớp học phần nào phù hợp' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                paginatedCourseSections.map((cs, index) => (
                  <tr
                    key={cs.course_section_id}
                    onClick={() => handleCourseSectionClick(cs)}
                    className={`${(startIndex + index) % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-blue-50 cursor-pointer transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {cs.course_section_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={cs.course_section_info.subjectName}>
                        {cs.course_section_info.subjectName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cs.course_section_info.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cs.course_section_info.subjectCredit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={cs.course_section_info.lecturerName}>
                        {cs.course_section_info.lecturerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cs.student_statistics.total_students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cs.student_statistics.pass_rate >= 80
                            ? 'bg-green-100 text-green-800'
                            : cs.student_statistics.pass_rate >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {cs.student_statistics.pass_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cs.score_statistics.average_score >= 7
                            ? 'bg-green-100 text-green-800'
                            : cs.score_statistics.average_score >= 5.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {cs.score_statistics.average_score.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                &gt;
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Course Section Detail Modal */}
      {ReactDOM.createPortal(
        <CourseSectionStatisticsDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCourseSection(null);
          }}
          data={selectedCourseSection}
        />,
        document.body)}
    </div>
  );
};

export default CourseSectionStatisticsChart;
