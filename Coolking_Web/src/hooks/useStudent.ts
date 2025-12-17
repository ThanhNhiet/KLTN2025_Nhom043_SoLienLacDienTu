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
