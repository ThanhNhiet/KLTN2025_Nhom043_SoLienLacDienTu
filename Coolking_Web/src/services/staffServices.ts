import axiosInstance from '../configs/axiosConf';

class StaffService {
   // GET /api/staffs/admin/info
    async getStaffInfo() {
        const response = await axiosInstance.get('/staffs/admin/info');
        return response.data;
    }

    // PUT /api/staffs/admin
    async updateStaffInfo(phone: string, email: string, address: string) {
        const response = await axiosInstance.put('/staffs/admin', { phone, email, address });
        return response.data;
    }

    // POST /api/staffs/admin/avatar
    async updateStaffAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post('/staffs/admin/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    // POST /api/accounts/change-password
    async changePassword(oldPassword: string, newPassword: string) {
        const data = { oldPassword, newPassword };
        const response = await axiosInstance.post('/accounts/change-password', data);
        return response.data;
    }

    // GET /api/staffs/admin/all?department={department}
    async getStaffsAdminByDepartment(department: string) {
        const response = await axiosInstance.get('/staffs/admin/all', {
            params: { department }
        });
        return response.data;
    }
}

export const staffService = new StaffService();
export default staffService;