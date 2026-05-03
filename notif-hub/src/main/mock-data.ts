// モック通知データ（Phase 1 動作確認用）

import type { Notification } from '../shared/types.js';

export function getMockNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: 'mock-1',
      service: 'slack',
      channel: '#general',
      sender: { name: '田中さん' },
      content:
        'ミーティング資料の進捗どうですか？明日の午前中に共有できれば助かります。',
      timestamp: now - 2 * 60 * 1000, // 2分前
      isRead: false,
    },
    {
      id: 'mock-2',
      service: 'gmail',
      sender: { name: 'クライアント（鈴木様）' },
      content:
        '先日ご提示いただいた見積書についてですが、いくつか確認させてください。',
      timestamp: now - 5 * 60 * 1000, // 5分前
      isRead: false,
    },
    {
      id: 'mock-3',
      service: 'notion',
      sender: { name: '山田さん' },
      content:
        'このセクションの説明、もう少し詳しく書いてもらえますか？特に実装手順のあたりが気になります。',
      timestamp: now - 10 * 60 * 1000, // 10分前
      isRead: false,
    },
  ];
}
