import React, { useState } from 'react';
import { useChat, type Chat, type Student, type Lecturer } from '../../../hooks/useChat';

interface UpdateGrchatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  chat: Chat | null;
}

const UpdateGrchatModal: React.FC<UpdateGrchatModalProps> = ({ isOpen, onClose, onSuccess, chat }) => {
  const { addMembers2GroupChat, getStudentInfo, getLecturerInfo, loading } = useChat();
  const [lecturerSearchId, setLecturerSearchId] = useState('');
  const [studentSearchId, setStudentSearchId] = useState('');
  const [selectedLecturers, setSelectedLecturers] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchedLecturer, setSearchedLecturer] = useState<Lecturer | null>(null);
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearchLecturer = async () => {
    if (!lecturerSearchId.trim()) return;
    
    try {
      setSearching(true);
      setError('');
      const lecturer = await getLecturerInfo(lecturerSearchId.trim());
      setSearchedLecturer(lecturer);
      if (!lecturer) {
        setError('Không tìm thấy giảng viên với ID này.');
      }
    } catch (error) {
      setError('Có lỗi khi tìm kiếm giảng viên.');
      setSearchedLecturer(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchStudent = async () => {
    if (!studentSearchId.trim()) return;
    
    try {
      setSearching(true);
      setError('');
      const student = await getStudentInfo(studentSearchId.trim());
      setSearchedStudent(student);
      if (!student) {
        setError('Không tìm thấy sinh viên với ID này.');
      }
    } catch (error) {
      setError('Có lỗi khi tìm kiếm sinh viên.');
      setSearchedStudent(null);
    } finally {
      setSearching(false);
    }
  };

  const handleAddLecturer = (lecturerId: string) => {
    if (!selectedLecturers.includes(lecturerId)) {
      setSelectedLecturers([...selectedLecturers, lecturerId]);
    }
    setLecturerSearchId('');
    setSearchedLecturer(null);
  };

  const handleAddStudent = (studentId: string) => {
    if (!selectedStudents.includes(studentId)) {
      setSelectedStudents([...selectedStudents, studentId]);
    }
    setStudentSearchId('');
    setSearchedStudent(null);
  };

  const handleRemoveLecturer = (lecturerId: string) => {
    setSelectedLecturers(selectedLecturers.filter(id => id !== lecturerId));
  };

  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents(selectedStudents.filter(id => id !== studentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chat) return;
    
    if (selectedLecturers.length === 0 && selectedStudents.length === 0) {
      setError('Vui lòng chọn ít nhất một thành viên để thêm.');
      return;
    }

    try {
      setError('');
      const result = await addMembers2GroupChat(chat._id, '', selectedStudents, selectedLecturers);
      
      if (result && result.success) {
        onSuccess(result.message || 'Đã cập nhật nhóm chat thành công!');
        handleClose();
      } else {
        setError('Có lỗi xảy ra khi cập nhật nhóm chat.');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi cập nhật nhóm chat.');
      console.error('Error updating group chat:', error);
    }
  };

  const handleClose = () => {
    setLecturerSearchId('');
    setStudentSearchId('');
    setSelectedLecturers([]);
    setSelectedStudents([]);
    setSearchedLecturer(null);
    setSearchedStudent(null);
    setError('');
    onClose();
  };

  if (!isOpen || !chat) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thêm thành viên nhóm chat: {chat.name}
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Lecturer Search Section */}
          <div className="mb-6">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={lecturerSearchId}
                onChange={(e) => setLecturerSearchId(e.target.value)}
                placeholder="Nhập ID giảng viên để tìm kiếm..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={loading || searching}
                onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <button
                type="button"
                onClick={handleSearchLecturer}
                disabled={loading || searching || !lecturerSearchId.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
              >
                {searching ? 'Tìm...' : 'Tìm GV'}
              </button>
            </div>

            {/* Searched Lecturer Result */}
            {searchedLecturer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{searchedLecturer.name}</p>
                    <p className="text-sm text-gray-600">ID: {searchedLecturer.lecturer_id}</p>
                    <p className="text-sm text-gray-600">Email: {searchedLecturer.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddLecturer(searchedLecturer.lecturer_id)}
                    disabled={selectedLecturers.includes(searchedLecturer.lecturer_id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors duration-200"
                  >
                    {selectedLecturers.includes(searchedLecturer.lecturer_id) ? 'Đã thêm' : 'Thêm'}
                  </button>
                </div>
              </div>
            )}

            {/* Selected Lecturers */}
            {selectedLecturers.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Giảng viên đã chọn:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLecturers.map((lecturerId) => (
                    <div key={lecturerId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <span>{lecturerId}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLecturer(lecturerId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Search Section */}
          <div className="mb-6">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={studentSearchId}
                onChange={(e) => setStudentSearchId(e.target.value)}
                placeholder="Nhập ID sinh viên để tìm kiếm..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={loading || searching}
                onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <button
                type="button"
                onClick={handleSearchStudent}
                disabled={loading || searching || !studentSearchId.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
              >
                {searching ? 'Tìm...' : 'Tìm SV'}
              </button>
            </div>

            {/* Searched Student Result */}
            {searchedStudent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{searchedStudent.name}</p>
                    <p className="text-sm text-gray-600">ID: {searchedStudent.student_id}</p>
                    <p className="text-sm text-gray-600">Lớp: {searchedStudent.className}</p>
                    <p className="text-sm text-gray-600">Email: {searchedStudent.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStudent(searchedStudent.student_id)}
                    disabled={selectedStudents.includes(searchedStudent.student_id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors duration-200"
                  >
                    {selectedStudents.includes(searchedStudent.student_id) ? 'Đã thêm' : 'Thêm'}
                  </button>
                </div>
              </div>
            )}

            {/* Selected Students */}
            {selectedStudents.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Sinh viên đã chọn:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map((studentId) => (
                    <div key={studentId} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <span>{studentId}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(studentId)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || (selectedLecturers.length === 0 && selectedStudents.length === 0)}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{loading ? 'Đang cập nhật...' : 'Thêm'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateGrchatModal;
