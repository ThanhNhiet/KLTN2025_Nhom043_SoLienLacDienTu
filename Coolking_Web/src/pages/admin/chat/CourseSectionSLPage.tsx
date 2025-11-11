import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat, type CourseSection } from '../../../hooks/useChat';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';

const CourseSectionSLPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseSections, loading, error, currentPage, pageSize, pages, getNonChatCourseSections, searchNonChatCourseSections, createGroupChat } = useChat();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCourseSection, setSelectedCourseSection] = useState<CourseSection | null>(null);
  const [groupNameToCreate, setGroupNameToCreate] = useState('');

  useEffect(() => {
    getNonChatCourseSections(1, 10);
  }, [getNonChatCourseSections]);

  const handleSearch = async () => {
    if (searchKeyword.trim()) {
      await searchNonChatCourseSections(searchKeyword, 1, pageSize);
    } else {
      getNonChatCourseSections(1, pageSize);
    }
  };

  const handlePageChange = (page: number) => {
    if (searchKeyword.trim()) {
      searchNonChatCourseSections(searchKeyword, page, pageSize);
    } else {
      getNonChatCourseSections(page, pageSize);
    }
  };

  const handleShowConfirmCreate = (courseSection: CourseSection) => {
    // Tạo tên nhóm theo format: sessionName_subjectName_className_Tiết start_lesson-end_lesson
    const sessionName = courseSection.sessionName;
    const subjectName = courseSection.subjectName;
    const className = courseSection.className;
    const startLesson = courseSection.start_lesson || 'N/A';
    const endLesson = courseSection.end_lesson || 'N/A';
    
    const nameGroup = `${sessionName}_${subjectName}_${className}_Tiết ${startLesson}-${endLesson}`;
    
    setSelectedCourseSection(courseSection);
    setGroupNameToCreate(nameGroup);
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    if (!selectedCourseSection) return;
    
    try {
      setCreatingChat(selectedCourseSection.course_section_id);
      setShowConfirmModal(false);
      
      const result = await createGroupChat(selectedCourseSection.course_section_id, groupNameToCreate);
      
      if (result && result.success) {
        setSuccessMessage(result.message || 'Đã tạo nhóm chat thành công!');
        setShowSuccessNotification(true);
        
        // Refresh the course sections list
        if (searchKeyword.trim()) {
          await searchNonChatCourseSections(searchKeyword, currentPage, pageSize);
        } else {
          await getNonChatCourseSections(currentPage, pageSize);
        }
        
        // Auto hide success notification after 3 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
    } finally {
      setCreatingChat(null);
      setSelectedCourseSection(null);
      setGroupNameToCreate('');
    }
  };

  const handleCancelCreate = () => {
    setShowConfirmModal(false);
    setSelectedCourseSection(null);
    setGroupNameToCreate('');
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdCpn />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Lớp học phần chưa có chat</h1>
              <button
                onClick={() => navigate('/admin/chats-management')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Quay lại</span>
              </button>
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-3 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm theo môn học, lớp, học kỳ..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã lớp học phần</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Học kỳ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảng viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiết học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày cập nhật</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-red-500">
                      Lỗi: {error}
                    </td>
                  </tr>
                ) : courseSections.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  courseSections.map((cs, index) => (
                    <tr key={cs.course_section_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {cs.course_section_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cs.subjectName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.facultyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.sessionName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.lecturerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.start_lesson && cs.end_lesson ? `${cs.start_lesson} - ${cs.end_lesson}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cs.updatedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleShowConfirmCreate(cs)}
                          disabled={creatingChat === cs.course_section_id}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                        >
                          {creatingChat === cs.course_section_id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Đang tạo...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" />
                              </svg>
                              <span>Tạo nhóm chat</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &lt;
                </button>
                
                {pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pages[pages.length - 1]}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  &gt;
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      <FooterAdCpn />

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded shadow-md flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="ml-2 hover:bg-green-600 rounded p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCourseSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận tạo nhóm chat
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn tạo nhóm chat cho lớp học phần này không?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p><span className="font-medium">Môn học:</span> {selectedCourseSection.subjectName}</p>
                <p><span className="font-medium">Lớp:</span> {selectedCourseSection.className}</p>
                <p><span className="font-medium">Học kỳ:</span> {selectedCourseSection.sessionName}</p>
                <p><span className="font-medium">Tên nhóm:</span> {groupNameToCreate}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelCreate}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
                disabled={creatingChat === selectedCourseSection.course_section_id}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmCreate}
                disabled={creatingChat === selectedCourseSection.course_section_id}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {creatingChat === selectedCourseSection.course_section_id && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{creatingChat === selectedCourseSection.course_section_id ? 'Đang tạo...' : 'Tạo nhóm chat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSectionSLPage;
