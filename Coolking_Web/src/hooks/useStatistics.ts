import { useState, useCallback } from 'react';
import { statisticsServices } from '../services/statisticsServices';

export interface Session {
    id: string;
    nameSession: string;
}

export interface Faculty {
    faculty_id: string;
    name: string;
}

export const useStatistics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);

    // Lấy toàn bộ học kỳ để hiển thị trong dropdown
    const fetchAllSessions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await statisticsServices.getAllSessions();
            setSessions(data);
        } catch (err) {
            setError('Failed to fetch sessions');
        }
        setLoading(false);
    }, []);

    // Lấy toàn bộ khoa để hiển thị trong dropdown
    const fetchAllFaculties = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await statisticsServices.getAllFaculties();
            setFaculties(data);
        } catch (err) {
            setError('Failed to fetch faculties');
        }
        setLoading(false);
    }, []);

    // Trả về thống kê của khoa theo học kỳ
    const getFacultyStatistics = useCallback(async (facultyId: string, sessionId: string) => {
        setLoading(true);
        setError('');
        try {
           return await statisticsServices.getFacultyOverview(facultyId, sessionId);
        } catch (err) {
            setError('Failed to fetch faculty statistics');
        }
        setLoading(false);
    }, []);

    // Trả về thống kê của tất cả giảng viên của khoa theo học kỳ
    const getLecturersStatistics = useCallback(async (facultyId: string, sessionId: string) => {
        setLoading(true);
        setError('');
        try {
           return await statisticsServices.getLecturersOverview(facultyId, sessionId);
        } catch (err) {
            setError('Failed to fetch lecturers statistics');
        }
        setLoading(false);
    }, []);

    // Trả về thống kê của giảng viên theo học kỳ
    const getLecturerStatistics = useCallback(async (lecturerId: string, sessionId: string) => {
        setLoading(true);
        setError('');
        try {
           return await statisticsServices.getLecturerOverview(lecturerId, sessionId);
        } catch (err) {
            setError('Failed to fetch lecturer statistics');
        }
        setLoading(false);
    }, []);

    // Trả về thống kê của tất cả lớp học phần của khoa theo học kỳ
    const getCoursesSectionsStatistics = useCallback(async (facultyId: string, sessionId: string) => {
        setLoading(true);
        setError('');
        try {
           return await statisticsServices.getCoursesSectionsOverview(facultyId, sessionId);
        } catch (err) {
            setError('Failed to fetch courses sections statistics');
        }
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        sessions,
        faculties,
        
        fetchAllSessions,
        fetchAllFaculties,
        getFacultyStatistics,
        getLecturersStatistics,
        getLecturerStatistics,
        getCoursesSectionsStatistics
    };
};

