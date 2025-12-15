import React, { useState, useEffect } from 'react';
import { useLecturer, type StudentInHomeroom } from '../../../hooks/useLecturer';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';
import SendFormModalHR from './SendFormModalHR';
import HomeroomStudentInfo from './HomeroomStudentInfo';

const HomeroomStudentsPage: React.FC = () => {
  const { loading, error, homeroomData, getHomeroomData } = useLecturer();
  const [selectedStudent, setSelectedStudent] = useState<StudentInHomeroom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  
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
    getHomeroomData();
  }, [getHomeroomData]);

  const handleStudentClick = (student: StudentInHomeroom) => {
    setSelectedStudent(student);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setCurrentView('list');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
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

  const getExpelStatus = (gotExpelAlertYet: boolean) => {
    return gotExpelAlertYet ? (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        Đã gửi
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Không có
      </span>
    );
  };

  const getWarningBadge = (totalWarnings: number) => {
    if (totalWarnings === 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          {totalWarnings}
        </span>
      );
    } else if (totalWarnings <= 2) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          {totalWarnings}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          {totalWarnings}
        </span>
      );
    }
  };

  // Filter students by search term (MSSV)
  const filteredStudents = homeroomData?.students.filter(student => 
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  if (!homeroomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderLeCpn />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-600">
            Bạn chưa được phân công làm chủ nhiệm lớp nào
          </div>
        </main>
        <FooterLeCpn />
      </div>
    );
  }

  // Show student detail view if a student is selected
  if (currentView === 'detail' && selectedStudent) {
    return <HomeroomStudentInfo student={selectedStudent} onBack={handleBackToList} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderLeCpn />
      
      <main className="flex-1 max-w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header with Homeroom Info */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Danh sách sinh viên lớp chủ nhiệm
              </h1>
              
              <div className="flex gap-3 items-center">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo MSSV..."
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowSendModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Gửi thông báo
                </button>
              </div>
            </div>
            
            {/* Homeroom Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50 rounded-lg p-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Lớp chủ nhiệm:</span>
                <div className="text-base font-semibold text-blue-800">{homeroomData.homeroomInfo.homeroomClassName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Tên GV chủ nhiệm:</span>
                <div className="text-base font-semibold text-gray-800">{homeroomData.homeroomInfo.name}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Thuộc khoa:</span>
                <div className="text-base font-semibold text-gray-800">{homeroomData.homeroomInfo.facultyName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <div className="text-base font-semibold text-gray-800">{homeroomData.homeroomInfo.email}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">SĐT:</span>
                <div className="text-base font-semibold text-gray-800">{homeroomData.homeroomInfo.phone}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Tổng số sinh viên:</span>
                <div className="text-base font-semibold text-gray-800">
                  {searchTerm ? `${filteredStudents.length} / ${homeroomData.students.length}` : homeroomData.students.length}
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">MSSV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-28 bg-gray-50 z-10">Họ tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Giới tính</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lần cảnh báo học vụ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Buộc thôi học</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'Không tìm thấy sinh viên nào phù hợp' : 'Không có sinh viên nào trong lớp chủ nhiệm này'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr 
                      key={student.student_id} 
                      onClick={() => handleStudentClick(student)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 sticky left-0 bg-white z-10">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-28 bg-white z-20">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(student.dob)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {formatGender(student.gender)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.phone}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {student.address}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {getWarningBadge(student.totalWarnings)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {getExpelStatus(student.gotExpelAlertYet)}
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

      {/* Send Form Modal */}
      {homeroomData && (
        <SendFormModalHR
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSuccess={(message) => {
            setShowSendModal(false);
            showToast(message, 'success');
          }}
          homeroomClassName={homeroomData.homeroomInfo.homeroomClassName}
          students={homeroomData.students}
        />
      )}
    </div>
  );
};

export default HomeroomStudentsPage;
