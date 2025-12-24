import type { NotificationInstance } from 'antd/es/notification/interface';

// Global notification instance for use in utility functions
let globalNotificationInstance: NotificationInstance | null = null;

export const setGlobalNotification = (notificationInstance: NotificationInstance) => {
  globalNotificationInstance = notificationInstance;
};

export const getGlobalNotification = (): NotificationInstance | null => {
  return globalNotificationInstance;
};
