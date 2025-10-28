import axiosInstance from "../configs/axiosConf";

class StudentServices {
    // GET /api/students/class-score-view/{course_section_id}
    async getStudentsByCourseSection(course_section_id: string) {
        const response = await axiosInstance.get(`/students/class-score-view/${course_section_id}`);
        return response.data;
    }

    // GET /api/students/info-view-le-ad/{studentId}
    async getStudentInfo(studentId: string) {
        const response = await axiosInstance.get(`/students/info-view-le-ad/${studentId}`);
        return response.data;
    }

    // GET /api/students/warn-list?sessionId=&facultyId=&option=all&page=1&pageSize=10
    // option: all, notWarningYet
    async getStudentsWarningList(params: {
        sessionId: string;
        facultyId: string;
        option: string;
        page: number;
        pageSize: number;
    }) {
        const response = await axiosInstance.get('/students/warn-list', { params });
        return response.data;
    }

    // GET /api/students/warn-list/search?sessionId=&facultyId=&studentId=
    async searchStudentWarningSubject(params: {
        sessionId: string;
        facultyId: string;
        studentId: string;
    }) {
        const response = await axiosInstance.get('/students/warn-list/search', { params });
        return response.data;
    }
};
export const studentServices = new StudentServices();
export default StudentServices;