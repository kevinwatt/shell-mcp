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
    version: "0.3.4",
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
  const tools = Object.entries(allowedCommands).map(([name, config]) => ({
    name: name.replace('shell.', ''),
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
  }));
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
