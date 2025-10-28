import { useState, useCallback } from 'react';
import { attendanceService } from '../services/attendanceServices';


// Define types for attendance data (aka getStudentsWithAttendance response)
// {
//     "subjectName": "Điện toán đám mây",
//     "className": "DHCNTT17B",
//     "course_section_id": "405e3df6-93a7-11f0-a902-088fc3521198",
//     "facultyName": "Khoa Công nghệ thông tin",
//     "sessionName": "HK1 2023-2024",
//     "lecturerName": "Tran Thi J",
//     "attendances": [
//         {
//             "date_attendance": "20-09-2025",
//             "attendance_id": "505e3df6-93a7-11f0-a902-088fc3521198",
//             "start_lesson": 4,
//             "end_lesson": 6,
//             "students": [
//                 {
//                     "student_id": "SV2100101",
//                     "name": "Sinh Vien 101",
//                     "dob": "12-04-2003",
//                     "gender": true,
//                     "status": "PRESENT",
//                     "description": "Ghi chú cho SV2100101 buổi 1"
//                 },
//                 {
//                     "student_id": "SV2100102",
//                     "name": "Sinh Vien 102",
//                     "dob": "13-04-2003",
//                     "gender": false,
//                     "status": "PRESENT",
//                     "description": "Ghi chú cho SV2100102 buổi 1"
//                 },
//                 ...
//             ]
//         },
//         {
//             "date_attendance": "27-09-2025",
//             "attendance_id": "605e3df6-93a7-11f0-a902-088fc3521198",
//             "start_lesson": 4,
//             "end_lesson": 6,
//             "students": [
//                 {
//                     "student_id": "SV2100101",
//                     "name": "Sinh Vien 101",
//                     "dob": "12-04-2003",
//                     "gender": true,
//                     "status": "PRESENT",
//                     "description": "Ghi chú cho SV2100101 buổi 2"
//                 },
//                 {
//                     "student_id": "SV2100102",
//                     "name": "Sinh Vien 102",
//                     "dob": "13-04-2003",
//                     "gender": false,
//                     "status": "PRESENT",
//                     "description": "Ghi chú cho SV2100102 buổi 2"
//                 },
//                 ...
//             ]
//         },
//         ...
//     ]
// }
export interface AttendanceData {
    subjectName: string;
    className: string;
    course_section_id: string;
    facultyName: string;
    sessionName: string;
    lecturerName: string;
    attendances: Attendance[];
    students?: StudentRaw[];
}

export interface Attendance {
    date_attendance: string;
    attendance_id: string;
    start_lesson: number;
    end_lesson: number;
    students: Student[];
}

export interface Student {
    student_id: string;
    name: string;
    dob: string;
    gender: boolean;
    status: string;
    description: string;
}

export interface StudentRaw {
    student_id: string;
    name: string;
    dob: string;
    gender: boolean;
}

export const useAttendance = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);

    // Lấy các buổi điểm danh cùng danh sách sinh viên
    const getStudentsWithAttendance = useCallback(async (course_section_id: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await attendanceService.getStudentsWithAttendance(course_section_id);
            setAttendanceData(response);
        } catch (error: any) {
            setError(error.message || 'Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Tạo mới buổi điểm danh
    // Response trả về:
    // {
    //     "success": true,
    //     "message": "Dữ liệu điểm danh đã được lưu thành công cho 3 sinh viên"
    // }
    const recordAttendance = useCallback(async (course_section_id: string, start_lesson: number, end_lesson: number,
        students: { student_id: string, status: string, description?: string }[]) => {
        setLoading(true);
        setError('');
        try {
            const response = await attendanceService.recordAttendance(course_section_id, start_lesson, end_lesson, students);
            return response;
        } catch (error: any) {
            setError(error.message || 'Failed to record attendance');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cập nhật buổi điểm danh
    // Response trả về:
    // {
    //     "success": true,
    //     "message": "Dữ liệu điểm danh đã được cập nhật thành công cho 3 sinh viên"
    // }
    const updateAttendance = useCallback(async (attendance_id: string, start_lesson: number, end_lesson: number,
        students: { student_id: string, status: string, description?: string }[]) => {
        setLoading(true);
        setError('');
        try {
            const response = await attendanceService.updateAttendance(attendance_id, start_lesson, end_lesson, students);
            return response;
        } catch (error: any) {
            setError(error.message || 'Failed to update attendance');
        } finally {
            setLoading(false);
        }
    }, []);

    // Xóa buổi điểm danh
    // Response trả về:
    // {
    //     "success": true,
    //     "message": "Đã xóa thành công bản ghi điểm danh"
    // }
    const deleteAttendance = useCallback(async (attendance_id: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await attendanceService.deleteAttendance(attendance_id);
            return response;
        } catch (error: any) {
            setError(error.message || 'Failed to delete attendance');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        attendanceData,
        getStudentsWithAttendance,
        recordAttendance,
        updateAttendance,
        deleteAttendance
    };
};