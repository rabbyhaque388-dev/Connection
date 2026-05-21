import { useState, useEffect, useCallback } from 'react';
import API from '../api/client';

/**
 * useNotifications — Fetch, manage and mark user notifications.
 *
 * Returns:
 *  - notifications: array of notification objects
 *  - unreadCount:   count of unread notifications
 *  - loading:       loading boolean
 *  - markAsRead:    mark a single notification read
 *  - markAllRead:   mark all notifications as read
 *  - refetch:       manually refresh the list
 */
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notifId) => {
    try {
      await API.put(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    refetch: fetchNotifications
  };
};

export default useNotifications;
