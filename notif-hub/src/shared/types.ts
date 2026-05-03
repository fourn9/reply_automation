// 共通型定義

export type ServiceType = 'slack' | 'gmail' | 'notion' | 'figma';

export interface Notification {
  id: string;
  service: ServiceType;
  channel?: string;
  sender: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: number;
  threadId?: string; // 返信先の特定用
  url?: string;
  isRead: boolean;
  // サービス固有の追加データ
  metadata?: Record<string, unknown>;
}

export interface ReplyDraft {
  notificationId: string;
  instruction: string;
  generatedText: string;
  editedText?: string;
}
