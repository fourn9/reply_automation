// IPC チャンネル名定義

export const IPC = {
  // Renderer → Main
  GET_NOTIFICATIONS: 'get-notifications',
  GENERATE_REPLY: 'generate-reply',
  SEND_REPLY: 'send-reply',
  MARK_AS_READ: 'mark-as-read',
  REFRESH: 'refresh',

  // Main → Renderer
  NOTIFICATIONS_UPDATED: 'notifications-updated',
  REPLY_SENT: 'reply-sent',
  ERROR: 'error',
} as const;
