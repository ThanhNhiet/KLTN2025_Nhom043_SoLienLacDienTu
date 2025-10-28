import { useState, useCallback } from 'react';
import { alertService } from '../services/alertServices';

export interface Alert {
    _id: string;
    senderID: string;
    receiverID: string;
    header: string;
    body: string;
    targetScope: 'all' | 'person';
    isRead: boolean;
    isWarningYet?: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useAlert = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [linkPrev, setLinkPrev] = useState<string | null>(null);
    const [linkNext, setLinkNext] = useState<string | null>(null);
    const [pages, setPages] = useState<number[]>([]);

    // Lấy danh sách thông báo
    const getAlerts = useCallback(async (page: number, pageSize: number) => {
        try {
            setLoading(true);
            setError('');
            const data = await alertService.getAlerts(page, pageSize);
            setAlerts(data.alerts || []);
            setTotal(data.total);
            setCurrentPage(data.page);
            setPageSize(data.pageSize);
            setLinkPrev(data.linkPrev);
            setLinkNext(data.linkNext);
            setPages(data.pages);
            return data;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy kết quả tìm kiếm thông báo
    const searchAlerts = useCallback(async (keyword: string, page: number, pageSize: number) => {
        try {
            setLoading(true);
            setError('');
            const data = await alertService.searchAlerts(keyword, page, pageSize);
            setAlerts(data.alerts || []);
            setTotal(data.total);
            setCurrentPage(data.page);
            setPageSize(data.pageSize);
            setLinkPrev(data.linkPrev);
            setLinkNext(data.linkNext);
            setPages(data.pages);
            return data;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    //Gửi thông báo đến tất cả
    const sendAlertToAll = useCallback(async (header: string, body: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await alertService.sendAlertToAll(header, body);
            return data;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    //Xóa thông báo
    const deleteAlert = useCallback(async (alertID: string, createdAt: string, senderID: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await alertService.deleteAlert(alertID, createdAt, senderID);
            return data;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    //Cập nhật thông báo
    const updateAlert = useCallback(async (alertId: string, header?: string, body?: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await alertService.updateAlert(alertId, header, body);
            return data;
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Gửi thông báo đến người dùng cụ thể
    const sendAlertPersonal = useCallback(async (header: string, body: string, receiversID: string[]) => {
        try {
            setLoading(true);
            setError('');
            const data = await alertService.sendAlertPersonal(header, body, receiversID);
            return data;
        } catch (error: any) {
            setError(error.message || 'Failed to send alert');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        alerts,
        total,
        currentPage,
        pageSize,
        linkPrev,
        linkNext,
        pages,

        getAlerts,
        searchAlerts,
        sendAlertToAll,
        deleteAlert,
        updateAlert,
        sendAlertPersonal
    };
};