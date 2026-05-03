// 通知リストコンポーネント

import type { Notification, ServiceType } from '../../shared/types';

// サービスごとのアイコンと色設定
const SERVICE_CONFIG: Record<
  ServiceType,
  { label: string; color: string }
> = {
  slack: { label: 'Slack', color: 'text-green-400' },
  gmail: { label: 'Gmail', color: 'text-red-400' },
  notion: { label: 'Notion', color: 'text-gray-300' },
  figma: { label: 'Figma', color: 'text-purple-400' },
};

function formatTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  return `${Math.floor(diffHour / 24)}日前`;
}

interface NotificationListProps {
  notifications: Notification[];
  onSelect: (notification: Notification) => void;
}

export function NotificationList({
  notifications,
  onSelect,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        通知はありません
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {notifications.map((notif) => {
        const svc = SERVICE_CONFIG[notif.service];
        return (
          <button
            key={notif.id}
            onClick={() => onSelect(notif)}
            className="w-full text-left px-3 py-2.5 border-b border-gray-700/50 hover:bg-gray-700/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-medium ${svc.color}`}>
                  {svc.label}
                </span>
                {notif.channel && (
                  <span className="text-xs text-gray-500">{notif.channel}</span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTime(notif.timestamp)}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-medium mb-0.5">
              {notif.sender.name}
            </div>
            <div className="text-xs text-gray-300 truncate">{notif.content}</div>
            {!notif.isRead && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
