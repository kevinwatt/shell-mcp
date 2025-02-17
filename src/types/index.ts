import { Readable } from 'stream';
import type { ChildProcess } from 'child_process';

export interface CommandOptions {
  timeout?: number;  // in milliseconds
  cwd?: string;     // working directory
  env?: NodeJS.ProcessEnv;  // environment variables
}

export interface CommandResult {
  stdout: string;   // standard output
  stderr: string;   // standard error
  exitCode: number; // process exit code
}

export interface CommandStream {
  stdout: Readable; // standard output stream
  stderr: Readable; // standard error stream
}

export type CommandStatus = 
  | { type: 'running' }      // process is running
  | { type: 'completed', exitCode: number }  // process completed
  | { type: 'error', error: Error }         // process failed
  | { type: 'interrupted' };                // process was interrupted

export interface ProcessWrapper {
  process: ChildProcess;  // child process instance
  stdout: Readable;       // standard output stream
  stderr: Readable;       // standard error stream
}

export interface ExecuteOptions extends CommandOptions {
  signal?: AbortSignal;  // abort signal for cancellation
}

export class CommandError extends Error {
  constructor(
    public readonly command: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(`Command failed: ${command} (exit code: ${exitCode})`);
  }
}

export interface Extra {
  id?: string;  // request ID
  onCancel?: (handler: () => void) => void;  // cancellation handler
}

export type RateLimitConfig = {
  [key: string]: number;  // 添加索引簽章
}; 