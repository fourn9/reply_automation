// Renderer プロセスで window.electron の型補完を提供する

import type { Notification } from '../shared/types';

declare global {
  interface Window {
    electron: {
      getNotifications: () => Promise<Notification[]>;
      generateReply: (params: {
        notification: Notification;
        instruction: string;
      }) => Promise<string>;
      sendReply: (params: {
        notification: Notification;
        replyText: string;
      }) => Promise<{ success: boolean }>;
      markAsRead: (notificationId: string) => Promise<{ success: boolean }>;
    };
  }
}
