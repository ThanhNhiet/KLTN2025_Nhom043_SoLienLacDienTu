import { useState, useCallback } from 'react';
import { lecturerService } from '../services/lecturerServices';

export interface Lecturer {
    lecturer_id: string;
    name: string;
    dob: string;
    gender: string;
    avatar: string;
    phone: string;
    email: string;
    address: string;
    facultyName: string;
    homeroomClassName: string | null;
    createdAt: string;
    updatedAt: string;
}

export const useLecturer = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [lecturer, setLecturer] = useState<Lecturer | null>(null);

    // Lấy thông tin giảng viên
    const getLecturerInfo = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await lecturerService.getLecturerInfo();
            setLecturer(data);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cập nhật thông tin giảng viên
    const updateLecturerInfo = useCallback(async (phone: string, email: string, address: string) => {
        try {
            setLoading(true);
            setError('');
            const response = await lecturerService.updateLecturerInfo(phone, email, address);
            return response;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cập nhật avatar giảng viên
    const updateLecturerAvatar = useCallback(async (avatar: File) => {
        try {
            setLoading(true);
            setError('');
            const response = await lecturerService.updateLecturerAvatar(avatar);
            if (response.success) {
                await getLecturerInfo();
                const leAvatar_local = localStorage.getItem('lecturer_avatar');
                if (leAvatar_local) localStorage.setItem('lecturer_avatar', response.avatar);
            }
            return response;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Đổi mật khẩu
    const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
        try {
            setLoading(true);
            setError('');
            const response = await lecturerService.changePassword(oldPassword, newPassword);
            return response;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        lecturer,

        getLecturerInfo,
        updateLecturerInfo,
        updateLecturerAvatar,
        changePassword
    };
};