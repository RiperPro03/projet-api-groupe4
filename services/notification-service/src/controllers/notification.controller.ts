import type { RequestHandler } from "express";

import {
  countUnreadNotifications,
  createNotification,
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationError,
} from "../services/notification.service.js";

function getTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getRouteParam(
  value: string | string[] | undefined
): string | null {
  const resolvedValue = Array.isArray(value) ? value[0] : value;

  return getTrimmedString(resolvedValue);
}

function parseLimit(value: unknown): number | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

function parseUnreadOnly(value: unknown): boolean {
  return value === "true" || value === "1";
}

export const createNotificationHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const notification = await createNotification({
      recipientId: req.body?.recipientId,
      actorId: req.body?.actorId,
      type: req.body?.type,
      resourceType: req.body?.resourceType,
      resourceId: req.body?.resourceId,
    });

    res.status(201).json({
      status: "success",
      message: "Notification created",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const listNotificationsHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const recipientId = getTrimmedString(req.query.recipientId);

    if (!recipientId) {
      throw new NotificationError("recipientId est requis", 400);
    }

    const page = await listNotifications(recipientId, {
      limit: parseLimit(req.query.limit),
      cursor: getTrimmedString(req.query.cursor),
      unreadOnly: parseUnreadOnly(req.query.unreadOnly),
    });

    res.status(200).json({
      status: "success",
      message: "Notifications retrieved",
      data: page,
    });
  } catch (error) {
    next(error);
  }
};

export const unreadCountHandler: RequestHandler = async (req, res, next) => {
  try {
    const recipientId = getTrimmedString(req.query.recipientId);

    if (!recipientId) {
      throw new NotificationError("recipientId est requis", 400);
    }

    const count = await countUnreadNotifications(recipientId);

    res.status(200).json({
      status: "success",
      message: "Unread count retrieved",
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsReadHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const notificationId = getRouteParam(req.params.id);

    if (!notificationId) {
      throw new NotificationError("id est requis", 400);
    }

    const notification = await markNotificationAsRead(notificationId);

    res.status(200).json({
      status: "success",
      message: "Notification marked as read",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsReadHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const recipientId = getTrimmedString(req.body?.recipientId);

    if (!recipientId) {
      throw new NotificationError("recipientId est requis", 400);
    }

    const updatedCount = await markAllNotificationsAsRead(recipientId);

    res.status(200).json({
      status: "success",
      message: "Notifications marked as read",
      data: { updatedCount },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotificationHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const notificationId = getRouteParam(req.params.id);

    if (!notificationId) {
      throw new NotificationError("id est requis", 400);
    }

    await deleteNotification(notificationId);

    res.status(200).json({
      status: "success",
      message: "Notification deleted",
    });
  } catch (error) {
    next(error);
  }
};
