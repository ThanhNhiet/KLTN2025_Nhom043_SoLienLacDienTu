import axiosInstance from '../configs/axiosConf';

class LecturerService {
   // GET /api/lecturers/info
   async getLecturerInfo() {
        const response = await axiosInstance.get('/lecturers/info');
        return response.data;
    }

    // PUT /api/lecturers/info
    async updateLecturerInfo(phone: string, email: string, address: string) {
        const data = { phone, email, address };
        const response = await axiosInstance.put('/lecturers/info', data);
        return response.data;
    }

    // POST /api/lecturers/avatar
    async updateLecturerAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post('/lecturers/avatar', formData, {
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
}

export const lecturerService = new LecturerService();
export default lecturerService;