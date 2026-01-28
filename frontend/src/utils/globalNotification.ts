import type { NotificationInstance } from 'antd/es/notification/interface';

let globalNotificationInstance: NotificationInstance | null = null;

export const setGlobalNotification = (notificationInstance: NotificationInstance) => {
  globalNotificationInstance = notificationInstance;
};

export const getGlobalNotification = (): NotificationInstance | null => {
  return globalNotificationInstance;
};
