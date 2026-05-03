// メインアプリコンポーネント
// 画面状態: list (通知一覧) | detail (通知詳細)

import { useState } from 'react';
import type { Notification, ServiceType } from '../shared/types';
import { Header } from './components/Header';
import { NotificationList } from './components/NotificationList';
import { NotificationDetail } from './components/NotificationDetail';
import { useNotifications } from './hooks/useNotifications';

const SERVICE_LABEL: Record<ServiceType, string> = {
  slack: 'Slack',
  gmail: 'Gmail',
  notion: 'Notion',
  figma: 'Figma',
};

type View = { type: 'list' } | { type: 'detail'; notification: Notification };

export default function App() {
  const [view, setView] = useState<View>({ type: 'list' });
  const { notifications, isLoading, error, refresh } = useNotifications();

  const handleSelect = (notification: Notification) => {
    setView({ type: 'detail', notification });
  };

  const handleBack = () => {
    setView({ type: 'list' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900/85 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-gray-700/30">
      {/* ヘッダー */}
      {view.type === 'list' ? (
        <Header title={`Notif Hub${notifications.length > 0 ? ` (${notifications.length})` : ''}`} />
      ) : (
        <Header
          onBack={handleBack}
          title={SERVICE_LABEL[view.notification.service]}
        />
      )}

      {/* コンテンツ */}
      {view.type === 'list' ? (
        <>
          {isLoading && (
            <div className="flex items-center justify-center flex-1 text-gray-500 text-sm">
              読み込み中...
            </div>
          )}
          {error && (
            <div className="p-3 text-red-400 text-xs">{error}</div>
          )}
          {!isLoading && !error && (
            <>
              <NotificationList
                notifications={notifications}
                onSelect={handleSelect}
              />
              <div className="px-3 py-2 border-t border-gray-700/50">
                <button
                  onClick={refresh}
                  className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  更新
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <NotificationDetail notification={view.notification} />
      )}
    </div>
  );
}
