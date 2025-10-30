import React, { useState } from 'react';
import { useStatistics } from '../../../hooks/useStatistics';
import LecturerStatisticsDetailModal from './LecturerStatisticsDetailModal';
import ReactDOM from 'react-dom';

interface LecturerData {
  lecturer_id: string;
  lecturer_name: string;
  total_course_sections: number;
  total_subjects: number;
  total_students: number;
  students_with_scores: number;
  students_passed: number;
  pass_rate: number;
  average_score: number;
  attendance_rate: number;
}

interface FacultySummary {
  total_course_sections: number;
  total_subjects: number;
  total_students: number;
  average_score: number;
  pass_rate: number;
  attendance_rate: number;
}

interface LecturerStatisticsData {
  faculty_id: string;
  faculty_name: string;
  session_name: string;
  total_lecturers: number;
  faculty_summary: FacultySummary;
  lecturers: LecturerData[];
}

interface Props {
  data: LecturerStatisticsData;
  sessionId: string;
}

const LecturerStatisticsChart: React.FC<Props> = ({ data, sessionId }) => {
  const { getLecturerStatistics } = useStatistics();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLecturerData, setSelectedLecturerData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const itemsPerPage = 10;

  // Safety check for data structure
  if (!data || !data.lecturers || !Array.isArray(data.lecturers)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dữ liệu không hợp lệ</h3>
          <p className="text-gray-500">Dữ liệu thống kê giảng viên không đúng định dạng. Vui lòng thử lại.</p>
        </div>
      </div>
    );
  }

  const {
    faculty_name,
    session_name,
    total_lecturers,
    faculty_summary,
    lecturers
  } = data;

  // Filter and sort lecturers
  const filteredLecturers = lecturers
    .filter(lecturer =>
      lecturer.lecturer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecturer.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by pass_rate descending, then by average_score descending
      if (b.pass_rate !== a.pass_rate) {
        return b.pass_rate - a.pass_rate;
      }
      return b.average_score - a.average_score;
    });

  // Pagination
  const totalPages = Math.ceil(filteredLecturers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLecturers = filteredLecturers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLecturerClick = async (lecturer: LecturerData) => {
    setLoadingDetail(true);
    try {
      const lecturerDetail = await getLecturerStatistics(lecturer.lecturer_id, sessionId);
      setSelectedLecturerData(lecturerDetail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching lecturer details:', error);
    }
    setLoadingDetail(false);
  };

  const summaryCards = [
    {
      label: 'Tổng lớp học phần',
      value: faculty_summary.total_course_sections,
      icon: '🏛️',
      color: 'bg-blue-500'
    },
    {
      label: 'Tổng môn học',
      value: faculty_summary.total_subjects,
      icon: '📚',
      color: 'bg-green-500'
    },
    {
      label: 'Tổng sinh viên',
      value: faculty_summary.total_students,
      icon: '👥',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Thống kê Giảng viên</h2>
        <p className="text-green-100">
          <span className="font-semibold">{faculty_name}</span> - {session_name}
        </p>
        <p className="text-green-100 mt-1">
          Tổng số giảng viên: <span className="font-semibold">{total_lecturers}</span>
        </p>
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

      {/* Lecturers Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Thống kê từng giảng viên trong học kỳ {session_name}
            </h3>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên giảng viên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <div className="text-sm text-gray-600">
              Tìm thấy: {filteredLecturers.length} / {lecturers.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã giảng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng môn học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng sinh viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sinh viên đậu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tỷ lệ đậu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tỷ lệ điểm danh có mặt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLecturers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy giảng viên nào phù hợp' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                paginatedLecturers.map((lecturer, index) => (
                  <tr
                    key={lecturer.lecturer_id}
                    onClick={() => handleLecturerClick(lecturer)}
                    className={`${(startIndex + index) % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-blue-50 cursor-pointer transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {lecturer.lecturer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lecturer.lecturer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lecturer.total_subjects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lecturer.total_students.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lecturer.students_passed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lecturer.pass_rate >= 80
                          ? 'bg-green-100 text-green-800'
                          : lecturer.pass_rate >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {lecturer.pass_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lecturer.attendance_rate >= 80
                          ? 'bg-green-100 text-green-800'
                          : lecturer.attendance_rate >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {lecturer.attendance_rate}%
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

      {/* Loading Modal Overlay */}
      {loadingDetail && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center">
              <svg className="animate-spin h-6 w-6 mr-3 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Đang tải thông tin chi tiết...</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lecturer Detail Modal */}
      {ReactDOM.createPortal(
        <LecturerStatisticsDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLecturerData(null);
          }}
          data={selectedLecturerData}
        />,
        document.body)}
    </div>
  );
};

export default LecturerStatisticsChart;
