// Agent SDK ラッパー
// テキスト生成 / Gmail 通知取得 / 返信送信をまとめて管理

import type { Notification } from '../../shared/types.js';
import { buildReplyGenerationPrompt } from './prompts.js';

/** Agent SDK の dynamic import（ESM-only パッケージ対応） */
async function getQuery() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdk = (await import('@anthropic-ai/claude-agent-sdk')) as any;
  return sdk.query as (params: { prompt: string; options: unknown }) => AsyncIterable<unknown>;
}

/** 共通オプション */
const BASE_OPTIONS = {
  model: 'claude-opus-4-7',
  mcpServers: {},
};

// --------------------
// 返信文生成（Phase 2）
// --------------------

export async function generateReply(params: {
  notification: Notification;
  instruction: string;
}): Promise<string> {
  const query = await getQuery();
  const prompt = buildReplyGenerationPrompt(params);
  let result = '';

  try {
    for await (const message of query({ prompt, options: BASE_OPTIONS })) {
      const msg = message as { type: string; subtype?: string; result?: string };
      if (msg.type === 'result' && msg.subtype === 'success') {
        result = msg.result ?? '';
      }
    }
  } catch (err) {
    console.error('[Agent] generateReply error:', err);
    throw err;
  }

  return result;
}

// --------------------
// Gmail 未読取得（Phase 3）
// --------------------

export async function fetchGmailNotifications(): Promise<Notification[]> {
  const query = await getQuery();

  const prompt = `Use mcp__claude_ai_Gmail__search_threads to find up to 5 unread emails (query: "is:unread").
For each thread, get details using mcp__claude_ai_Gmail__get_thread.
Return ONLY a JSON array (no markdown, no explanation) in this exact format:
[
  {
    "id": "<threadId>",
    "sender": "<sender name or email>",
    "subject": "<subject>",
    "snippet": "<first 100 chars of body>",
    "timestamp": <unix timestamp in milliseconds>
  }
]
If there are no unread emails, return an empty array: []`;

  let raw = '';

  try {
    for await (const message of query({
      prompt,
      options: {
        ...BASE_OPTIONS,
        allowedTools: [
          'mcp__claude_ai_Gmail__search_threads',
          'mcp__claude_ai_Gmail__get_thread',
        ],
      },
    })) {
      const msg = message as { type: string; subtype?: string; result?: string };
      if (msg.type === 'result' && msg.subtype === 'success') {
        raw = msg.result ?? '';
      }
    }
  } catch (err) {
    console.error('[Agent] fetchGmailNotifications error:', err);
    throw err;
  }

  // JSON 部分を抽出してパース
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('[Agent] Gmail: JSON not found in result:', raw.slice(0, 200));
    return [];
  }

  type GmailRaw = {
    id: string;
    sender: string;
    subject: string;
    snippet: string;
    timestamp: number;
  };

  const items: GmailRaw[] = JSON.parse(jsonMatch[0]);

  return items.map((item) => ({
    id: `gmail-${item.id}`,
    service: 'gmail' as const,
    sender: { name: item.sender },
    content: `${item.subject}\n${item.snippet}`,
    timestamp: item.timestamp || Date.now(),
    threadId: item.id,
    isRead: false,
  }));
}

// --------------------
// Gmail 返信送信（Phase 3）
// --------------------

export async function sendGmailReply(params: {
  notification: Notification;
  replyText: string;
}): Promise<void> {
  const query = await getQuery();

  if (!params.notification.threadId) {
    throw new Error('threadId が取得できていません');
  }

  const prompt = `Reply to Gmail thread ID: ${params.notification.threadId}

Use mcp__claude_ai_Gmail__create_draft to create a draft reply with this body:
---
${params.replyText}
---

After creating the draft, confirm it was created successfully. Do not send it automatically.`;

  try {
    for await (const message of query({
      prompt,
      options: {
        ...BASE_OPTIONS,
        allowedTools: ['mcp__claude_ai_Gmail__create_draft'],
      },
    })) {
      const msg = message as { type: string; subtype?: string };
      if (msg.type === 'result' && msg.subtype !== 'success') {
        console.error('[Agent] sendGmailReply failed:', msg);
      }
    }
  } catch (err) {
    console.error('[Agent] sendGmailReply error:', err);
    throw err;
  }
}
