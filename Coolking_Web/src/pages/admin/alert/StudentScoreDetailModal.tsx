import React, { useState, useEffect } from 'react';
import { useStudent } from '../../../hooks/useStudent';

interface StudentScoreDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

const StudentScoreDetailModal: React.FC<StudentScoreDetailModalProps> = ({
    isOpen,
    onClose,
    studentId,
    studentName
}) => {
    const { loading, error, studentScores, getStudentScores } = useStudent();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');

    useEffect(() => {
        if (isOpen && studentId) {
            getStudentScores(studentId);
        }
    }, [isOpen, studentId, getStudentScores]);

    if (!isOpen) return null;

    // Lấy tất cả học kỳ có sẵn
    const availableSemesters = studentScores ? studentScores.map(score => `${score.semester} ${score.academic_year}`) : [];
    const uniqueSemesters = [...new Set(availableSemesters)];

    // Lấy tất cả môn học từ tất cả học kỳ hoặc từ học kỳ được chọn
    const allSubjectsWithSemester = studentScores ? studentScores.flatMap(scoreData => 
        scoreData.subjects.map(subject => ({
            ...subject,
            semester: scoreData.semester,
            academic_year: scoreData.academic_year,
            semesterDisplay: `${scoreData.semester} ${scoreData.academic_year}`,
            gpa: scoreData.gpa
        }))
    ) : [];

    // Lọc theo học kỳ được chọn
    const subjectsBySemester = selectedSemester === 'all' ? 
        allSubjectsWithSemester : 
        allSubjectsWithSemester.filter(subject => subject.semesterDisplay === selectedSemester);

    // Lọc theo từ khóa tìm kiếm
    const filteredSubjects = subjectsBySemester.filter(subject =>
        subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Điểm số từng môn</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Sinh viên: <span className="font-medium">{studentName} ({studentId})</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center">
                                <svg className="animate-spin h-8 w-8 mr-3 text-blue-600" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-lg font-medium text-gray-700">Đang tải...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-600">
                                <div className="text-lg font-medium mb-2">Lỗi</div>
                                <div>{error}</div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Search and Filter */}
                            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                                <div className="relative max-w-lg flex-1 ">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm kiếm theo tên môn học..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div className="max-w-xs">
                                    <select
                                        value={selectedSemester}
                                        onChange={(e) => setSelectedSemester(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                    >
                                        <option value="all">Tất cả học kỳ</option>
                                        {uniqueSemesters.map((semester) => (
                                            <option key={semester} value={semester}>
                                                {semester}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* GPA Summary */}
                            {filteredSubjects.length > 0 && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                    {selectedSemester !== 'all' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">Học kỳ</div>
                                                <div className="text-lg font-bold text-blue-600">{selectedSemester}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">Tổng số môn</div>
                                                <div className="text-lg font-bold text-blue-600">{filteredSubjects.length}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">GPA Học Kỳ</div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    {filteredSubjects[0]?.gpa || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">Tổng học kỳ</div>
                                                <div className="text-lg font-bold text-blue-600">{uniqueSemesters.length}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">Tổng số môn</div>
                                                <div className="text-lg font-bold text-blue-600">{filteredSubjects.length}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-600">GPA Tích Lũy</div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    {studentScores && studentScores.length > 0 ? 
                                                        (() => {
                                                            const totalWeightedGPA = studentScores.reduce((sum, score) => 
                                                                sum + (parseFloat(score.gpa) * score.total_credits), 0
                                                            );
                                                            const totalCredits = studentScores.reduce((sum, score) => 
                                                                sum + score.total_credits, 0
                                                            );
                                                            return totalCredits > 0 ? (totalWeightedGPA / totalCredits).toFixed(2) : 'N/A';
                                                        })() : 
                                                        'N/A'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scores Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học kỳ</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn học</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tín chí</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">LT1</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">LT2</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">LT3</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TH1</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TH2</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">TH3</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Giữa kỳ</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cuối kỳ</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trung bình</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Điểm chữ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSubjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
                                                    {searchTerm ? 'Không tìm thấy môn học nào phù hợp' : 'Không có dữ liệu điểm số'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSubjects.map((subject, index) => (
                                                <tr key={`${subject.semesterDisplay}-${subject.subject_name}-${index}`} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{subject.semesterDisplay}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.subject_name}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.credits}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.theo_regular1 || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.theo_regular2 || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.theo_regular3 || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.pra_regular1 || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.pra_regular2 || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.pra_regular3 || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.midterm || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{subject.final || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900 font-semibold">{subject.average || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900 font-semibold">{subject.grade_point || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentScoreDetailModal;