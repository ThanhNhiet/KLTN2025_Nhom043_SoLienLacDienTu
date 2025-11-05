import {getAttendanceByStudentBySubject_Parent} from "@/src/services/api/attendance/AttendanceApi";
import { useEffect,useState,useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
interface ApiResponse {
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    data: {
        student_id: string;
        student_name: string;
        course_sections: CourseSection[];
    };
}
interface CourseSection {
    subject_info: SubjectInfo; // Sửa từ 'subject_infor' thành 'subject_info'
    statistics: Statistics;
    attendance_details: AttendanceDetail[];
}
interface SubjectInfo {
    course_section_id: string;
    faculty_name: string;
    subject_name: string;
    session: string;
}
interface Statistics {
    absent: number;
    attendance_rate: string;
    late: number;
    present: number;
    total_sessions: number;
}
interface AttendanceDetail {
    date: string;
    description: string;
    end_lesson: number;
    start_lesson: number;
    status: string;
}



export const useAttendance_Parent = (stID: string | null) => {
    const [attendanceDetails, setAttendanceDetails] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number | null>(null);
    const pageSize = 10;
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const storedRole = await AsyncStorage.getItem("role");
            setRole(storedRole);
        };

        fetchRole();
    }, []);

    const fetchAttendanceDetails = useCallback(async (studentID: string, page: number, pageSize: number) => {
       
        setLoading(true);
        setError(null);
        try {
            const data = await getAttendanceByStudentBySubject_Parent(studentID, page, pageSize);
            setAttendanceDetails(data);

            if (data && data.pagination.totalPages) {
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance details";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (stID) {
            fetchAttendanceDetails(stID, page, pageSize);
        } else {
            // Nếu không có stID (ví dụ: mới vào màn hình), reset state
            setAttendanceDetails(null);
            setLoading(false);
        }
    }, [fetchAttendanceDetails, stID, page, pageSize]); // pageSize là hằng số, nhưng để đây cho rõ ràng

    return {
        attendanceDetails,
        loading,
        error,
        page,
        setPage,
        totalPages,
        role,
        fetchAttendanceDetails,
        pageSize,
    };
}