import { useState, useCallback } from 'react';
import { scheduleServices } from '../services/scheduleServices';

export interface Schedule {
    subjectName: string;
    clazzName: string;
    lecturerName: string;
    type: string;
    status: string;
    date: string; // dd-mm-yyyy
    day_of_week: number; // 1 - 7 (Thứ 2 - Chủ nhật)
    room: string;
    start_lesson: number;
    end_lesson: number;
}

export const useSchedule = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [linkPrev, setLinkPrev] = useState<string | null>(null);
    const [linkNext, setLinkNext] = useState<string | null>(null);
    const [weekStart, setWeekStart] = useState<string | null>(null);
    const [weekEnd, setWeekEnd] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState<string>('');

    const getSchedulesByUser = useCallback(async (date: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await scheduleServices.getSchedulesByUser(date);
            setSchedules(data.schedules || []);
            setLinkPrev(data.prev || null);
            setLinkNext(data.next || null);
            setWeekStart(data.weekInfo?.weekStart || null);
            setWeekEnd(data.weekInfo?.weekEnd || null);
            setCurrentDate(date);
        } catch (error: any) {
            setError('Failed to fetch schedules');
            console.error('Get schedules error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        schedules,
        linkPrev,
        linkNext,
        weekStart,
        weekEnd,
        currentDate,
        getSchedulesByUser
    };
};