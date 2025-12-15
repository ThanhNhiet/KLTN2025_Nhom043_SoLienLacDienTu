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

// {
//     "homeroomInfo": {
//         "name": "Nguyễn Văn An",
//         "email": "le00001@iuh.edu.vn",
//         "phone": "0834258511",
//         "facultyName": "Khoa Công nghệ thông tin",
//         "homeroom_class_id": "3e4d4f9f-92a6-11f0-ae51-088fc3521198",
//         "homeroomClassName": "DHCNTT17A"
//     },
//     "students": [
//         {
//             "student_id": "SV2100001",
//             "name": "Sinh Vien 001",
//             "dob": "02-01-2003",
//             "gender": "Nam",
//             "email": "sv2100001@stu.edu.vn",
//             "phone": "0907000001",
//             "address": "Ha Noi",
//             "parent_id": "PA00001",
//             "parentName": "Phu huynh 001",
//             "parentDob": "02-02-1971",
//             "parentGender": "Nam",
//             "parentPhone": "0915000001",
//             "parentEmail": "pa00001@stu.edu.vn",
//             "parentAddress": "Ha Noi",
//             "totalWarnings": 0,
//             "gotExpelAlertYet": false
//         },
export interface StudentInHomeroom {
    student_id: string;
    name: string;
    dob: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    parent_id: string;
    parentName: string;
    parentDob: string;
    parentGender: string;
    parentPhone: string;
    parentEmail: string;
    parentAddress: string;
    totalWarnings: number;
    gotExpelAlertYet: boolean;
}

export interface HomeroomInfo {
    name: string;
    email: string;
    phone: string;
    facultyName: string;
    homeroom_class_id: string;
    homeroomClassName: string;
}

export interface HomeroomData {
    homeroomInfo: HomeroomInfo;
    students: StudentInHomeroom[];
}

export const useLecturer = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [lecturer, setLecturer] = useState<Lecturer | null>(null);
    const [homeroomData, setHomeroomData] = useState<HomeroomData | null>(null);

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

    //Lấy thông tin lớp chủ nhiệm và danh sách sinh viên trong lớp chủ nhiệm
    const getHomeroomData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await lecturerService.getStudentsInHomeroom();
            setHomeroomData(data);
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
        homeroomData,
        
        getLecturerInfo,
        updateLecturerInfo,
        updateLecturerAvatar,
        changePassword,
        getHomeroomData,
    };
};