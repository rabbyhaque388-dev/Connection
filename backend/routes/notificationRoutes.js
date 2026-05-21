import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { protectRoute as protect } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// GET  /api/notifications         — Fetch all notifications for current user
router.get('/', getNotifications);

// PUT  /api/notifications/read-all — Mark all notifications as read (must be before :id route)
router.put('/read-all', markAllNotificationsRead);

// PUT  /api/notifications/:id/read — Mark single notification as read
router.put('/:id/read', markNotificationRead);

// DELETE /api/notifications/:id   — Delete a notification
router.delete('/:id', deleteNotification);

export default router;
