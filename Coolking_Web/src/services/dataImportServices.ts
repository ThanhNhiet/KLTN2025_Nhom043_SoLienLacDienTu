import axiosInstance from '../configs/axiosConf';

class DataImportService {
    // POST /api/dataimport/:type
    // Params: type = schedules | schedule-exceptions | scores
    // Content-Type: multipart/form-data
    // Files: files[] (CSV file)
    async importDataFiles(type: string, formData: FormData) {
        const response = await axiosInstance.post(`/dataimport/${type}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }

    // GET /api/dataimport/template/:type
    // Params: type = schedules | schedule-exceptions | scores
    // Trả về template csv
    async downloadTemplateFile(type: string) {
        const response = await axiosInstance.get(`/dataimport/template/${type}`, {
            responseType: 'blob' // Để nhận về file
        });
        return response.data;
    }
}

export const dataImportService = new DataImportService();
export default dataImportService;