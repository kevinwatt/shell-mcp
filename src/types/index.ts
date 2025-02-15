import { Readable } from 'stream';
import type { ChildProcess } from 'child_process';

export interface CommandOptions {
  timeout?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CommandStream {
  stdout: Readable;
  stderr: Readable;
}

export type CommandStatus = 
  | { type: 'running' }
  | { type: 'completed', exitCode: number }
  | { type: 'error', error: Error }
  | { type: 'interrupted' };

export interface ProcessWrapper {
  process: ChildProcess;
  stdout: Readable;
  stderr: Readable;
}

export interface ExecuteOptions extends CommandOptions {
  signal?: AbortSignal;
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
  id?: string;
  onCancel?: (handler: () => void) => void;
} 