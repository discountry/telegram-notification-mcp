#!/usr/bin/env node

import https from 'https';
import { URL, URLSearchParams } from 'url';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required');
  process.exit(1);
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

function sendTelegramMessage(message, parseMode = 'MarkdownV2') {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: parseMode
    });

    const url = new URL(TELEGRAM_API_URL);
    url.search = params.toString();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            if (response.ok) {
              resolve(response);
            } else {
              reject(new Error(response.description || 'Telegram API error'));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function handleRequest(request) {
  const requestId = request.id;
  
  try {
    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          tools: [
            {
              name: 'send_notification',
              description: 'Send a notification message to Telegram',
              inputSchema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'The message to send'
                  },
                  parse_mode: {
                    type: 'string',
                    enum: ['MarkdownV2', 'Markdown', 'HTML'],
                    description: 'Optional. Formatting style for the message. Use MarkdownV2 for Telegram MarkdownV2 format.'
                  }
                },
                required: ['message']
              }
            }
          ]
        }
      };
    }

    if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      
      if (name === 'send_notification') {
        if (!args || !args.message) {
          throw new Error('Message parameter is required');
        }

        const result = await sendTelegramMessage(args.message, args.parse_mode);
        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: [
              {
                type: 'text',
                text: `Notification sent successfully: ${JSON.stringify(result)}`
              }
            ]
          }
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    }

    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'telegram-notification-mcp',
            version: '1.0.0'
          }
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`
      }
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -1,
        message: error.message
      }
    };
  }
}

async function main() {
  let buffer = '';

  process.stdin.on('data', async (chunk) => {
    buffer += chunk.toString();
    
    while (true) {
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) break;

      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line) continue;

      try {
        const request = JSON.parse(line);
        const response = await handleRequest(request);
        
        if (response !== null) {
          console.log(JSON.stringify(response));
        }
      } catch (error) {
        let requestId = null;
        try {
          const parsed = JSON.parse(line);
          requestId = parsed.id;
        } catch (e) {
          // Ignore parse errors for getting id
        }
        console.error(JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32700,
            message: `Parse error: ${error.message}`
          }
        }));
      }
    }
  });

  process.stdin.on('end', () => {
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(JSON.stringify({
    error: {
      code: -1,
      message: error.message
    }
  }));
  process.exit(1);
});

