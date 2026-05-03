# 設計ドキュメント

## 1. UI設計

### メインウィンドウ（フローティング・ミニウィンドウ）

- **サイズ**: 360px × 480px（折りたたみ時は 360px × 80px）
- **位置**: 画面右下に固定（ドラッグで移動可能）
- **常に最前面**: `alwaysOnTop: true`
- **透過**: 半透明背景

### 画面構成

```
┌──────────────────────────────┐
│ ☰ Notif Hub          ─ □ ✕  │ ← ヘッダー
├──────────────────────────────┤
│ 🟢 Slack   #general    2分前│
│ 田中: ミーティング資料の…    │
├──────────────────────────────┤
│ 📧 Gmail              5分前 │
│ クライアント: 見積書につ…    │
├──────────────────────────────┤
│ 📝 Notion             10分前│
│ コメント: このセクション…    │
└──────────────────────────────┘
        ↓ クリックで展開
┌──────────────────────────────┐
│ ← Slack #general              │
│ 田中: ミーティング資料の進捗│
│ どうですか？                 │
├──────────────────────────────┤
│ 💬 指示を入力                │
│ ┌──────────────────────────┐│
│ │ 明日中に共有予定と返信   ││
│ └──────────────────────────┘│
│ [生成] ボタン                │
├──────────────────────────────┤
│ 生成された返信:              │
│ ┌──────────────────────────┐│
│ │ ありがとうございます。   ││
│ │ 明日中に共有予定です！   ││
│ └──────────────────────────┘│
│ [編集] [送信]                │
└──────────────────────────────┘
```

## 2. ディレクトリ構造

```
notif-hub/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts             # エントリポイント
│   │   ├── window.ts            # ウィンドウ管理
│   │   ├── ipc.ts               # IPC ハンドラ
│   │   ├── poller.ts            # 通知ポーリング
│   │   └── agent/
│   │       ├── client.ts        # Agent SDK のラッパー
│   │       ├── mcp-config.ts    # MCP サーバー設定
│   │       └── prompts.ts       # システムプロンプト
│   ├── renderer/                # React UI
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── NotificationList.tsx
│   │   │   ├── NotificationDetail.tsx
│   │   │   ├── ReplyComposer.tsx
│   │   │   └── Header.tsx
│   │   └── hooks/
│   │       └── useNotifications.ts
│   ├── shared/
│   │   ├── types.ts             # 共通型定義
│   │   └── ipc-channels.ts      # IPCチャンネル名
│   └── preload/
│       └── index.ts             # contextBridge
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

## 3. Agent SDK の使い方

### 3.1 基本パターン

Agent SDKの `query()` を使い、MCP経由で各サービスにアクセスします：

```typescript
// src/main/agent/client.ts
import { query, type Options } from '@anthropic-ai/claude-agent-sdk';
import { getMcpServers } from './mcp-config';

const options: Options = {
  model: 'claude-opus-4-7',
  mcpServers: getMcpServers(),
  // Agent SDKがClaude Codeのバイナリをバンドルしているので追加設定不要
  // 使用するMCPツールだけ許可
  allowedTools: [
    'mcp__slack__*',
    'mcp__gmail__*',
    'mcp__notion__*',
    'mcp__figma__*',
  ],
};

export async function generateReply(params: {
  notification: Notification;
  instruction: string;
}): Promise<string> {
  const prompt = buildPrompt(params);
  let result = '';
  
  for await (const message of query({ prompt, options })) {
    if (message.type === 'result' && message.subtype === 'success') {
      result = message.result;
    }
  }
  return result;
}

export async function sendReply(params: {
  notification: Notification;
  replyText: string;
}): Promise<void> {
  const prompt = `
以下の${params.notification.service}メッセージに、次の本文で返信してください。
追加のコメントや確認は不要です。即座に送信ツールを使ってください。

【元メッセージ】
${JSON.stringify(params.notification, null, 2)}

【返信本文】
${params.replyText}
  `;
  
  for await (const message of query({ prompt, options })) {
    // 送信完了まで待機（必要に応じてログ出力）
  }
}
```

### 3.2 MCP サーバー設定

Phase 1 ではモックで動かし、Phase 2 以降で実際のMCPサーバーを接続：

```typescript
// src/main/agent/mcp-config.ts
import type { McpServerConfig } from '@anthropic-ai/claude-agent-sdk';

