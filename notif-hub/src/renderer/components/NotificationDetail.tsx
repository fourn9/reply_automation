// 通知詳細コンポーネント
// 元のメッセージ内容と返信作成UIを表示する

import type { Notification, ServiceType } from '../../shared/types';
import { ReplyComposer } from './ReplyComposer';

const SERVICE_CONFIG: Record<ServiceType, { label: string }> = {
  slack: { label: 'Slack' },
  gmail: { label: 'Gmail' },
  notion: { label: 'Notion' },
  figma: { label: 'Figma' },
};

function formatTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '今';
  if (diffMin < 60) return `${diffMin}分前`;
  return `${Math.floor(diffMin / 60)}時間前`;
}

interface NotificationDetailProps {
  notification: Notification;
}

export function NotificationDetail({ notification }: NotificationDetailProps) {
  const svc = SERVICE_CONFIG[notification.service];

  return (
    <div className="overflow-y-auto flex-1">
      {/* 元メッセージ */}
      <div className="px-3 py-2.5 border-b border-gray-700/50">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs text-gray-400">
            {svc.label}
            {notification.channel && ` ${notification.channel}`}
          </span>
          <span className="text-xs text-gray-600 ml-auto">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        <div className="text-xs text-gray-300 font-medium mb-1">
          {notification.sender.name}
        </div>
        <div className="text-xs text-gray-200 leading-relaxed">
          {notification.content}
        </div>
      </div>

      {/* 返信作成 */}
      <ReplyComposer notification={notification} />
    </div>
  );
}
