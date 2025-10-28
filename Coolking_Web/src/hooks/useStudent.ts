import { useState, useCallback } from 'react';
import { studentServices } from '../services/studentServices';

export interface courseSectionWithStudents {
    course_section_id: string;
    subjectName: string;
    className: string;
    sessionName: string;
    facultyName: string;
    lecturerName: string;
    students: StudentWithScore[];
}

export interface StudentWithScore {
    no: number;
    student_id: string;
    name: string;
    dob: string;
    score: Score;
    initial_evaluate: string;
    isWarningYet?: boolean;
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

export const useStudent = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [courseSectionData, setCourseSectionData] = useState<courseSectionWithStudents | null>(null);
    const [studentInfo, setStudentInfo] = useState<any>(null);

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

    return {
        loading,
        error,
        courseSectionData,
        // students: courseSectionData?.students || [], // Tiện ích để lấy nhanh danh sách sinh viên
        studentInfo,
        fetchStudentsByCourseSection,
        fetchStudentInfo,
        fetchStudentsWarningList,
        searchStudentWarningSubject
    };
};