export function getMcpServers(): Record<string, McpServerConfig> {
  // Phase 1: 空でOK（モックで動かす）
  if (process.env.PHASE === '1') {
    return {};
  }
  
  return {
    // Gmail (公式MCP, HTTP)
    gmail: {
      type: 'http',
      url: 'https://gmailmcp.googleapis.com/mcp/v1',
      headers: {
        Authorization: `Bearer ${process.env.GMAIL_OAUTH_TOKEN}`,
      },
    },
    // Slack (公式MCP, HTTP)
    slack: {
      type: 'http',
      url: 'https://mcp.slack.com/mcp',
      headers: {
        Authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
      },
    },
    // Notion (公式MCP, HTTP)
    notion: {
      type: 'http',
      url: 'https://mcp.notion.com/mcp',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_OAUTH_TOKEN}`,
      },
    },
    // Figma (公式MCP, HTTP)
    figma: {
      type: 'http',
      url: 'https://mcp.figma.com/mcp',
      headers: {
        Authorization: `Bearer ${process.env.FIGMA_OAUTH_TOKEN}`,
      },
    },
  };
}
```

**重要**: HTTP transport の場合、`Accept: application/json, text/event-stream` ヘッダの問題があるバージョンが過去存在したため、Agent SDK は最新版（v0.2.111以降）を使うこと。

### 3.3 プロンプト設計

```typescript
// src/main/agent/prompts.ts

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
```

## 4. データ型

```typescript
// shared/types.ts

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
  threadId?: string;        // 返信先の特定用
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
```

## 5. IPC設計

```typescript
// shared/ipc-channels.ts
export const IPC = {
  // Renderer → Main
  GET_NOTIFICATIONS: 'get-notifications',
  GENERATE_REPLY: 'generate-reply',
  SEND_REPLY: 'send-reply',
  MARK_AS_READ: 'mark-as-read',
  REFRESH: 'refresh',
  
  // Main → Renderer
  NOTIFICATIONS_UPDATED: 'notifications-updated',
  REPLY_SENT: 'reply-sent',
  ERROR: 'error',
} as const;
```

## 6. ウィンドウ設定

```typescript
const win = new BrowserWindow({
  width: 360,
  height: 480,
  alwaysOnTop: true,
  frame: false,
  transparent: true,
  resizable: true,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});

// 画面右下に配置
const { width: w, height: h } = screen.getPrimaryDisplay().workAreaSize;
win.setPosition(w - 380, h - 500);
```

## 7. 返信フローの設計（全サービス共通）

このアプリの中心機能。Gmail の「AI で返信を作成」と同じ体験をすべてのサービスで実現する。

```
[通知一覧] → クリック → [通知詳細]
                              ↓
                        返信の概要を入力
                        例:「明日中に共有予定と返信」
                              ↓
                        [✨ AI で下書き生成]
                              ↓
                        生成された返信文を表示
                        ユーザーが編集可能
                              ↓
                        [承認して送信] ← MCP 経由で各サービスに実送信
```

**ポイント:**
- AI 生成は任意。直接テキストを書いて送ることも可能
- 生成後に編集してから送れる（承認フロー）
- 送信先サービス（Gmail / Slack / Notion / Figma）は通知から自動判定
- すべてこのウィンドウ1つで完結

## 8. 開発の進め方

### Phase 1: 骨組み + 直接返信（完了）
1. Vite + React + TS + Electron セットアップ ✅
2. フローティングウィンドウ（画面右下）✅
3. モック通知3件表示（Slack / Gmail / Notion）✅
4. 通知クリックで詳細画面に遷移 ✅
5. 返信文を直接入力 → 「送信」はコンソール出力 ✅

### Phase 2: AI 下書き生成機能（全サービス共通）
1. Agent SDK 連携（MCP なし、テキスト生成のみ）
2. 概要入力 →「AI で下書き生成」ボタン → 返信文を提案
3. ユーザーが編集 or そのまま承認
4. 「承認して送信」→ コンソール出力（実送信は Phase 3 以降）
5. すべてのサービス（Gmail / Slack / Notion / Figma）共通のUIで動作確認

### Phase 3: Gmail 実送信（MCP 接続）
1. MCP HTTP transport で Gmail MCP に接続
2. 通知ポーリング（未読メールを取得）
3. AI 下書き → 承認 → Gmail に実送信 の E2E テスト

### Phase 4: Slack / Notion / Figma 実送信
1. それぞれの MCP を mcp-config に追加
2. サービス別の通知取得ロジック
3. AI 下書き → 承認 → 各サービスに実送信
4. 通知の重複排除と並び替え

### Phase 5: 自動化と永続化
1. 起動時に通知をローカル保存（electron-store）
2. 自動ポーリング間隔の設定 UI
3. 未読通知の macOS ネイティブ通知化（Notification API）
