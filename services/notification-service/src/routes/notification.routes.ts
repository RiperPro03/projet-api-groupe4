import { Router } from "express";

import {
  createNotificationHandler,
  deleteNotificationHandler,
  listNotificationsHandler,
  markAllNotificationsAsReadHandler,
  markNotificationAsReadHandler,
  unreadCountHandler,
} from "../controllers/notification.controller.js";

const router = Router();

router.post("/notifications", createNotificationHandler);
router.get("/notifications/unread-count", unreadCountHandler);
router.get("/notifications", listNotificationsHandler);
router.patch("/notifications/read-all", markAllNotificationsAsReadHandler);
router.patch("/notifications/:id/read", markNotificationAsReadHandler);
router.delete("/notifications/:id", deleteNotificationHandler);

export default router;
