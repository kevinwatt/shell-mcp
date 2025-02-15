import { Readable } from 'stream';

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
  status: Readable;
}

export type CommandStatus = 
  | { type: 'running' }
  | { type: 'completed', exitCode: number }
  | { type: 'error', error: Error }
  | { type: 'interrupted' };

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