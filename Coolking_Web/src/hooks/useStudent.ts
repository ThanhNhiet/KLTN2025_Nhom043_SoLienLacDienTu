import { useState, useCallback } from 'react';
import { studentServices } from '../services/studentServices';

export interface courseSectionWithStudents {
    course_section_id: string;
    subjectName: string;
    className: string;
    sessionId: string;
    sessionName: string;
    facultyName: string;
    lecturerName: string;
    lecturerEmail: string;
    lecturerPhone: string;
    students: StudentWithScore[];
}

export interface StudentWithScore {
    no: number;
    student_id: string;
    name: string;
    dob: string;
    score: Score;
    initial_evaluate: string;
    isRemindYet?: boolean;
}

export interface Score {
    theo_regular1: number | null;
    theo_regular2: number | null;
    theo_regular3: number | null;
    pra_regular1: number | null;
    pra_regular2: number | null;
    pra_regular3: number | null;
    mid: number | null;
    final: number | null;
    avr: number | null;
}

// {
//     "data": [
//         {
//             "student_id": "SV2100004",
//             "name": "Sinh Vien 004",
//             "class_name": "DHCNTT17A",
//             "academic_year": "2025-2026",
//             "semester": "HK3",
//             "subjects": [
//                 {
//                     "subject_name": "Lập trình C cơ bản",
//                     "credits": 4,
//                     "theo_credit": 3,
//                     "pra_credit": 1,
//                     "theo_regular1": "5.5",
//                     "theo_regular2": "7.4",
//                     "theo_regular3": "5.4",
//                     "pra_regular1": "9.9",
//                     "pra_regular2": "8.3",
//                     "pra_regular3": "6.7",
//                     "midterm": "8.8",
//                     "final": "8.6",
//                     "average": "8.33",
//                     "grade_point": 3.5
//                 },
//                 {
//                     "subject_name": "Trí tuệ nhân tạo",
//                     "credits": 4,
//                     "theo_credit": 3,
//                     "pra_credit": 1,
//                     "theo_regular1": "6.8",
//                     "theo_regular2": "8.3",
//                     "theo_regular3": "6.2",
//                     "pra_regular1": "5.8",
//                     "pra_regular2": "5.5",
//                     "pra_regular3": "9.9",
//                     "midterm": "8.2",
//                     "final": "6.5",
//                     "average": "7.01",
//                     "grade_point": 3
//                 },
//                 {
//                     "subject_name": "Đồ án tốt nghiệp CNTT",
//                     "credits": 5,
//                     "theo_credit": 0,
//                     "pra_credit": 5,
//                     "theo_regular1": "7.6",
//                     "theo_regular2": "8.5",
//                     "theo_regular3": "9.6",
//                     "pra_regular1": "7.7",
//                     "pra_regular2": "9.7",
//                     "pra_regular3": "5.2",
//                     "midterm": "7",
//                     "final": "9.5",
//                     "average": "8.51",
//                     "grade_point": 3.8
//                 },
//                 {
//                     "subject_name": "Điện toán đám mây",
//                     "credits": 3,
//                     "theo_credit": 3,
//                     "pra_credit": 0,
//                     "theo_regular1": "6.3",
//                     "theo_regular2": "8",
//                     "theo_regular3": "6",
//                     "pra_regular1": "6",
//                     "pra_regular2": "7.1",
//                     "pra_regular3": "7.5",
//                     "midterm": "6",
//                     "final": "7.6",
//                     "average": "7.05",
//                     "grade_point": 3
//                 },
//                 {
//                     "subject_name": "Phân tích và thiết kế hệ thống",
//                     "credits": 3,
//                     "theo_credit": 3,
//                     "pra_credit": 0,
//                     "theo_regular1": "5.1",
//                     "theo_regular2": "7.5",
//                     "theo_regular3": "7.5",
//                     "pra_regular1": "9.8",
//                     "pra_regular2": "6.7",
//                     "pra_regular3": "8.9",
//                     "midterm": "9.3",
//                     "final": "9.9",
//                     "average": "9.17",
//                     "grade_point": 4
//                 }
//             ],
//             "total_subjects": 5,
//             "total_credits": 19,
//             "gpa": "3.47"
//         },
export interface StudentScores {
    student_id: string;
    name: string;
    class_name: string;
    academic_year: string;
    semester: string;
    subjects: SubjectScore[];
    total_subjects: number;
    total_credits: number;
    gpa: string;
}

