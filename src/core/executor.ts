import { spawn, type ChildProcess } from 'child_process';
import { 
  CommandOptions, 
  CommandStatus, 
  CommandResult, 
  CommandStream,
  ProcessWrapper,
  ExecuteOptions 
} from '../types/index.js';
import { SecurityChecker } from '../utils/security.js';
import { CommandCache } from '../utils/cache.js';
import { Logger } from '../utils/logger.js';
import { ToolError } from '../utils/errors.js';
import { Readable } from 'stream';

export class CommandExecutor {
  private currentProcess: ChildProcess | null = null;
  private logger: Logger;
  private securityChecker: SecurityChecker;
  private cache: CommandCache;

  constructor() {
    this.logger = Logger.getInstance();
    this.securityChecker = SecurityChecker.getInstance();
    this.cache = CommandCache.getInstance();
    this.cache.startCleanup();
  }

  async execute(
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {}
  ): Promise<{ stdout: Readable }> {
    const commandKey = `${command} ${args.join(' ')}`;
    
    try {
      // 檢查安全性
      await this.securityChecker.validateCommand(command, args, options);

      // 檢查快取
      const cached = this.cache.get(commandKey);
      if (cached) {
        this.logger.debug('使用快取的命令結果', { command, args });
        return this.createStreamFromCache(cached);
      }

      // 執行命令
      this.logger.debug('開始執行命令', { command, args, options });
      const childProcess = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: options.timeout,
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env
        },
        signal: options.signal
      });

      this.currentProcess = childProcess;

      // 錯誤處理
      childProcess.on('error', (error: Error) => {
        this.logger.error('命令執行錯誤', {
          command,
          args,
          error: error.message
        });
        throw new ToolError(
          'PROCESS_ERROR',
          '命令執行錯誤',
          { command, args, error: error.message }
        );
      });

      // 超時處理
      if (options.timeout) {
        setTimeout(() => {
          if (childProcess.exitCode === null) {
            this.logger.warn('命令執行超時', {
              command,
              args,
              timeout: options.timeout
            });
            childProcess.kill();
            throw new ToolError(
              'TIMEOUT',
              '命令執行超時',
              { command, args, timeout: options.timeout }
            );
          }
        }, options.timeout);
      }

      if (!childProcess.stdout) {
        throw new ToolError(
          'STREAM_ERROR',
          '無法獲取命令輸出流',
          { command, args }
        );
      }

      // 監控進程狀態
      childProcess.on('exit', (code, signal) => {
        this.logger.debug('命令執行完成', {
          command,
          args,
          exitCode: code,
          signal
        });
      });

      return {
        stdout: childProcess.stdout
      };

    } catch (error) {
      this.logger.error('命令執行失敗', {
        command,
        args,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ToolError(
        'EXECUTION_ERROR',
        '命令執行失敗',
        { 
          command, 
          args, 
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  private createStreamFromCache(result: CommandResult): { stdout: Readable } {
    const stdout = new Readable({
      read() {
        this.push(Buffer.from(result.stdout));
        this.push(null);
      }
    });

    return { stdout };
  }

  interrupt(): void {
    if (this.currentProcess && this.currentProcess.exitCode === null) {
      this.logger.info('中斷命令執行');
      this.currentProcess.kill();
    }
  }
} 