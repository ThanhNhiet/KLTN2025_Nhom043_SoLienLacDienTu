import axiosInstance from '../configs/axiosConf';

class AccountService {
    // GET /api/accounts?page=1&pagesize=10
    async getAccounts(page: number, pageSize: number) {
        const response = await axiosInstance.get(`/accounts`, {
            params: {
                page: page,
                pagesize: pageSize
            }
        });
        return response.data;
    }

    // GET /api/accounts/{id}
    async getAccountById(id: string) {
        const response = await axiosInstance.get(`/accounts/${id}`);
        return response.data;
    }

    // PUT /api/accounts/{id}
    // body: {..}
    async updateAccount(id: string, data: any) {
        const response = await axiosInstance.put(`/accounts/${id}`, data);
        return response.data;
    }

    // POST /api/accounts
    // body: { "user_id": string, "password": string, "role": string, "status": string, "email": string, "phone_number": string }
    async createAccount(data: any) {
        const response = await axiosInstance.post(`/accounts`, data);
        return response.data;
    }

    // DELETE /api/accounts/{id}
    async deleteAccount(id: string) {
        const response = await axiosInstance.delete(`/accounts/${id}`);
        return response.data;
    }

    // POST /api/accounts/reset-password/{id}
    async resetPassword(id: string) {
        const response = await axiosInstance.post(`/accounts/reset-password/${id}`);
        return response.data;
    }

    // GET /api/accounts/search?keyword=&page=1&pagesize=10
    async searchAccounts(keyword: string, page: number, pageSize: number) {
        const response = await axiosInstance.get(`/accounts/search`, {
            params: {
                keyword,
                page,
                pagesize: pageSize
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

    // GET /api/parents/{parentId}
    async getParentInfo(parentId: string) {
        const response = await axiosInstance.get(`/parents/${parentId}`);
        return response.data;
    }

    // GET /api/staffs/:staff_id
    async getStaffInfo(staff_id: string) {
        const response = await axiosInstance.get(`/staffs/${staff_id}`);
        return response.data;
    }
}

// Export singleton instance
export const accountService = new AccountService();
export default accountService;