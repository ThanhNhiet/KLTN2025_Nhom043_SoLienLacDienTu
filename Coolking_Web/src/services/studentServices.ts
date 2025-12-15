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
        sessionName: string;
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
        sessionName: string;
        facultyId: string;
        studentId: string;
    }) {
        const response = await axiosInstance.get('/students/warn-list/search', { params });
        return response.data;
    }

    //GET /api/students/remindsstudy-4-homeroomle?student_id=&page=&pageSize=
    async getHomeroomStudentRemindStudyList(params: {
        student_id: string;
        page: number;
        pageSize: number;
    }) {
        const response = await axiosInstance.get('/students/remindsstudy-4-homeroomle', { params });
        return response.data;
    }

    //GET /api/students/remindsattendance-4-homeroomle?student_id=&page=&pageSize=
    async getHomeroomStudentRemindAttendanceList(params: {
        student_id: string;
        page: number;
        pageSize: number;
    }) {
        const response = await axiosInstance.get('/students/remindsattendance-4-homeroomle', { params });
        return response.data;
    }

    //GET /api/scores/student/:student_id
    async getStudentScores(student_id: string) {
        const response = await axiosInstance.get(`/scores/student/${student_id}`);
        return response.data;
    }

    //GET /api/coursesections/student-4-homeroomle?student_id=SV2100001&page=1&pageSize=10
    async getHomeroomStudentCourseSections(params: {
        student_id: string;
        page: number;
        pageSize: number;
    }) {
        const response = await axiosInstance.get('/coursesections/student-4-homeroomle', { params });
        return response.data;
    }

    //GET /api/attendances/student-by-le?course_section_id=40606ba3-93a7-11f0-a902-088fc3521198&subject_id=CNTT102&student_id=SV2100001
    async getStudentAttendanceByCSID_SJID4Lecturer(params: {
        course_section_id: string;
        subject_id: string;
        student_id: string;
    }) {
        const response = await axiosInstance.get('/attendances/student-by-le', { params });
        return response.data;
    }


};
export const studentServices = new StudentServices();
export default StudentServices;