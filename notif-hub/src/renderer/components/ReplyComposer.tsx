// 返信作成コンポーネント（Phase 1）
// 返信文を直接入力 → 送信ボタンで送る
// Phase 2 以降で「AI で下書き補完」機能を追加予定

import { useState } from 'react';
import type { Notification } from '../../shared/types';

interface ReplyComposerProps {
  notification: Notification;
}

export function ReplyComposer({ notification }: ReplyComposerProps) {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    setError(null);

    try {
      await window.electron.sendReply({ notification, replyText });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="p-3 text-center space-y-2">
        <div className="text-green-400 text-sm font-medium">✓ 送信しました</div>
        <div className="text-gray-500 text-xs">（Phase 1: コンソール出力）</div>
        <button
          onClick={() => { setSent(false); setReplyText(''); }}
          className="text-xs text-gray-400 hover:text-gray-200 underline"
        >
          別の返信を書く
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <label className="text-xs text-gray-400 block">返信を入力</label>
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder={`${notification.sender.name} への返信...`}
        rows={5}
        className="w-full bg-gray-800/60 border border-gray-600/50 rounded text-xs text-gray-200 px-2 py-2 resize-none focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
        autoFocus
      />

      {error && (
        <div className="text-red-400 text-xs bg-red-900/20 px-2 py-1.5 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!replyText.trim() || isSending}
        className="w-full bg-blue-600/80 hover:bg-blue-500/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded transition-colors"
      >
        {isSending ? '送信中...' : '📤 送信'}
      </button>

      {/* Phase 2 で追加予定のAI補完ボタン（ダミー表示） */}
      <button
        disabled
        className="w-full border border-gray-600/30 text-gray-600 text-xs py-1.5 rounded cursor-not-allowed"
        title="Phase 2 で実装予定"
      >
        ✨ AI で補完（Phase 2）
      </button>
    </div>
  );
}
