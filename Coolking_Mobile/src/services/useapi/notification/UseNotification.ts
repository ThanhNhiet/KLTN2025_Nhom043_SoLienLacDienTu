import { getNotifications,
         markAsRead, 
         markSystemAsRead, 
         deleteSystemNotification 
} from "@/src/services/api/notification/NotificationApi";
import { set } from "date-fns";
import { useEffect, useState, useMemo } from "react";


export type NotificationItem = {
    _id: string;
    senderID: string;
    receiverID: string | null; // receiverID can be null
    header: string;
    body?: string;
    targetScope: string;
    isRead?: boolean;
    createdAt: string | number | Date;
    updatedAt?: string | number | Date;
};

export const UseNotification = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true); // Ensure loading is true at the start
            const data = await getNotifications(1, 10);
            if (data == null) {
                throw new Error("No data received");
            }
            setNotifications(data.alerts || []);
        } catch (error) {
            setError(error as any);
        } finally {
            setLoading(false);
        }
    };

    // useEffect(() => {
    //     fetchNotifications();
    // }, []);
    

    const markNotificationAsRead = async (alertId: string) => {
        try {
            setLoading(true);
            const data = await markAsRead(alertId);
            if (data == null) {
                throw new Error("Mark as read failed");
            }
            return data;
        } catch (error) {
            setError(error as any);
        } finally {
            setLoading(false);
        }
    };
    const markSystemNotificationAsRead = async (alertId: string) => {
        try {
            setLoading(true);
            const data = await markSystemAsRead(alertId);
            if (data == null) {
                throw new Error("Mark system as read failed");
            }
            return data;
        } catch (error) {
            setError(error as any);
        } finally {
            setLoading(false);
        }
    };

    const markAllNotificationsAsRead = async () => {   
        try {
            setLoading(true);
            const promises = notifications.map(notification => {
                if (notification.targetScope === "all" && notification.receiverID === null && !notification.isRead) {
                    return markSystemNotificationAsRead(notification._id);
                } else {
                    return markNotificationAsRead(notification._id);
                }
            });
            await Promise.all(promises);
        } catch (error) {
            setError(error as any);
        } finally {
            setLoading(false);
        }
    };

    const getDeleteSystemNotification = async (alertId: string) => {
        try {
            setLoading(true);
            const data = await deleteSystemNotification(alertId);
            if (data == null) {
                throw new Error("Delete system notification failed");
            }
            return data;
        } catch (error) {
            setError(error as any);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // gọi ngay lần đầu
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 60_000); // 1 phút

        return () => {
            clearInterval(interval); // cleanup khi unmount
        };
    }, []);




    return {
        notifications,
        setNotifications,
        loading,
        error,
        fetchNotifications,
        markNotificationAsRead,
        markSystemNotificationAsRead,
        markAllNotificationsAsRead,
        getDeleteSystemNotification
    };
}