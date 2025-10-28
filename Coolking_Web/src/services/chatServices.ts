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
        console.log('Adding members to group chat with chatID:', chatID, 'name:', name, 'students:', students, 'lecturers:', lecturers);
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

    // GET /api/chats/nonchat-course-sections?page=1&pageSize=10
    async getNonChatCourseSections(page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/nonchat-course-sections`, {
            params: {
                page,
                pageSize
            }
        });
        return response.data;
    }

    // GET /api/Chats/nonchat-course-sections/search?keyword=<keyword>&page=1&pageSize=10
    async searchNonChatCourseSections(keyword: string, page: number, pageSize: number) {
        const response = await axiosInstance.get(`/chats/nonchat-course-sections/search`, {
            params: {
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
}

export const chatServices = new ChatServices();
export default chatServices;