export interface StudentScoresResponse {
    data: StudentScores[];
}

export interface SubjectScore {
    subject_name: string;
    credits: number;
    theo_credit: number;
    pra_credit: number;
    theo_regular1: string;
    theo_regular2: string;
    theo_regular3: string;
    pra_regular1: string;
    pra_regular2: string;
    pra_regular3: string;
    midterm: string;
    final: string;
    average: string;
    grade_point: number;
}

// {
//     "total": 57,
//     "page": 1,
//     "pageSize": 10,
//     "courseSections": [
//         {
//             "course_section_id": "40606b72-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT101",
//             "subjectName": "Lập trình C cơ bản",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK3 2025-2026",
//             "lecturerName": "Nguyen Thi R",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "40606b81-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT110",
//             "subjectName": "Trí tuệ nhân tạo",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK3 2025-2026",
//             "lecturerName": "Pham Van S",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "40606b8a-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT115",
//             "subjectName": "Đồ án tốt nghiệp CNTT",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK3 2025-2026",
//             "lecturerName": "Pham Van WW",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "40606b92-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT114",
//             "subjectName": "Điện toán đám mây",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK3 2025-2026",
//             "lecturerName": "Pham Van MM",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "40606b9b-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT107",
//             "subjectName": "Phân tích và thiết kế hệ thống",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK3 2025-2026",
//             "lecturerName": "Pham Thi RR",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "406020c5-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT102",
//             "subjectName": "Cấu trúc dữ liệu & Giải thuật",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK2 2025-2026",
//             "lecturerName": "Nguyen Thi R",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "406020d5-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT106",
//             "subjectName": "Lập trình hướng đối tượng (Java)",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK2 2025-2026",
//             "lecturerName": "Pham Van S",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "406020dd-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT113",
//             "subjectName": "Học máy (Machine Learning)",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK2 2025-2026",
//             "lecturerName": "Pham Van WW",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "406020e6-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT103",
//             "subjectName": "Cơ sở dữ liệu",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK2 2025-2026",
//             "lecturerName": "Pham Van MM",
//             "createdAt": "17-09-2025"
//         },
//         {
//             "course_section_id": "406020ed-93a7-11f0-a902-088fc3521198",
//             "subject_id": "CNTT108",
//             "subjectName": "Lập trình Web",
//             "className": "DHCNTT17A",
//             "facultyName": "Khoa Công nghệ thông tin",
//             "sessionName": "HK2 2025-2026",
//             "lecturerName": "Pham Thi RR",
//             "createdAt": "17-09-2025"
//         }
//     ],
//     "linkPrev": null,
//     "linkNext": "/api/coursesections/student/SV2100001?page=2&pagesize=10",
//     "pages": [
//         1,
//         2,
//         3
//     ]
// }
export interface HomeroomStudentCourseSection {
    course_section_id: string;
    subject_id: string;
    subjectName: string;
    className: string;
    facultyName: string;
    sessionName: string;
    lecturerName: string;
    createdAt: string;
}

export interface HomeroomStudentCourseSectionResponse {
    total: number;
    page: number;
    pageSize: number;
    courseSections: HomeroomStudentCourseSection[];
    linkPrev: string | null;
    linkNext: string | null;
    pages: number[];
}

