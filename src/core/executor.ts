import { spawn, ChildProcess } from 'child_process';
import { CommandOptions, CommandStream, CommandStatus, CommandResult } from '../types/index.js';
import { SecurityChecker } from '../utils/security.js';
import { CommandCache } from '../utils/cache.js';
import { Logger } from '../utils/logger.js';
import { CommandTimeoutError, CommandExecutionError } from '../utils/errors.js';

export class CommandExecutor {
  private process: ChildProcess | null = null;
  private statusController: ReadableStreamController<CommandStatus> | null = null;
  private securityChecker: SecurityChecker;
  private cache: CommandCache;
  private logger: Logger;

  constructor() {
    this.securityChecker = SecurityChecker.getInstance();
    this.cache = CommandCache.getInstance();
    this.logger = Logger.getInstance();
    
    // 啟動快取清理
    this.cache.startCleanup();
  }

  async execute(command: string, args: string[] = [], options: CommandOptions = {}): Promise<CommandStream> {
    // 檢查快取
    const cachedResult = this.cache.get(command, args);
    if (cachedResult) {
      this.logger.debug('使用快取的命令結果', { command, args });
      return this.createStreamFromCache(cachedResult);
    }

    // 安全性檢查
    if (options.cwd) {
      this.securityChecker.validatePath(options.cwd);
    }
    
    const sanitizedEnv = this.securityChecker.validateEnv(options.env || {});

    // 建立狀態串流
    const status = new ReadableStream<CommandStatus>({
      start: (controller) => {
        this.statusController = controller;
      }
    });

    try {
      this.process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: options.cwd,
        env: sanitizedEnv
      });

      // 設定超時
      let timeoutId: NodeJS.Timeout | null = null;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          this.interrupt();
          throw new CommandTimeoutError(command, options.timeout!);
        }, options.timeout);
      }

      // 通知執行狀態
      this.statusController?.enqueue({ type: 'running' });

      // 收集輸出
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      this.process.stdout.on('data', (chunk) => {
        stdout.push(chunk);
      });

      this.process.stderr.on('data', (chunk) => {
        stderr.push(chunk);
      });

      // 監聽進程結束
      this.process.on('exit', (code) => {
        if (timeoutId) clearTimeout(timeoutId);

        const result: CommandResult = {
          stdout: Buffer.concat(stdout).toString(),
          stderr: Buffer.concat(stderr).toString(),
          exitCode: code ?? 0
        };

        // 驗證輸出大小
        this.securityChecker.validateOutputSize(result.stdout);

        // 快取結果
        this.cache.set(command, args, result);

        this.statusController?.enqueue({ 
          type: 'completed', 
          exitCode: result.exitCode 
        });
        this.statusController?.close();
      });

      return {
        stdout: this.process.stdout,
        stderr: this.process.stderr,
        status
      };

    } catch (error) {
      this.statusController?.enqueue({ 
        type: 'error', 
        error: error as Error 
      });
      this.statusController?.close();
      throw error;
    }
  }

  private createStreamFromCache(result: CommandResult): CommandStream {
    const stdout = new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from(result.stdout));
        controller.close();
      }
    });

    const stderr = new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from(result.stderr));
        controller.close();
      }
    });

    const status = new ReadableStream({
      start(controller) {
        controller.enqueue({ type: 'completed', exitCode: result.exitCode });
        controller.close();
      }
    });

    return { stdout, stderr, status };
  }

  interrupt(): void {
    if (this.process) {
      this.statusController?.enqueue({ type: 'interrupted' });
      this.process.kill('SIGINT');
      
      // 給予程序時間進行清理
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGTERM');
        }
      }, 5000);
    }
  }
} 