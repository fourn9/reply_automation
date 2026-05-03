// MCP サーバー設定

// Agent SDK の McpServerConfig 型に合わせた定義
export interface McpServerConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

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
