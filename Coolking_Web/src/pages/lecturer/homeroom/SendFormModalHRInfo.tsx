import React, { useState } from 'react';
import { useAlert } from '../../../hooks/useAlert';
import type { StudentInHomeroom } from '../../../hooks/useLecturer';

interface SendFormModalHRInfoProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string, type?: 'success' | 'error' | undefined) => void;
    student: StudentInHomeroom;
}

const SendFormModalHRInfo: React.FC<SendFormModalHRInfoProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    student 
}) => {
    const { sendAlertPersonal, loading } = useAlert();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [sendToStudents, setSendToStudents] = useState(false);
    const [sendToParents, setSendToParents] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || (!sendToStudents && !sendToParents) || !student) {
            return;
        }

        try {
            const receiversID: string[] = [];

            if (sendToStudents) {
                receiversID.push(student.student_id);
            }
            if (sendToParents && student.parent_id) {
                receiversID.push(student.parent_id);
            }

            if (receiversID.length === 0) {
                onSuccess('Không có người nhận hợp lệ', 'error');
                return;
            }

            const response = await sendAlertPersonal(title, content, receiversID);
            if (response?.success) {
                onSuccess('Gửi thông báo thành công!', 'success');
                handleClose();
            } else {
                onSuccess('Có lỗi xảy ra khi gửi thông báo', 'error');
            }
        } catch (error) {
            onSuccess('Có lỗi xảy ra khi gửi thông báo', 'error');
        }
    };

    const handleClose = () => {
        setTitle('');
        setContent('');
        setSendToStudents(false);
        setSendToParents(false);
        onClose();
    };

    const hasValidParent = () => {
        return student && student.parent_id && student.parent_id.trim();
    };

    const isFormValid = () => {
        return title.trim() &&
            content.trim() &&
            (sendToStudents || sendToParents) &&
            student;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Gửi thông báo sinh viên</h2>
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
                    {/* Student Info */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thông tin sinh viên
                        </label>
                        <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm md:text-base font-medium text-gray-800">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-gray-600">MSSV:</span> {student?.student_id}
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Tên:</span> {student?.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recipients Info */}
                    <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Thông tin người nhận</h4>
                        {student ? (
                            <div className="text-xs md:text-sm text-blue-700 space-y-1">
                                <p>Có thể gửi thông báo đến:</p>
                                <ul className="ml-4 space-y-1">
                                    <li>• Sinh viên: {student.name} ({student.student_id})</li>
                                    {hasValidParent() && (
                                        <li>• Phụ huynh: {student.parentName} ({student.parent_id})</li>
                                    )}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-xs md:text-sm text-red-600">
                                Không có thông tin sinh viên
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
                                    disabled={loading || !student}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                />
                                <label htmlFor="sendToStudents" className="ml-2 text-sm text-gray-700 leading-5">
                                    Gửi cho sinh viên
                                    {student && (
                                        <span className="text-gray-500 ml-1 block sm:inline">({student.name})</span>
                                    )}
                                </label>
                            </div>
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="sendToParents"
                                    checked={sendToParents}
                                    onChange={(e) => setSendToParents(e.target.checked)}
                                    disabled={loading || !hasValidParent()}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                />
                                <label htmlFor="sendToParents" className="ml-2 text-sm text-gray-700 leading-5">
                                    Gửi cho phụ huynh
                                    {student && (
                                        <span className={`ml-1 block sm:inline ${!hasValidParent() ? 'text-red-500' : 'text-gray-500'}`}>
                                            ({hasValidParent() ? student.parentName : 'Không có thông tin phụ huynh'})
                                        </span>
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

export default SendFormModalHRInfo;
