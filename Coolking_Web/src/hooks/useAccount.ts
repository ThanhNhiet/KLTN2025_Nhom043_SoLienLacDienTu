import { useState, useCallback } from 'react';
import { accountService } from '../services/accountServices';

export interface Account {
    id: string;
    user_id: string;
    email: string;
    phone_number: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const useAccount = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [totalAccounts, setTotalAccounts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [linkPrev, setLinkPrev] = useState<string | null>(null);
    const [linkNext, setLinkNext] = useState<string | null>(null);
    const [pages, setPages] = useState<number[]>([]);

    const getAccounts = useCallback(async (page: number, pageSize: number) => {
        try {
            setLoading(true);
            setError('');
            const data = await accountService.getAccounts(page, pageSize);
            setAccounts(data.accounts || []);
            setTotalAccounts(data.total);
            setCurrentPage(page);
            setPageSize(pageSize);
            setLinkPrev(data.linkPrev);
            setLinkNext(data.linkNext);
            setPages(data.pages);
            return data;
        } catch (error: any) {
            setError('Failed to fetch accounts');
            console.error('Get accounts error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchAccounts = useCallback(async (keyword: string, page: number, pageSize: number) => {
        try {
            setLoading(true);
            setError('');
            const data = await accountService.searchAccounts(keyword, page, pageSize);
            setAccounts(data.accounts || []);
            setTotalAccounts(data.total);
            setCurrentPage(page);
            setPageSize(pageSize);
            setLinkPrev(data.linkPrev);
            setLinkNext(data.linkNext);
            setPages(data.pages);
            return data;
        } catch (error: any) {
            setError('Failed to search accounts');
            console.error('Search accounts error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const disableAccount = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await accountService.deleteAccount(userId);
            return data;
        } catch (error: any) {
            setError('Failed to disable account');
            console.error('Disable account error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const resetPassword = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError('');
            const data = await accountService.resetPassword(userId);
            return data;
        } catch (error: any) {
            setError('Failed to reset password');
            console.error('Reset password error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshAccounts = useCallback(() => {
        getAccounts(currentPage, pageSize);
    }, [getAccounts, currentPage, pageSize]);

    const createAccount = useCallback(async (accountData: Account) => {
        try {
            setLoading(true);
            setError('');
            const data = await accountService.createAccount(accountData);
            return data;
        } catch (error: any) {
            setError('Failed to create account');
            console.error('Create account error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateAccount = useCallback(async (userId: string, accountData: Partial<Account>) => {
        try {
            setLoading(true);
            setError('');
            const data = await accountService.updateAccount(userId, accountData);
            return data;
        } catch (error: any) {
            setError('Failed to update account');
            console.error('Update account error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getDetailInfoByID = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching details for userId:', userId);
            if (userId.startsWith('SV')) {
                const data = await accountService.getStudentInfo(userId);
                return data;
            } else if (userId.startsWith('LE')) {
                const data = await accountService.getLecturerInfo(userId);
                return data;
            } else if (userId.startsWith('PA')) {
                const data = await accountService.getParentInfo(userId);
                return data;
            } else {
                setError('Invalid user ID format');
                return null;
            }
        } catch (error: any) {
            setError('Failed to fetch account details');
            console.error('Get account details error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const getStaff4Admin = useCallback(async (staff_id: string) => {
        setLoading(true);
        setError('');
        try {
            const data = await accountService.getStaffInfo(staff_id);
            return data;
        } catch (error : any) {
            setError(error.message || 'Failed to fetch staff information');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        accounts,
        totalAccounts,
        currentPage,
        pageSize,
        linkPrev,
        linkNext,
        pages,
        getAccounts,
        searchAccounts,
        disableAccount,
        resetPassword,
        refreshAccounts,
        createAccount,
        updateAccount,
        getDetailInfoByID,
        getStaff4Admin
    };
};