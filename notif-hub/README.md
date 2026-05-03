# Notif Hub

デスクトップ常駐型の通知統合ツール。Slack / Notion / Gmail / Figma の通知を一元管理し、**Claude Agent SDK + MCP** で各サービスに直接アクセスして、返信文の生成・送信を行う。

## 機能

- 各サービスの通知をデスクトップに常駐表示（フローティング・ミニウィンドウ）
- 通知をクリックすると詳細表示
- 指示を書き込むとClaudeが返信文を自動生成
- 送信ボタンで実際に各サービスに返信送信
- 全サービスへのアクセスは Claude Agent SDK + MCP 経由（独自APIラッパー不要）

## 対応サービス

- ✅ Slack（MCP）
- ✅ Gmail（MCP）
- ✅ Notion（MCP）
- ✅ Figma（MCP）

## 技術スタック

- **Electron**: デスクトップアプリのフレームワーク
- **React + TypeScript + Vite**: UIレイヤー
- **Tailwind CSS**: スタイリング
- **@anthropic-ai/claude-agent-sdk**: Claude Agent SDK（Node.js 20+ 必須）

## なぜ Agent SDK + MCP なのか

各サービスのAPIラッパーを自前で実装する代わりに：

- **MCP** でSlack/Gmail/Notion/Figmaへのアクセスを統一
- **Agent SDK** がツール呼び出しのオーケストレーションを担当
- 認証情報の管理は MCP サーバー側に委譲（claude.ai に登録済みのコネクター情報を活用）
- ユーザー指示 → Claude が必要なMCPツールを自動選択 → 返信送信、まで一気通貫

## アーキテクチャ

```
┌────────────────────────────────────────────────┐
│  Electron Main Process (Node.js)               │
│  ┌──────────────────────────────────────────┐ │
│  │  Notification Poller                     │ │
│  │  （定期的に各MCPサービスをチェック）     │ │
│  └──────────────────────────────────────────┘ │
│                    ↓                           │
│  ┌──────────────────────────────────────────┐ │
│  │  Claude Agent SDK Wrapper                │ │
│  │  - mcpServers: { slack, gmail, ... }     │ │
│  │  - generateReply(notification, prompt)   │ │
│  │  - sendReply(notification, replyText)    │ │
│  └──────────────────────────────────────────┘ │
│                    ↓ IPC                       │
│  ┌──────────────────────────────────────────┐ │
│  │  Renderer (React)                        │ │
│  │  - Floating mini-window                  │ │
│  │  - Notification list / detail            │ │
│  │  - Reply composer                        │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
                    ↓ stdio
        ┌────────────────────────────┐
        │  MCP Servers (各サービス)  │
        │  - Slack MCP               │
        │  - Gmail MCP               │
        │  - Notion MCP              │
        │  - Figma MCP               │
        └────────────────────────────┘
```

## 開発フェーズ

- [ ] **Phase 1**: Electron常駐ウィンドウ + Agent SDKで返信生成（モック通知）
- [ ] **Phase 2**: 1つのMCP（Gmail）を実接続して送受信
- [ ] **Phase 3**: 残りMCP（Slack / Notion / Figma）追加
- [ ] **Phase 4**: 通知ポーリングの自動化と通知の永続化
