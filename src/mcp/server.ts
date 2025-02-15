import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CommandExecutor } from "../core/executor.js";
import { CommandValidator } from "../core/validator.js";
import { allowedCommands } from "../config/allowlist.js";
import { Logger } from "../utils/logger.js";

export class ShellMCPServer {
  private server: Server;
  private executor: CommandExecutor;
  private validator: CommandValidator;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: "shell-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.executor = new CommandExecutor();
    this.validator = new CommandValidator();
    this.logger = Logger.getInstance();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      this.logger.info('收到列出工具請求', { requestId: request.id });
      
      return {
        tools: Object.entries(allowedCommands).map(([name, config]) => ({
          name,
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
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const command = request.params.name;
      const args = request.params.arguments?.args as string[] || [];

      this.logger.info('收到執行命令請求', {
        requestId: request.id,
        command,
        args
      });

      try {
        const config = this.validator.validateCommand(command, args);
        
        this.logger.debug('命令驗證通過', {
          requestId: request.id,
          command,
          config
        });

        const stream = await this.executor.execute(command, args, {
          timeout: config.timeout
        });

        request.onCancel(() => {
          this.logger.info('收到取消請求', { requestId: request.id });
          this.executor.interrupt();
        });

        const output = await this.collectOutput(stream);

        this.logger.info('命令執行完成', {
          requestId: request.id,
          outputLength: output.length
        });

        return {
          content: [{
            type: "text",
            text: output
          }]
        };

      } catch (error) {
        this.logger.error('命令執行失敗', {
          requestId: request.id,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    });
  }

  private async collectOutput(stream: CommandStream): Promise<string> {
    const chunks: string[] = [];
    
    const textDecoder = new TextDecoder();
    const reader = stream.stdout.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(textDecoder.decode(value));
      }
    } finally {
      reader.releaseLock();
    }
    
    return chunks.join('');
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
} 