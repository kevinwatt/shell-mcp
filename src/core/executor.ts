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
      // Check security
      await this.securityChecker.validateCommand(command, args, options);

      // Check cache
      const cached = this.cache.get(commandKey);
      if (cached) {
        this.logger.debug('Using cached command result', { command, args });
        return this.createStreamFromCache(cached);
      }

      // Remove 'shell.' prefix for execution
      const baseCommand = command.replace('shell.', '');

      // Execute command
      this.logger.debug('Starting command execution', { command, args, options });
      const childProcess = spawn(baseCommand, args, {
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

      // Error handling
      childProcess.on('error', (error: Error) => {
        this.logger.error('Command execution error', {
          command,
          args,
          error: error.message
        });
        throw new ToolError(
          'PROCESS_ERROR',
          'Command execution error',
          { command, args, error: error.message }
        );
      });

      // Timeout handling
      if (options.timeout) {
        setTimeout(() => {
          if (childProcess.exitCode === null) {
            this.logger.warn('Command execution timeout', {
              command,
              args,
              timeout: options.timeout
            });
            childProcess.kill();
            throw new ToolError(
              'TIMEOUT',
              'Command execution timeout',
              { command, args, timeout: options.timeout }
            );
          }
        }, options.timeout);
      }

      if (!childProcess.stdout) {
        throw new ToolError(
          'STREAM_ERROR',
          'Unable to get command output stream',
          { command, args }
        );
      }

      // Monitor process status
      childProcess.on('exit', (code, signal) => {
        this.logger.debug('Command execution completed', {
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
      this.logger.error('Command execution failed', {
        command,
        args,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ToolError(
        'EXECUTION_ERROR',
        'Command execution failed',
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
      this.logger.info('Interrupting command execution');
      this.currentProcess.kill();
    }
  }
} 