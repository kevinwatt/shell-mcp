export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CommandValidationError extends BaseError {
  constructor(
    public readonly command: string,
    public readonly reason: string
  ) {
    super(`Command validation failed (${command}): ${reason}`);
  }
}

export class CommandExecutionError extends BaseError {
  constructor(
    public readonly command: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(`Command execution failed (${command}): exit code ${exitCode}`);
  }
}

export class CommandTimeoutError extends BaseError {
  constructor(
    public readonly command: string,
    public readonly timeout: number
  ) {
    super(`Command execution timeout (${command}): ${timeout}ms`);
  }
}

export class SecurityError extends BaseError {
  constructor(message: string) {
    super(`Security check failed: ${message}`);
  }
}

export class ToolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ToolError';
  }
} 