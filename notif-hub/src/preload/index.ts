// Preload スクリプト
// contextBridge を使って Renderer に安全な API を公開する

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels.js';
import type { Notification } from '../shared/types.js';

// Renderer プロセスに公開する API
const electronAPI = {
  getNotifications: (): Promise<Notification[]> =>
    ipcRenderer.invoke(IPC.GET_NOTIFICATIONS),

  generateReply: (params: {
    notification: Notification;
    instruction: string;
  }): Promise<string> => ipcRenderer.invoke(IPC.GENERATE_REPLY, params),

  sendReply: (params: {
    notification: Notification;
    replyText: string;
  }): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC.SEND_REPLY, params),

  markAsRead: (notificationId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC.MARK_AS_READ, notificationId),
};

contextBridge.exposeInMainWorld('electron', electronAPI);

// TypeScript の型補完用の型宣言は src/renderer/electron.d.ts に定義
