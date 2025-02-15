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
    version: "0.3.5",
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
  // 使用 Set 來確保工具名稱唯一
  const toolNames = new Set<string>();
  console.log('處理的命令：', Object.keys(allowedCommands));
  
  const tools = Object.entries(allowedCommands)
    .map(([name, config]) => {
      const toolName = name.replace('shell.', '');
      console.log('處理工具：', { original: name, toolName, isDuplicate: toolNames.has(toolName) });
      if (toolNames.has(toolName)) {
        console.warn('發現重複的工具名稱：', toolName);
        return null;
      }
      toolNames.add(toolName);
      return {
        name: toolName,
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
    })
    .filter((tool): tool is NonNullable<typeof tool> => tool !== null);
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const command = String(request.params?.name || '');
  const args = Array.isArray(request.params?.arguments?.args)
    ? request.params.arguments.args.map(String)
    : [];

  validator.validateCommand(command, args);
  const stream = await executor.execute(command, args);

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
});

async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

startServer().catch(console.error);
