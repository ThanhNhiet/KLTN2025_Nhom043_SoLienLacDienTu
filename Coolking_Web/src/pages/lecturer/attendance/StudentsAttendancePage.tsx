import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAttendance, type Attendance } from '../../../hooks/useAttendance';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';
import CreateAttendanceModal from './CreateAttendanceModal';
import ConfirmationModal from './ConfirmationModal';

interface StudentAttendanceRecord {
  student_id: string;
  status: string;
  description: string;
}

const StudentsAttendancePage: React.FC = () => {
  const { course_section_id } = useParams<{ course_section_id: string }>();
  const { loading, error, attendanceData, getStudentsWithAttendance, recordAttendance, updateAttendance, deleteAttendance } = useAttendance();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingAttendance, setIsCreatingAttendance] = useState(false);
  const [selectedAttendanceForUpdate, setSelectedAttendanceForUpdate] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<{ studentId: string, attendanceId: string } | null>(null);
  
  // For creating new attendance
  const [newAttendanceData, setNewAttendanceData] = useState<{
    date: string;
    startLesson: number;
    endLesson: number;
  } | null>(null);
  
  const [newStudentsAttendance, setNewStudentsAttendance] = useState<StudentAttendanceRecord[]>([]);
  const [newUpdateStudentsAttendance, setNewUpdateStudentsAttendance] = useState<StudentAttendanceRecord[]>([]);
  
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

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger';
    confirmText?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    if (course_section_id) {
      getStudentsWithAttendance(course_section_id);
    }
  }, [course_section_id, getStudentsWithAttendance]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('.action-dropdown')) {
        setShowActionMenu(null);
      }
      
      if (!target.closest('.tooltip-container')) {
        setShowTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (dateString: string) => {
    // Convert dd-MM-yyyy to dd/M/yyyy
    return dateString.replace(/-/g, '/').replace(/^0(\d)\//, '$1/').replace(/\/0(\d)\//, '/$1/');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleCreateAttendance = (startLesson: number, endLesson: number) => {
    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    
    setNewAttendanceData({
      date: formattedDate,
      startLesson,
      endLesson
    });
    
    // Initialize students attendance with empty status
    // Use fallback to attendanceData.students if attendances array is empty
    const studentList = attendanceData?.attendances[0]?.students || attendanceData?.students || [];
    if (studentList.length > 0) {
      const initialData = studentList.map(student => ({
        student_id: student.student_id,
        status: '',
        description: ''
      }));
      setNewStudentsAttendance(initialData);
    }
    
    setIsCreatingAttendance(true);
    setShowCreateModal(false);
  };

  const handleCancelCreate = () => {
    setIsCreatingAttendance(false);
    setNewAttendanceData(null);
    setNewStudentsAttendance([]);
  };

  const handleStatusChange = (studentId: string, status: string, isUpdate = false) => {
    if (isUpdate) {
      setNewUpdateStudentsAttendance(prev =>
        prev.map(student =>
          student.student_id === studentId
            ? { ...student, status }
            : student
        )
      );
    } else {
      setNewStudentsAttendance(prev =>
        prev.map(student =>
          student.student_id === studentId
            ? { ...student, status }
            : student
        )
      );
    }
  };

  const handleDescriptionChange = (studentId: string, description: string, isUpdate = false) => {
    if (isUpdate) {
      setNewUpdateStudentsAttendance(prev =>
        prev.map(student =>
          student.student_id === studentId
            ? { ...student, description }
            : student
        )
      );
    } else {
      setNewStudentsAttendance(prev =>
        prev.map(student =>
          student.student_id === studentId
            ? { ...student, description }
            : student
        )
      );
    }
  };

  const handleSaveWithDefaults = async () => {
    if (!course_section_id || !newAttendanceData) return;
    
    // Set empty statuses to ABSENT
    const finalData = newStudentsAttendance.map(student => ({
      ...student,
      status: student.status || 'ABSENT'
    }));
    
    try {
      await recordAttendance(
        course_section_id,
        newAttendanceData.startLesson,
        newAttendanceData.endLesson,
        finalData
      );
      
      // Refresh data and reset form
      getStudentsWithAttendance(course_section_id);
      handleCancelCreate();
      showToast('Lưu kết quả điểm danh thành công!', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi lưu điểm danh!', 'error');
    }
  };

  const handleSaveAttendance = async () => {
    if (!course_section_id || !newAttendanceData) return;

    const emptyStatuses = newStudentsAttendance.filter(student => !student.status);
    
    if (emptyStatuses.length > 0) {
      setConfirmModal({
        show: true,
        title: 'Xác nhận lưu điểm danh',
        message: 'Một số sinh viên chưa được đánh dấu, có muốn lưu?\n\nChọn "Lưu tất cả" để lưu tất cả mặc định là vắng\nChọn "Hủy" để quay lại đánh dấu',
        confirmText: 'Lưu tất cả',
        type: 'warning',
        onConfirm: () => handleSaveWithDefaults()
      });
      return;
    }
    
    // If all students have status, save directly
    if (!course_section_id || !newAttendanceData) return;
    
    try {
      await recordAttendance(
        course_section_id,
        newAttendanceData.startLesson,
        newAttendanceData.endLesson,
        newStudentsAttendance
      );
      
      // Refresh data and reset form
      getStudentsWithAttendance(course_section_id);
      handleCancelCreate();
      showToast('Lưu kết quả điểm danh thành công!', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi lưu điểm danh!', 'error');
    }
  };

  const handleUpdateAttendance = async (attendance: Attendance) => {
    // Load existing data for update
    const existingData = attendance.students.map(student => ({
      student_id: student.student_id,
      status: student.status,
      description: student.description || '' // Ensure description is never undefined
    }));
    
    setNewUpdateStudentsAttendance(existingData);
    setSelectedAttendanceForUpdate(attendance.attendance_id);
  };

  const handleSaveUpdateAttendance = async (attendance: Attendance) => {
    try {
      await updateAttendance(
        attendance.attendance_id,
        attendance.start_lesson,
        attendance.end_lesson,
        newUpdateStudentsAttendance
      );
      
      // Refresh data and reset form
      getStudentsWithAttendance(course_section_id!);
      setSelectedAttendanceForUpdate(null);
      setNewUpdateStudentsAttendance([]);
      showToast('Cập nhật điểm danh thành công!', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi cập nhật điểm danh!', 'error');
    }
  };

  const handleDeleteAttendance = (attendanceId: string) => {
    setConfirmModal({
      show: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa buổi điểm danh này?\n\nHành động này không thể hoàn tác.',
      confirmText: 'Xóa',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteAttendance(attendanceId);
          getStudentsWithAttendance(course_section_id!);
          showToast('Xóa buổi điểm danh thành công!', 'success');
        } catch (error) {
          showToast('Có lỗi xảy ra khi xóa điểm danh!', 'error');
        }
      }
    });
  };

  const getStatusOptions = () => [
    { value: 'PRESENT', label: 'Có mặt' },
    { value: 'ABSENT', label: 'Vắng' },
    { value: 'EXCUSED', label: 'Vắng có phép' },
    { value: 'LATE', label: 'Trễ' }
  ];

  const getStatusLabel = (status: string) => {
    const option = getStatusOptions().find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'PRESENT':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'ABSENT':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'EXCUSED':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'LATE':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
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

  if (!attendanceData) {
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

  // Get unique students list from first attendance or create from available data
  const allStudents = attendanceData.attendances[0]?.students || attendanceData.students || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderLeCpn />
      
      <main className="flex-1 max-w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header with Course Section Info */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Danh sách sinh viên và điểm danh
              </h1>
              
              <div className="flex gap-3">
                {!isCreatingAttendance ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Tạo buổi điểm danh
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveAttendance}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Lưu kết quả điểm danh
                    </button>
                    <button
                      onClick={handleCancelCreate}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Course Section Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50 rounded-lg p-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Mã lớp học phần:</span>
                <div className="text-base font-semibold text-blue-800">{attendanceData.course_section_id}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Môn học:</span>
                <div className="text-base font-semibold text-gray-800">{attendanceData.subjectName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Lớp danh nghĩa:</span>
                <div className="text-base font-semibold text-gray-800">{attendanceData.className}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Học kỳ:</span>
                <div className="text-base font-semibold text-gray-800">{attendanceData.sessionName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Khoa:</span>
                <div className="text-base font-semibold text-gray-800">{attendanceData.facultyName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Giảng viên phụ trách:</span>
                <div className="text-base font-semibold text-gray-800">{attendanceData.lecturerName}</div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">MSSV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-28 bg-gray-50 z-10">Họ tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giới tính</th>
                  
                  {/* Existing attendance columns */}
                  {attendanceData.attendances.map((attendance) => (
                    <th key={attendance.attendance_id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>
                          {formatDate(attendance.date_attendance)} Tiết {attendance.start_lesson} - {attendance.end_lesson}
                        </span>
                        {!isCreatingAttendance && (
                          <div className="relative action-dropdown">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === attendance.attendance_id ? null : attendance.attendance_id)}
                              className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            
                            {showActionMenu === attendance.attendance_id && (
                              <div className="absolute right-0 top-8 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleUpdateAttendance(attendance);
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100"
                                  >
                                    Cập nhật
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteAttendance(attendance.attendance_id);
                                      setShowActionMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-sm text-gray-700"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  
                  {/* New attendance column when creating */}
                  {isCreatingAttendance && newAttendanceData && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>
                          {newAttendanceData.date} Tiết {newAttendanceData.startLesson} - {newAttendanceData.endLesson}
                        </span>
                        <button
                          onClick={handleCancelCreate}
                          className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4 + attendanceData.attendances.length + (isCreatingAttendance ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                      Không có sinh viên nào trong lớp học phần này
                    </td>
                  </tr>
                ) : (
                  allStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 sticky left-0 bg-white z-10">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-28 bg-white z-20">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(student.dob)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.gender ? 'Nam' : 'Nữ'}
                      </td>
                      
                      {/* Existing attendance columns */}
                      {attendanceData.attendances.map((attendance) => {
                        const studentAttendance = attendance.students.find(s => s.student_id === student.student_id);
                        const isUpdating = selectedAttendanceForUpdate === attendance.attendance_id;
                        const updateRecord = newUpdateStudentsAttendance.find(s => s.student_id === student.student_id);
                        
                        return (
                          <td key={attendance.attendance_id} className="px-4 py-4 whitespace-nowrap text-center">
                            {isUpdating ? (
                              <select
                                value={updateRecord?.status || studentAttendance?.status || ''}
                                onChange={(e) => handleStatusChange(student.student_id, e.target.value, true)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Chọn trạng thái</option>
                                {getStatusOptions().map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="tooltip-container relative">
                                <span
                                  className={`cursor-pointer ${getStatusBadge(studentAttendance?.status || '')}`}
                                  onMouseEnter={() => setShowTooltip({ studentId: student.student_id, attendanceId: attendance.attendance_id })}
                                  onMouseLeave={() => setShowTooltip(null)}
                                >
                                  {getStatusLabel(studentAttendance?.status || '')}
                                </span>
                                
                                {showTooltip?.studentId === student.student_id && showTooltip?.attendanceId === attendance.attendance_id && (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
                                    <div className="font-medium">Ghi chú:</div>
                                    <div>{studentAttendance?.description || 'Không có ghi chú'}</div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {isUpdating && (
                              <input
                                type="text"
                                placeholder="Ghi chú..."
                                value={updateRecord?.description || ''}
                                onChange={(e) => handleDescriptionChange(student.student_id, e.target.value, true)}
                                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            )}
                          </td>
                        );
                      })}
                      
                      {/* New attendance column when creating */}
                      {isCreatingAttendance && newAttendanceData && (
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <select
                            value={newStudentsAttendance.find(s => s.student_id === student.student_id)?.status || ''}
                            onChange={(e) => handleStatusChange(student.student_id, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Chọn trạng thái</option>
                            {getStatusOptions().map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Ghi chú..."
                            value={newStudentsAttendance.find(s => s.student_id === student.student_id)?.description || ''}
                            onChange={(e) => handleDescriptionChange(student.student_id, e.target.value)}
                            className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Update attendance actions */}
          {selectedAttendanceForUpdate && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    const attendance = attendanceData.attendances.find(a => a.attendance_id === selectedAttendanceForUpdate);
                    if (attendance) handleSaveUpdateAttendance(attendance);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => {
                    setSelectedAttendanceForUpdate(null);
                    setNewUpdateStudentsAttendance([]);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterLeCpn />

      {/* Create Attendance Modal */}
      {showCreateModal && (
        <CreateAttendanceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onConfirm={handleCreateAttendance}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
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

export default StudentsAttendancePage;
