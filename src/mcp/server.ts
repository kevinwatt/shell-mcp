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

// 型別定義
interface Extra {
  id?: string;
  onCancel?: (handler: () => void) => void;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: {
      args: {
        type: "array";
        items: { type: "string" };
        description: string;
      };
    };
  };
}

interface ToolsResponse {
  tools: Tool[];
}

interface CommandContext extends Record<string, unknown> {
  requestId: string;
  command: string;
  args: string[];
  timeout?: number;
  workDir?: string;
  env?: Record<string, string>;
}

class ToolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ShellMCPServer {
  public readonly version = "0.2.4";
  public readonly capabilities = {};

  private server: Server;
  private executor: CommandExecutor;
  private validator: CommandValidator;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: "shell-mcp",
        version: "0.2.4",
        description: "Shell command execution MCP server"
      },
      {
        capabilities: {}
      }
    );

    this.executor = new CommandExecutor();
    this.validator = new CommandValidator();
    this.logger = Logger.getInstance();

    this.setupHandlers();
  }

  private validateToolNames(tools: Tool[]): void {
    const names = new Set<string>();
    for (const tool of tools) {
      if (names.has(tool.name)) {
        throw new ToolError(
          'DUPLICATE_TOOL',
          'Tool names must be unique',
          { toolName: tool.name, existingTools: Array.from(names) }
        );
      }
      names.add(tool.name);
    }
  }

  private processTools(): Tool[] {
    const tools: Tool[] = [];
    const processedNames = new Set<string>();

    this.logger.debug('開始處理工具列表', { 
      commandCount: Object.keys(allowedCommands).length 
    });

    Object.entries(allowedCommands).forEach(([name, config]) => {
      const toolName = name.replace('shell.', '');
      this.logger.debug('處理命令', { 
        originalName: name,
        toolName,
        isProcessed: processedNames.has(toolName)
      });

      if (!processedNames.has(toolName)) {
        processedNames.add(toolName);
        tools.push({
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

    this.logger.debug('工具列表處理完成', { 
      toolCount: tools.length,
      processedNames: Array.from(processedNames)
    });

    this.validateToolNames(tools);
    return tools;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request, extra: unknown) => {
      const ext = extra as Extra;
      this.logger.info('開始處理列出工具請求', { requestId: ext.id });
      
      try {
        const tools = this.processTools();
        
        this.logger.info('完成列出工具請求', { 
          requestId: ext.id,
          toolCount: tools.length 
        });
        
        return { tools };
      } catch (error) {
        this.logger.error('列出工具請求失敗', {
          requestId: ext.id,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra: unknown) => {
      const ext = extra as Extra;
      if (!request.params?.name) {
        throw new ToolError('MISSING_COMMAND', 'Command name is required');
      }
      
      const command = String(request.params.name);
      const fullCommand = command.startsWith('shell.') ? command : `shell.${command}`;
      
      if (!(fullCommand in allowedCommands)) {
        throw new ToolError('COMMAND_NOT_FOUND', 'Command not found', { command });
      }
      
      const config = allowedCommands[fullCommand];
      const args = Array.isArray(request.params.arguments?.args)
        ? request.params.arguments.args.map(String)
        : [];

      const context: CommandContext = {
        requestId: ext.id || 'unknown',
        command,
        args,
        timeout: config.timeout,
        workDir: config.workDir,
        env: config.env
      };

      this.logger.info('開始執行命令', context);

      try {
        this.validator.validateCommand(command, args);
        
        this.logger.debug('命令驗證通過', {
          ...context,
          config
        });

        const stream = await this.executor.execute(command, args, {
          timeout: config.timeout,
          cwd: config.workDir,
          env: config.env
        });

        ext.onCancel?.(() => {
          this.logger.info('收到取消請求', context);
          this.executor.interrupt();
        });

        const output = await this.collectOutput(stream);

        this.logger.info('命令執行完成', {
          ...context,
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
          ...context,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        throw new ToolError(
          'EXECUTION_FAILED',
          `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
          context
        );
      }
    });
  }

  private async collectOutput(stream: { stdout: Readable }): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.stdout.on('end', () => resolve(Buffer.concat(chunks).toString()));
      stream.stdout.on('error', reject);
    });
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    } catch (error) {
      this.logger.error('伺服器啟動失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
} 