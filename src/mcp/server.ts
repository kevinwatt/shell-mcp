import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Request
} from "@modelcontextprotocol/sdk/types.js";
import { Readable } from 'stream';
import { allowedCommands } from "../config/allowlist.js";
import { Logger } from "../utils/logger.js";
import { CommandExecutor } from "../core/executor.js";
import { CommandValidator } from "../core/validator.js";

// 自行定義 Extra 型別
interface Extra {
  id?: string;
  onCancel?: (handler: () => void) => void;
}

type ToolResponse = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
};

type CommandResult = {
  stdout: Readable;
};

export class ShellMCPServer {
  private server: Server;
  private executor: CommandExecutor;
  private validator: CommandValidator;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: "shell-mcp",
        version: "0.1.6",
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
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request, extra: unknown) => {
      const ext = extra as Extra;
      this.logger.info('收到列出工具請求', { requestId: ext.id });
      
      // 使用 Set 來確保工具名稱唯一
      const uniqueTools = new Map();
      
      Object.entries(allowedCommands).forEach(([name, config]) => {
        const toolName = name.replace('shell.', '');
        if (!uniqueTools.has(toolName)) {
          uniqueTools.set(toolName, {
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
          });
        }
      });

      return {
        tools: Array.from(uniqueTools.values())
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra: unknown) => {
      const ext = extra as Extra;
      if (!request.params?.name) {
        throw new Error('Command name is required');
      }
      
      const command = String(request.params.name);
      const fullCommand = `shell.${command}`;
      if (!(fullCommand in allowedCommands)) {
        throw new Error('Command not found');
      }
      const config = allowedCommands[fullCommand];

      const args = Array.isArray(request.params.arguments?.args)
        ? request.params.arguments.args.map(String)
        : [];

      this.logger.info('收到執行命令請求', { requestId: ext.id });

      try {
        this.validator.validateCommand(command, args);
        
        this.logger.debug('命令驗證通過', {
          requestId: ext.id,
          command,
          config
        });

        const stream = await this.executor.execute(command, args, {
          timeout: config.timeout
        });

        ext.onCancel?.(() => {
          this.logger.info('收到取消請求');
          this.executor.interrupt();
        });

        const output = await this.collectOutput(stream);

        this.logger.info('命令執行完成', {
          requestId: ext.id,
          outputLength: output.length
        });

        return {
          content: [{
            type: "text",
            text: output
          }]
        };

      } catch (error: unknown) {
        this.logger.error('命令執行失敗', {
          requestId: ext.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          command,
          args
        });
        throw new Error(`Command execution failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private async collectOutput(stream: CommandResult): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.stdout.on('end', () => resolve(Buffer.concat(chunks).toString()));
      stream.stdout.on('error', reject);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
} 