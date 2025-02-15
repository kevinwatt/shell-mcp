#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { allowedCommands } from "./config/allowlist.js";
import { CommandExecutor } from "./core/executor.js";
import { CommandValidator } from "./core/validator.js";

const executor = new CommandExecutor();
const validator = new CommandValidator();

const server = new Server(
  {
    name: "shell-mcp",
    version: "0.3.6",
    description: "Shell command execution MCP server"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// 設置工具處理程式
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // 直接使用完整的命令名稱作為工具名稱
  const tools = Object.entries(allowedCommands).map(([name, config]) => {
    console.log('註冊工具：', name);
    return {
      name,  // 使用完整名稱，包含 'shell.' 前綴
      description: config.description,
      inputSchema: {
        type: "object",
        properties: {
          args: {
            type: "array",
            items: { type: "string" },
            description: "命令參數"
          }
        }
      }
    };
  });
  
  console.log('註冊的工具列表：', tools.map(t => t.name));
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const command = String(request.params?.name || '');
    // 始終添加 'shell.' 前綴
    const fullCommand = `shell.${command.replace('shell.', '')}`;
    console.log('執行命令：', { originalCommand: command, fullCommand });
    
    if (!(fullCommand in allowedCommands)) {
      return {
        content: [{ type: "text", text: `未知的命令：${fullCommand}` }],
        isError: true
      };
    }
    
    const args = Array.isArray(request.params?.arguments?.args)
      ? request.params.arguments.args.map(String)
      : [];
  
    validator.validateCommand(fullCommand, args);
    const stream = await executor.execute(fullCommand, args);
  
    return {
      content: [{
        type: "text",
        text: await new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.stdout.on('end', () => resolve(Buffer.concat(chunks).toString()));
          stream.stdout.on('error', reject);
        })
      }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `執行命令失敗：${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
});

async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer().catch(console.error);