// {
//     "subject_info": {
//         "subject_name": "Cấu trúc dữ liệu & Giải thuật",
//         "faculty_name": "Khoa Công nghệ thông tin",
//         "total_sections": 1
//     },
//     "statistics": {
//         "total_sessions": 6,
//         "present": 6,
//         "absent": 0,
//         "late": 0,
//         "attendance_rate": "100.0%"
//     },
//     "attendance_details": [
//         {
//             "course_section_id": "40606ba3-93a7-11f0-a902-088fc3521198",
//             "session": "HK1 2025-2026",
//             "date": "22-09-2025",
//             "start_lesson": 12,
//             "end_lesson": 15,
//             "status": "PRESENT",
//             "description": "Trễ 2 buổi"
//         },
//         {
//             "course_section_id": "40606ba3-93a7-11f0-a902-088fc3521198",
//             "session": "HK1 2025-2026",
//             "date": "20-10-2025",
//             "start_lesson": 1,
//             "end_lesson": 3,
//             "status": "PRESENT",
//             "description": "+1"
//         },
//         {
//             "course_section_id": "40606ba3-93a7-11f0-a902-088fc3521198",
//             "session": "HK1 2025-2026",
//             "date": "13-12-2025",
//             "start_lesson": 13,
//             "end_lesson": 15,
//             "status": "PRESENT",
//             "description": ""
//         },
//         {
//             "course_section_id": "40606ba3-93a7-11f0-a902-088fc3521198",
//             "session": "HK1 2025-2026",
//             "date": "14-12-2025",
//             "start_lesson": 1,
//             "end_lesson": 3,
//             "status": "PRESENT",
//             "description": "+1"
//         },
//         {
//             "course_section_id": "40606ba3-93a7-11f0-a902-088fc3521198",
//             "session": "HK1 2025-2026",
//             "date": "14-12-2025",
//             "start_lesson": 4,
//             "end_lesson": 6,
//             "status": "PRESENT",
//             "description": ""
//         },
//         {
//             "course_section_id": "40606ba3-93a7-11f0-a902-088fc3521198",
//             "session": "HK1 2025-2026",
//             "date": "14-12-2025",
//             "start_lesson": 13,
//             "end_lesson": 15,
//             "status": "PRESENT",
//             "description": ""
//         }
//     ]
// }
export interface StudentAttendanceDetail {
    course_section_id: string;
    session: string;
    date: string;
    start_lesson: number;
    end_lesson: number;
    status: string;
    description: string;
}
export interface StudentAttendanceByCSID_SJID4Lecturer {
    subject_info: {
        subject_name: string;
        faculty_name: string;
        total_sections: number;
    };
    statistics: {
        total_sessions: number;
        present: number;
        absent: number;
        late: number;
        attendance_rate: string;
    };
    attendance_details: StudentAttendanceDetail[];
}

// {
//     "total": 1,
//     "page": 1,
//     "pageSize": 10,
//     "alerts": [
//         {
//             "_id": "5e6f0fac-1933-45a8-95e7-bab28c16fe1e",
//             "header": "Nhắc nhở học tập - Sinh viên SV2100001 - LHP: 405fd059-93a7-11f0-a902-088fc3521198 - Môn: Điện toán đám mây",
//             "body": "Thông báo đến sinh viên Sinh Vien 001 (MSSV: SV2100001) và Quý Phụ huynh.\n\nTrong môn học Điện toán đám mây (mã lớp học phần: 405fd059-93a7-11f0-a902-088fc3521198), thuộc lớp DHCNTT17A, học kỳ HK1 2025-2026, tôi nhận thấy rằng:\n\nĐiểm giữa kỳ của là 3 theo thang điểm 10. Đây là kết quả rất đáng lo ngại và có ảnh hưởng lớn đến điểm tổng kết của môn học. Kết quả này cho thấy em đang bị hổng kiến thức nghiêm trọng và có nguy cơ rất cao sẽ không đạt môn học này.\n\nĐề nghị sinh viên nghiêm túc xem lại và củng cố lại toàn bộ kiến thức đã học và bài kiểm tra vừa rồi. Lên kế hoạch học tập chi tiết cho phần còn lại của học kỳ.\n\nNhà trường và giảng viên luôn tạo điều kiện hỗ trợ, nhưng sự nỗ lực từ chính bản thân em mới là yếu tố quyết định.\n\nTrân trọng.\nGiảng viên phụ trách môn học: Nguyễn Văn An\nEmail: le00001@iuh.edu.vn\nSố điện thoại: 0834258511",
//             "createdAt": "15/12/2025 13:17:37",
//             "isRead": false
//         }
//     ],
//     "linkPrev": null,
//     "linkNext": null,
//     "pages": [
//         1
//     ]
// }
export interface HomeroomStudentRemind {
    _id: string;
    header: string;
    body: string;
    createdAt: string;
    isRead: boolean;
}
export interface HomeroomStudentRemindResponse {
    total: number;
    page: number;
    pageSize: number;
    alerts: HomeroomStudentRemind[];
    linkPrev: string | null;
    linkNext: string | null;
    pages: number[];
}

