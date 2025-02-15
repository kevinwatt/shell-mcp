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
    super(`命令驗證失敗 (${command}): ${reason}`);
  }
}

export class CommandExecutionError extends BaseError {
  constructor(
    public readonly command: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(`命令執行失敗 (${command}): 退出碼 ${exitCode}`);
  }
}

export class CommandTimeoutError extends BaseError {
  constructor(
    public readonly command: string,
    public readonly timeout: number
  ) {
    super(`命令執行超時 (${command}): ${timeout}ms`);
  }
}

export class SecurityError extends BaseError {
  constructor(message: string) {
    super(`安全性檢查失敗: ${message}`);
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