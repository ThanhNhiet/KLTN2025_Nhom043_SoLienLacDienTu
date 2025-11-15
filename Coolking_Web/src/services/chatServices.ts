import axiosInstance from "../configs/axiosConf";

class ChatServices {
    // GET /api/chats/all?page=1&pageSize=10
    async getAllChats(page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/all`, {
            params: {
                page,
                pageSize
            }
        });
        return response.data;
    }

    // GET /api/chats/all/search?keyword=<keyword>&page=1&pageSize=10
    async searchChats(keyword: string, page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/all/search`, {
            params: {
                keyword,
                page,
                pageSize
            }
        });
        return response.data;
    }

    // POST /api/chats/group?course_section_id=&nameGroup=
    // Cho phép truyền param có dấu cách và các ký tự đặc biệt
    async createGroupChat(course_section_id: string, nameGroup: string) {
        const response = await axiosInstance.post(`/chats/group`, {}, {
            params: {
                course_section_id,
                nameGroup
            }
        });
        return response.data;
    }

    // POST /api/chats/private/:target_id   
    async createPrivateChat(target_id: string) {
        const response = await axiosInstance.post(`/chats/private/${target_id}`);
        return response.data;
    }

    // DELETE /api/chats/:chatID
    async deleteChat(chatID: string) {
        const response = await axiosInstance.delete(`/chats/${chatID}`);
        return response.data;
    }

    // PUT /api/chats/group/:chatID
    // body: { name: string, "students":  ["SVxxx", "SVxxx"], "lecturers": ["KExxx", "LExxx"] }
    async AddMembers2GroupChat(chatID: string, name: string, students: string[], lecturers: string[]) {
        const response = await axiosInstance.put(`/chats/group/${chatID}`, {
            name,
            students,
            lecturers
        });
        return response.data;
    }

    // DELETE /api/chats/cleanup-inactive
    async cleanupInactiveChats() {
        const response = await axiosInstance.delete(`/chats/cleanup-inactive`);
        return response.data;
    }

    // GET /api/chats/nonchat-course-sections?faculty_id=1&page=1&pageSize=10
    async getNonChatCourseSections(faculty_id: string, page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/nonchat-course-sections`, {
            params: {
                faculty_id,
                page,
                pageSize
            }
        });
        return response.data;
    }

    // GET /api/Chats/nonchat-course-sections/search?faculty_id=<faculty_id>&keyword=<keyword>&page=1&pageSize=10
    async searchNonChatCourseSections(faculty_id: string, keyword: string, page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/nonchat-course-sections/search`, {
            params: {
                faculty_id,
                keyword,
                page,
                pageSize
            }
        });
        return response.data;
    }

    // GET /api/students/info-view-le-ad/{studentId}
    async getStudentInfo(studentId: string) {
        const response = await axiosInstance.get(`/students/info-view-le-ad/${studentId}`);
        return response.data;
    }

    // GET /api/lecturers/{lecturerId}
    async getLecturerInfo(lecturerId: string) {
        const response = await axiosInstance.get(`/lecturers/${lecturerId}`);
        return response.data;
    }

    // GET /api/chats/group-info/{course_section_id}
    async getGroupChatInfo(course_section_id: string) {
        const response = await axiosInstance.get(`/chats/group-info/${course_section_id}`);
        return response.data;
    }

    // DELETE /api/chats/cleanup-gr-completed/{session_id}
    async cleanupGroupChatsOfCompletedCourseSections(session_id: string) {
        const response = await axiosInstance.delete(`/chats/cleanup-gr-completed/${session_id}`);
        return response.data;
    }

    // POST /api/chats/homeroom/{lecturer_id}
    async createGroupChatWithHomeroomLecturer(lecturer_id: string) {
        const response = await axiosInstance.post(`/chats/homeroom/${lecturer_id}`);
        return response.data;
    }

    // GET /api/chats?page=1&pageSize=10 (dành cho giảng viên)
    async getChats4AllUser(page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats`, {
            params: {
                page,
                pageSize
            }
        });
        return response.data;
    }

    //GET /api/chats/search?keyword= (dành cho giảng viên)
    async searchChats4AllUser(keyword: string, page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/search`, {
            params: {
                keyword,
                page,
                pageSize
            }
        });
        return response.data;
    }

    // GET /api/chats/:chatID (lấy chat theo chatID)
    async getChatById4AllUser(chatID: string) {
        const response = await axiosInstance.get(`/chats/${chatID}`);
        return response.data;
    }

    // PUT /api/chats/mute/:chatID (dành cho giảng viên)
    async muteChat4AllUser(chatID: string) {
        const response = await axiosInstance.put(`/chats/mute/${chatID}`);
        return response.data;
    }

    // POST /api/chats/private/:target_id (tạo chat riêng với ai đó) - dành cho giảng viên
    async createPrivateChat4AllUser(target_id: string) {
        const response = await axiosInstance.post(`/chats/private/${target_id}`);
        return response.data;
    }

    // GET /api/chats/user-search?keyword=
    async searchUsersToChat(keyword: string) {
        const response = await axiosInstance.get(`/chats/user-search`, {
            params: {
                keyword
            }
        });
        return response.data;
    }

    // GET /api/chats/info/:chatID
    async getChatInfoByID4Admin(chatID: string) {
        const response = await axiosInstance.get(`/chats/info/${chatID}`);
        return response.data;
    }

    // DELETE /api/chats/group/:chatID/member/:userID
    async deleteMemberFromGroupChat4Admin(chatID: string, userID: string) {
        const response = await axiosInstance.delete(`/chats/group/${chatID}/member/${userID}`);
        return response.data;
    }

    // GET /api/chats/nonchat-course-sections/session/f52eafd2-939c-11f0-a902-088fc3521198/faculty/CNTT
    async getNonChatCourseSectionsFacultySession(session_id: string, faculty_id: string) {
        const response = await axiosInstance.get(`/chats/nonchat-course-sections/session/${session_id}/faculty/${faculty_id}`);
        return response.data;
    }

    // POST api/chats/bulk-create
    async bulkCreateGroupChats(
        courseSections: {
            subjectName: string;
            className: string;
            course_section_id: string;
            start_lesson: number;
            end_lesson: number;
        }[], 
        sessionInfo: String) {
        const response = await axiosInstance.post(`/chats/bulk-create`, {
            courseSections,
            sessionInfo
        });
        return response.data;
    }
}

export const chatServices = new ChatServices();
export default chatServices;
