// 返信作成コンポーネント（Phase 2）
// Gmail AI と同じフロー:
//   概要入力 → AI 下書き生成 → 編集 → 承認して送信
// 直接入力モードも残す（AI なしで送れる）

import { useState } from 'react';
import type { Notification } from '../../shared/types';

type Mode = 'ai' | 'direct';

interface ReplyComposerProps {
  notification: Notification;
}

export function ReplyComposer({ notification }: ReplyComposerProps) {
  const [mode, setMode] = useState<Mode>('ai');

  // AI モード
  const [summary, setSummary] = useState('');
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // 共通
  const [directText, setDirectText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!summary.trim()) return;
    setIsGenerating(true);
    setGenerateError(null);
    setDraft('');

    try {
      const text = await window.electron.generateReply({
        notification,
        instruction: summary,
      });
      setDraft(text);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'AI 生成に失敗しました',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    const replyText = mode === 'ai' ? draft : directText;
    if (!replyText.trim()) return;
    setIsSending(true);
    setSendError(null);

    try {
      await window.electron.sendReply({ notification, replyText });
      setSent(true);
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : '送信に失敗しました',
      );
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="p-3 text-center space-y-2">
        <div className="text-green-400 text-sm font-medium">✓ 送信しました</div>
        <div className="text-gray-500 text-xs">（Phase 3 以降で実送信に切り替わります）</div>
        <button
          onClick={() => {
            setSent(false);
            setSummary('');
            setDraft('');
            setDirectText('');
          }}
          className="text-xs text-gray-400 hover:text-gray-200 underline"
        >
          別の返信を書く
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {/* モード切り替え */}
      <div className="flex gap-1 bg-gray-800/60 rounded p-0.5">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 text-xs py-1 rounded transition-colors ${
            mode === 'ai'
              ? 'bg-blue-600/80 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          ✨ AI 下書き
        </button>
        <button
          onClick={() => setMode('direct')}
          className={`flex-1 text-xs py-1 rounded transition-colors ${
            mode === 'direct'
              ? 'bg-gray-600/80 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          ✏️ 直接入力
        </button>
      </div>

      {mode === 'ai' ? (
        <>
          {/* 概要入力 */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              返信の概要を入力
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  void handleGenerate();
                }
              }}
              placeholder="例: 明日中に共有予定と返信"
              rows={2}
              className="w-full bg-gray-800/60 border border-gray-600/50 rounded text-xs text-gray-200 px-2 py-1.5 resize-none focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
              autoFocus
            />
            <button
              onClick={handleGenerate}
              disabled={!summary.trim() || isGenerating}
              className="mt-1.5 w-full bg-blue-600/80 hover:bg-blue-500/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 rounded transition-colors"
            >
              {isGenerating ? '⏳ 生成中...' : '✨ AI で下書き生成  ⌘↵'}
            </button>
          </div>

          {generateError && (
            <div className="text-red-400 text-xs bg-red-900/20 px-2 py-1.5 rounded break-words">
              {generateError}
            </div>
          )}

          {/* 生成された下書き */}
          {draft && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                生成された返信（編集できます）
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                className="w-full bg-gray-800/60 border border-blue-500/30 rounded text-xs text-gray-200 px-2 py-1.5 resize-none focus:outline-none focus:border-blue-500/50"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 border border-gray-600/50 text-gray-400 hover:text-gray-200 text-xs py-1.5 rounded transition-colors disabled:opacity-40"
                >
                  🔄 再生成
                </button>
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || isSending}
                  className="flex-[2] bg-green-600/80 hover:bg-green-500/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 rounded transition-colors"
                >
                  {isSending ? '送信中...' : '✅ 承認して送信'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* 直接入力モード */
        <>
          <textarea
            value={directText}
            onChange={(e) => setDirectText(e.target.value)}
            placeholder={`${notification.sender.name} への返信...`}
            rows={6}
            className="w-full bg-gray-800/60 border border-gray-600/50 rounded text-xs text-gray-200 px-2 py-2 resize-none focus:outline-none focus:border-blue-500/50 placeholder-gray-600"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!directText.trim() || isSending}
            className="w-full bg-blue-600/80 hover:bg-blue-500/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded transition-colors"
          >
            {isSending ? '送信中...' : '📤 送信'}
          </button>
        </>
      )}

      {sendError && (
        <div className="text-red-400 text-xs bg-red-900/20 px-2 py-1.5 rounded">
          {sendError}
        </div>
      )}
    </div>
  );
}
