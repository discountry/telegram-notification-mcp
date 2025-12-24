# telegram-notification-mcp

A minimal Telegram notification MCP server using only native Node.js APIs.

## Requirements

- Node.js >= 18.0.0
- Telegram Bot Token (get from [@BotFather](https://t.me/botfather))
- Telegram Chat ID (your chat ID or channel ID)

## Quick Start

Add the Telegram notification MCP server using the `claude mcp add` command:

```bash
claude mcp add --transport stdio telegram-notification \
  --env TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN \
  --env TELEGRAM_CHAT_ID=YOUR_CHAT_ID \
  -- npx -y telegram-notification-mcp
```

Replace `YOUR_BOT_TOKEN` and `YOUR_CHAT_ID` with your actual Telegram bot token and chat ID.

## Manual Setup

If you prefer to configure manually, add to your MCP configuration (e.g., `~/.cursor/mcp.json` or Claude Desktop settings):

```json
{
  "mcpServers": {
    "telegram-notification": {
      "command": "npx",
      "args": ["telegram-notification-mcp@latest"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "YOUR_TELEGRAM_BOT_TOKEN",
        "TELEGRAM_CHAT_ID": "YOUR_TELEGRAM_CHAT_ID"
      }
    }
  }
}
```

### Local Development

For local development, use an absolute path:

```json
{
  "mcpServers": {
    "telegram-notification": {
      "command": "node",
      "args": ["/absolute/path/to/telegram-notification-mcp/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "YOUR_TELEGRAM_BOT_TOKEN",
        "TELEGRAM_CHAT_ID": "YOUR_TELEGRAM_CHAT_ID"
      }
    }
  }
}
```

## Tools

### send_notification

Send a notification message to Telegram.

**Parameters:**
- `message` (string, required): The message to send

**Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "send_notification",
    "arguments": {
      "message": "Hello, World!"
    }
  }
}
```