export const useStudent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [courseSectionData, setCourseSectionData] = useState<courseSectionWithStudents | null>(null);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [studentScores, setStudentScores] = useState<StudentScores[]>([]);
    const [homeroomStudentCourseSections, setHomeroomStudentCourseSections] = useState<HomeroomStudentCourseSectionResponse | null>(null);
    const [homeroomStudentRemindStudyList, setHomeroomStudentRemindStudyList] = useState<HomeroomStudentRemindResponse | null>(null);
    const [homeroomStudentRemindAttendanceList, setHomeroomStudentRemindAttendanceList] = useState<HomeroomStudentRemindResponse | null>(null);
    const [studentAttendanceByCSID_SJID4Lecturer, setStudentAttendanceByCSID_SJID4Lecturer] = useState<StudentAttendanceByCSID_SJID4Lecturer | null>(null);

    const fetchStudentsByCourseSection = useCallback(async (course_section_id: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getStudentsByCourseSection(course_section_id);
            setCourseSectionData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch course sections');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStudentInfo = useCallback(async (student_id: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getStudentInfo(student_id);
            setStudentInfo(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch student info');
        } finally {
            setLoading(false);
        }
    }, []);

    // option: all, notWarningYet
    const fetchStudentsWarningList = useCallback(async (params: {
        sessionId: string;
        sessionName: string;
        facultyId: string;
        option: string;
        page: number;
        pageSize: number;
    }) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getStudentsWarningList(params);
            return data;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch student warning list');
        } finally {
            setLoading(false);
        }
    }, []);

    // search student warning
    const searchStudentWarningSubject = useCallback(async (params: {
        sessionId: string;
        sessionName: string;
        facultyId: string;
        studentId: string;
    }) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.searchStudentWarningSubject(params);
            return data;
        } catch (err: any) {
            setError(err.message || 'Failed to search student warning subject');
        } finally {
            setLoading(false);
        }
    }, []);

    // lấy tất cả danh sách lớp học phần của sinh viên homeroom
    const getHomeroomStudentCourseSections = useCallback(async (student_id: string, page: number, pageSize: number) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getHomeroomStudentCourseSections({ student_id, page, pageSize });
            setHomeroomStudentCourseSections(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch homeroom student course sections');
        }
        finally {
            setLoading(false);
        }
    }, []);

    //Lấy thông báo nhắc nhở chuyên cần của sinh viên homeroom
    const getHomeroomStudentRemindAttendanceList = useCallback(async (student_id: string, page: number, pageSize: number) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getHomeroomStudentRemindAttendanceList({ student_id, page, pageSize });
            setHomeroomStudentRemindAttendanceList(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch homeroom student remind attendance list');
        }
        finally {
            setLoading(false);
        }
    }, []);

    //Lấy thông báo nhắc nhở học tập của sinh viên homeroom
    const getHomeroomStudentRemindStudyList = useCallback(async (student_id: string, page: number, pageSize: number) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getHomeroomStudentRemindStudyList({ student_id, page, pageSize });
            setHomeroomStudentRemindStudyList(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch homeroom student remind study list');
        }
        finally {
            setLoading(false);
        }
    }, []);

    //Lấy điểm các môn học của sinh viên
    const getStudentScores = useCallback(async (student_id: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await studentServices.getStudentScores(student_id);
            
            // Xử lý dữ liệu trả về - lấy tất cả học kỳ
            const studentScoresData = response.data ? response.data : (Array.isArray(response) ? response : [response]);
            
            setStudentScores(studentScoresData);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch student scores');
        }
        finally {
            setLoading(false);
        }
    }, []);

    // Lấy chi tiết điểm danh của sinh viên theo mã lớp học phần, mã môn học
    const getStudentAttendanceByCSID_SJID4Lecturer = useCallback(async (params: {
        course_section_id: string;
        subject_id: string;
        student_id: string;
    }) => {
        setLoading(true);
        setError('');
        try {
            const data = await studentServices.getStudentAttendanceByCSID_SJID4Lecturer(params);
            setStudentAttendanceByCSID_SJID4Lecturer(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch student attendance by lecturer');
        }
        finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        courseSectionData,
        studentInfo,
        studentScores,
        homeroomStudentCourseSections,
        homeroomStudentRemindStudyList,
        homeroomStudentRemindAttendanceList,
        studentAttendanceByCSID_SJID4Lecturer,

        fetchStudentsByCourseSection,
        fetchStudentInfo,
        fetchStudentsWarningList,
        searchStudentWarningSubject,
        getStudentScores,
        getHomeroomStudentCourseSections,
        getHomeroomStudentRemindStudyList,
        getHomeroomStudentRemindAttendanceList,
        getStudentAttendanceByCSID_SJID4Lecturer,
    };
};
