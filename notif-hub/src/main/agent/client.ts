// Agent SDK ラッパー
// Agent SDK は ESM-only のため dynamic import() を使用

import type { Notification } from '../../shared/types.js';
import { buildReplyGenerationPrompt } from './prompts.js';

/**
 * Agent SDK を使って返信文を生成する（Phase 1: MCPなし）
 * ESM-only パッケージのため dynamic import を使用
 */
export async function generateReply(params: {
  notification: Notification;
  instruction: string;
}): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { query } = (await import('@anthropic-ai/claude-agent-sdk')) as any;

  const prompt = buildReplyGenerationPrompt(params);
  let result = '';

  try {
    for await (const message of query({
      prompt,
      options: {
        model: 'claude-opus-4-7',
        mcpServers: {},
      },
    })) {
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
