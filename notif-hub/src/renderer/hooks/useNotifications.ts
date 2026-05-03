// 通知データ管理フック

import { useState, useEffect } from 'react';
import type { Notification } from '../../shared/types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await window.electron.getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { notifications, isLoading, error, refresh: load };
}
