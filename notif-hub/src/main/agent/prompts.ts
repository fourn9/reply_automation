// プロンプト生成ユーティリティ

import type { Notification } from '../../shared/types.js';

export function buildReplyGenerationPrompt(params: {
  notification: Notification;
  instruction: string;
}): string {
  return `あなたはユーザー（Kimu）の返信アシスタントです。

【元のメッセージ】
サービス: ${params.notification.service}
${params.notification.channel ? `チャンネル: ${params.notification.channel}` : ''}
送信者: ${params.notification.sender.name}
内容: ${params.notification.content}

【ユーザーからの指示】
${params.instruction}

【出力ルール】
- ${params.notification.service}の慣習に合わせた文体
- 自然で丁寧な日本語ビジネスコミュニケーション
- 過度な敬語・二重敬語は避ける
- ユーザー本人の声に近い、自然な日本語
- 返信文のみを出力（前置きや解説は不要）
- MCPツールはこの段階では使わない（生成のみ）`;
}

export function buildSendPrompt(params: {
  notification: Notification;
  replyText: string;
}): string {
  return `以下の${params.notification.service}メッセージに、指定された本文で返信してください。
即座にMCPツールを使って送信し、確認や追加質問は不要です。

【元メッセージ】
${JSON.stringify(params.notification, null, 2)}

【返信本文】
${params.replyText}`;
}
