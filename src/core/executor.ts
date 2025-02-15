import { spawn, type ChildProcess } from 'child_process';
import { CommandOptions, CommandStatus, CommandResult, CommandStream } from '../types/index.js';
import { SecurityChecker } from '../utils/security.js';
import { CommandCache } from '../utils/cache.js';
import { Logger } from '../utils/logger.js';
import { CommandTimeoutError, CommandExecutionError } from '../utils/errors.js';
import { Readable } from 'stream';

interface ExecuteResult {
  stdout: Readable;
  stderr: Readable;
}

export class CommandExecutor {
  private currentProcess: ChildProcess | null = null;
  private statusController: ReadableStreamDefaultController<CommandStatus> | null = null;
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

  async execute(command: string, args: string[] = [], options: CommandOptions = {}): Promise<ExecuteResult> {
    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd,
      env: options.env
    });

    if (!process.stdout || !process.stderr) {
      throw new Error('Process streams not available');
    }

    return {
      stdout: process.stdout,
      stderr: process.stderr
    };
  }

  private createStreamFromCache(result: CommandResult): ExecuteResult {
    const stdout = new Readable({
      read() {
        this.push(Buffer.from(result.stdout));
        this.push(null);
      }
    });

    const stderr = new Readable({
      read() {
        this.push(Buffer.from(result.stderr));
        this.push(null);
      }
    });

    return { stdout, stderr };
  }

  interrupt(): void {
    if (this.currentProcess) {
      this.statusController?.enqueue({ type: 'interrupted' });
      this.currentProcess.kill('SIGINT');
      
      // 給予程序時間進行清理
      setTimeout(() => {
        if (this.currentProcess) {
          this.currentProcess.kill('SIGTERM');
        }
      }, 5000);
    }
  }
} 