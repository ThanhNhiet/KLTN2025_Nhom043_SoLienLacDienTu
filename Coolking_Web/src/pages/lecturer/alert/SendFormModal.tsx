import React, { useState, useEffect } from 'react';
import { useAlert } from '../../../hooks/useAlert';

interface SendFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    subjectName?: string;
    courseSectionId?: string;
}

interface StudentParent {
    student_id: string;
    parent_id: string;
}

const SendFormModal: React.FC<SendFormModalProps> = ({ isOpen, onClose, onSuccess, subjectName, courseSectionId }) => {
    const { sendAlertPersonal, getStudentsAndParentsByCourseSection, loading } = useAlert();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [sendToStudents, setSendToStudents] = useState(false);
    const [sendToParents, setSendToParents] = useState(false);
    const [studentsAndParents, setStudentsAndParents] = useState<StudentParent[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (isOpen && courseSectionId) {
            loadStudentsAndParents();
        }
    }, [isOpen, courseSectionId]);

    const loadStudentsAndParents = async () => {
        if (!courseSectionId) return;
        
        setIsLoadingData(true);
        try {
            const response = await getStudentsAndParentsByCourseSection(courseSectionId);
            if (response?.success) {
                setStudentsAndParents(response.data || []);
            }
        } catch (error) {
            console.error('Error loading students and parents:', error);
            setStudentsAndParents([]);
        } finally {
            setIsLoadingData(false);
        }
    };



    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || (!sendToStudents && !sendToParents) || !courseSectionId) {
            return;
        }

        try {
            const receiversID: string[] = [];

            studentsAndParents.forEach(item => {
                if (sendToStudents) {
                    receiversID.push(item.student_id);
                }
                if (sendToParents) {
                    receiversID.push(item.parent_id);
                }
            });

            const response = await sendAlertPersonal(title, content, receiversID);
            if (response?.success) {
                onSuccess('Gửi thông báo thành công!');
                handleClose();
            } else {
                onSuccess('Có lỗi xảy ra khi gửi thông báo');
            }
        } catch (error) {
            onSuccess('Có lỗi xảy ra khi gửi thông báo');
        }
    };

    const handleClose = () => {
        setTitle('');
        setContent('');
        setSendToStudents(false);
        setSendToParents(false);
        setStudentsAndParents([]);
        setIsLoadingData(false);
        onClose();
    };

    const isFormValid = () => {
        return title.trim() &&
            content.trim() &&
            (sendToStudents || sendToParents) &&
            courseSectionId &&
            studentsAndParents.length > 0 &&
            !isLoadingData;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Gửi thông báo</h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-140px)] md:max-h-[calc(90vh-140px)]">
                    {/* Course Section Info */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lớp học phần
                        </label>
                        <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm md:text-base font-medium text-gray-800">
                                {courseSectionId || 'Chưa có thông tin lớp học phần'}
                            </div>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Môn học
                        </label>
                        <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm md:text-base font-medium text-gray-800">
                                {subjectName || 'Chưa có thông tin môn học'}
                            </div>
                        </div>
                    </div>

                    {/* Recipients Info */}
                    <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Thông tin người nhận</h4>
                        {isLoadingData ? (
                            <div className="flex items-center text-xs md:text-sm text-blue-700">
                                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang lấy danh sách sinh viên và phụ huynh...
                            </div>
                        ) : studentsAndParents.length > 0 ? (
                            <p className="text-xs md:text-sm text-blue-700">
                                Lớp có {studentsAndParents.length} sinh viên và {studentsAndParents.length} phụ huynh
                            </p>
                        ) : (
                            <p className="text-xs md:text-sm text-red-600">
                                Không tìm thấy dữ liệu sinh viên và phụ huynh
                            </p>
                        )}
                    </div>

                    {/* Title Input */}
                    <div className="mb-4 md:mb-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm md:text-base"
                            placeholder="Nhập tiêu đề thông báo"
                        />
                    </div>

                    {/* Content Textarea */}
                    <div className="mb-4 md:mb-6">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                            Nội dung <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="content"
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm md:text-base md:rows-8"
                            placeholder="Nhập nội dung thông báo"
                        />
                    </div>

                    {/* Recipient Checkboxes */}
                    <div className="mb-4 md:mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Người nhận <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="sendToStudents"
                                    checked={sendToStudents}
                                    onChange={(e) => setSendToStudents(e.target.checked)}
                                    disabled={loading || isLoadingData || !courseSectionId}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                />
                                <label htmlFor="sendToStudents" className="ml-2 text-sm text-gray-700 leading-5">
                                    Gửi cho sinh viên
                                    {!isLoadingData && courseSectionId && studentsAndParents.length > 0 && (
                                        <span className="text-gray-500 ml-1 block sm:inline">({studentsAndParents.length} sinh viên)</span>
                                    )}
                                </label>
                            </div>
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="sendToParents"
                                    checked={sendToParents}
                                    onChange={(e) => setSendToParents(e.target.checked)}
                                    disabled={loading || isLoadingData || !courseSectionId}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                />
                                <label htmlFor="sendToParents" className="ml-2 text-sm text-gray-700 leading-5">
                                    Gửi cho phụ huynh
                                    {!isLoadingData && courseSectionId && studentsAndParents.length > 0 && (
                                        <span className="text-gray-500 ml-1 block sm:inline">({studentsAndParents.length} phụ huynh)</span>
                                    )}
                                </label>
                            </div>
                        </div>
                        {!sendToStudents && !sendToParents && (
                            <p className="text-xs md:text-sm text-red-500 mt-2">Vui lòng chọn ít nhất một đối tượng nhận thông báo</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0 p-4 md:p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base order-2 sm:order-1"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isFormValid()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base order-1 sm:order-2"
                    >
                        {loading && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {loading ? 'Đang gửi...' : 'Gửi thông báo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendFormModal;
