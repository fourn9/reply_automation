// IPC ハンドラ定義
// Renderer <-> Main の通信を管理する

import { ipcMain } from 'electron';
import { IPC } from '../shared/ipc-channels.js';
import type { Notification } from '../shared/types.js';
import { generateReply, fetchGmailNotifications, sendGmailReply } from './agent/client.js';
import { getMockNotifications } from './mock-data.js';

/** Phase 3 以降: 実 Gmail を使うかどうか */
const USE_REAL_GMAIL = process.env.PHASE === '3' || process.env.USE_REAL_GMAIL === 'true';

export function registerIpcHandlers(): void {
  // 通知一覧取得
  ipcMain.handle(IPC.GET_NOTIFICATIONS, async () => {
    if (USE_REAL_GMAIL) {
      console.log('[IPC] Gmail から未読メールを取得中...');
      try {
        const gmailNotifs = await fetchGmailNotifications();
        console.log(`[IPC] Gmail 通知: ${gmailNotifs.length} 件`);
        // Gmail + モック(Slack, Notion) を合わせて返す
        const mockNotifs = getMockNotifications().filter(n => n.service !== 'gmail');
        return [...gmailNotifs, ...mockNotifs];
      } catch (err) {
        console.error('[IPC] Gmail 取得失敗、モックにフォールバック:', err);
        return getMockNotifications();
      }
    }
    return getMockNotifications();
  });

  // 返信文生成
  ipcMain.handle(
    IPC.GENERATE_REPLY,
    async (_event, params: { notification: Notification; instruction: string }) => {
      console.log('[IPC] generate-reply:', params.notification.service, params.notification.id);
      return await generateReply(params);
    },
  );

  // 返信送信
  ipcMain.handle(
    IPC.SEND_REPLY,
    async (_event, params: { notification: Notification; replyText: string }) => {
      // Gmail の場合は MCP 経由で下書き作成
      if (USE_REAL_GMAIL && params.notification.service === 'gmail') {
        console.log('[IPC] Gmail 返信下書きを作成中...');
        await sendGmailReply(params);
        console.log('[IPC] Gmail 下書き作成完了');
        return { success: true };
      }

      // それ以外はコンソール出力（Phase 4 で各サービスに対応）
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
      return { success: true };
    },
  );

  // 既読にする
  ipcMain.handle(IPC.MARK_AS_READ, async (_event, notificationId: string) => {
    console.log('[IPC] mark-as-read:', notificationId);
    return { success: true };
  });
}
