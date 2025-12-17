import axiosInstance from "../configs/axiosConf";

class StatisticsServices {
    // GET /api/statistics/all-sessions
    async getAllSessions() {
        const response = await axiosInstance.get("/statistics/all-sessions");
        return response.data;
    }

    // GET /api/statistics/all-faculties
    async getAllFaculties() {
        const response = await axiosInstance.get("/statistics/all-faculties");
        return response.data;
    }

    // GET /api/statistics/faculty-overview?faculty_id=<faculty_id>&session_id=<session_id>
    async getFacultyOverview(faculty_id: string, session_id: string) {
        const response = await axiosInstance.get(`/statistics/faculty-overview`, {
            params: {
                faculty_id,
                session_id
            }
        });
        return response.data;
    }

    // GET /api/statistics/lecturers-overview?faculty_id=<faculty_id>&session_id=<session_id>
    async getLecturersOverview(faculty_id: string, session_id: string) {
        const response = await axiosInstance.get(`/statistics/lecturers-overview`, {
            params: {
                faculty_id,
                session_id
            }
        });
        return response.data;
    }

    // GET /api/statistics/lecturer-overview?lecturer_id=<lecturer_id>&session_id=<session_id>
    async getLecturerOverview(lecturer_id: string, session_id: string) {
        const response = await axiosInstance.get(`/statistics/lecturer-overview`, {
            params: {
                lecturer_id,
                session_id
            }
        });
        return response.data;
    }

    // GET /api/statistics/courses-sections-overview?faculty_id=<faculty_id>&session_id=<session_id>
    async getCoursesSectionsOverview(faculty_id: string, session_id: string) {
        const response = await axiosInstance.get(`/statistics/courses-sections-overview`, {
            params: {
                faculty_id,
                session_id
            }
        });
        return response.data;
    }

    // GET /api/statistics/course-section-overview?course_section_id=<course_section_id>&session_id=<session_id>
    async getCourseSectionOverview(course_section_id: string, session_id: string) {
        const response = await axiosInstance.get(`/statistics/course-section-overview`, {
            params: {
                course_section_id,
                session_id
            }
        });
        return response.data;
    }
}

export const statisticsServices = new StatisticsServices();
export default statisticsServices;