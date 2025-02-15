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
  stdout: ReadableStream;
  stderr: ReadableStream;
  status: ReadableStream<CommandStatus>;
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