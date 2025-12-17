import { useState, useCallback } from 'react';
import { dataImportService } from '../services/dataImportServices';

export interface ImportStats {
    processed: number;
    inserted: number;
    updated: number;
    errors: any[];
}

export interface ImportResponse {
    success: boolean;
    message: string;
    data: ImportStats;
}

export type ImportType = 'schedules' | 'schedule-exceptions' | 'scores';

export const useDataImport = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportStats | null>(null);

    /**
     * Hàm gọi API import dữ liệu
     * @param type Loại dữ liệu cần import
     * @param files Danh sách file (File[]) lấy từ input type="file"
     */
    const importData = useCallback(async (type: ImportType, files: File[]) => {
        try {
            setLoading(true);
            setError(null);
            setMessage(null);
            setImportResult(null);

            // Chuẩn bị FormData
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });

            // Gọi Service
            const response: ImportResponse = await dataImportService.importDataFiles(type, formData);

            if (response.success) {
                setMessage(response.message);
                setImportResult(response.data);
            } else {
                setError(response.message || 'Import failed');
            }
        } catch (err: any) {
            console.error('Import data error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to import data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Hàm tải file template CSV
     * @param type Loại dữ liệu cần lấy template
     */
    const downloadTemplate = useCallback(async (type: ImportType) => {
        try {
            setLoading(true);
            setError(null);

            // Gọi Service nhận Blob
            const blob = await dataImportService.downloadTemplateFile(type);

            // Tạo URL ảo cho Blob để trình duyệt tải xuống
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;

            // Đặt tên file tải xuống (VD: schedules_template.csv)
            link.setAttribute('download', `${type}_template.csv`);

            // Thêm vào DOM, click và dọn dẹp
            document.body.appendChild(link);
            link.click();

            if (link.parentNode) link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error('Download template error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to download template';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Hàm reset các state (dùng khi đóng modal hoặc chuyển tab)
     */
    const resetState = useCallback(() => {
        setError(null);
        setMessage(null);
        setImportResult(null);
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        message,
        importResult,
        importData,
        downloadTemplate,
        resetState
    };
};