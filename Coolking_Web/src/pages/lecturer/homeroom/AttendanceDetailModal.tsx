import React from 'react';
import type { HomeroomStudentCourseSection, StudentAttendanceByCSID_SJID4Lecturer } from '../../../hooks/useStudent';

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseSection: HomeroomStudentCourseSection;
  attendanceData: StudentAttendanceByCSID_SJID4Lecturer | null;
  loading: boolean;
}

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  courseSection,
  attendanceData,
  loading
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return dateString.replace(/-/g, '/');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Có mặt
          </span>
        );
      case 'ABSENT':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Vắng mặt
          </span>
        );
      case 'LATE':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Trễ
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getAttendanceRateColor = (rate: string) => {
    const percentage = parseFloat(rate.replace('%', ''));
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl leading-6 font-bold text-gray-900">
                  Chi tiết điểm danh - {courseSection.subjectName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Lớp: {courseSection.className} | Học kỳ: {courseSection.sessionName}
                </p>
                <p className="text-sm text-gray-600">
                  Giảng viên: {courseSection.lecturerName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center">
                  <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-lg font-medium text-gray-700">Đang tải...</span>
                </div>
              </div>
            ) : attendanceData ? (
              <div>
                {/* Statistics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600">Tổng số buổi</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {attendanceData.statistics.total_sessions}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600">Có mặt</div>
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceData.statistics.present}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600">Vắng mặt</div>
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceData.statistics.absent}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600">Trễ</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendanceData.statistics.late}
                    </div>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Tỷ lệ điểm danh:</span>
                    <span className={`text-2xl font-bold ${getAttendanceRateColor(attendanceData.statistics.attendance_rate)}`}>
                      {attendanceData.statistics.attendance_rate}
                    </span>
                  </div>
                </div>

                {/* Attendance Details Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiết học</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceData.attendance_details.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Không có dữ liệu điểm danh
                          </td>
                        </tr>
                      ) : (
                        attendanceData.attendance_details.map((detail, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(detail.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              Tiết {detail.start_lesson} - {detail.end_lesson}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {detail.session}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getStatusBadge(detail.status)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {detail.description || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">Không có dữ liệu điểm danh</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailModal;
