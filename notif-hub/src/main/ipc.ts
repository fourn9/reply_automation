// IPC ハンドラ定義
// Renderer <-> Main の通信を管理する

import { ipcMain } from 'electron';
import { IPC } from '../shared/ipc-channels.js';
import type { Notification } from '../shared/types.js';
import { generateReply } from './agent/client.js';
import { getMockNotifications } from './mock-data.js';

export function registerIpcHandlers(): void {
  // 通知一覧取得
  ipcMain.handle(IPC.GET_NOTIFICATIONS, async () => {
    return getMockNotifications();
  });

  // 返信文生成
  ipcMain.handle(
    IPC.GENERATE_REPLY,
    async (
      _event,
      params: { notification: Notification; instruction: string },
    ) => {
      console.log('[IPC] generate-reply called:', params.notification.id);
      const text = await generateReply(params);
      return text;
    },
  );

  // 返信送信（Phase 1 はコンソール出力のみ）
  ipcMain.handle(
    IPC.SEND_REPLY,
    async (
      _event,
      params: { notification: Notification; replyText: string },
    ) => {
      console.log(
        '[SEND] 送信内容:',
        JSON.stringify(
          {
            service: params.notification.service,
            channel: params.notification.channel,
            sender: params.notification.sender.name,
            replyText: params.replyText,
          },
          null,
          2,
        ),
      );
      // Phase 2 で実送信に切り替え
      return { success: true };
    },
  );

  // 既読にする
  ipcMain.handle(IPC.MARK_AS_READ, async (_event, notificationId: string) => {
    console.log('[IPC] mark-as-read:', notificationId);
    return { success: true };
  });
}
