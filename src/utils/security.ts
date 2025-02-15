import { securityConfig } from '../config/allowlist.js';
import { ToolError } from './errors.js';
import { CommandOptions } from '../types/index.js';
import { Logger } from './logger.js';

export class SecurityChecker {
  private static instance: SecurityChecker;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): SecurityChecker {
    if (!SecurityChecker.instance) {
      SecurityChecker.instance = new SecurityChecker();
    }
    return SecurityChecker.instance;
  }

  async validateCommand(
    command: string,
    args: string[],
    options: CommandOptions
  ): Promise<void> {
    this.logger.debug('執行安全性檢查', { command, args, options });

    // 檢查工作目錄
    if (options.cwd) {
      this.validatePath(options.cwd);
    }

    // 檢查環境變數
    if (options.env) {
      this.validateEnv(options.env);
    }

    // 檢查超時設定
    if (options.timeout && options.timeout > securityConfig.defaultTimeout) {
      throw new ToolError(
        'INVALID_TIMEOUT',
        '超時設定超過允許的最大值',
        { 
          timeout: options.timeout,
          maxTimeout: securityConfig.defaultTimeout 
        }
      );
    }
  }

  private validatePath(path: string): void {
    for (const restricted of securityConfig.restrictedPaths) {
      if (path.startsWith(restricted)) {
        throw new ToolError(
          'RESTRICTED_PATH',
          '存取受限制的路徑',
          { path, restrictedPaths: securityConfig.restrictedPaths }
        );
      }
    }
  }

  private validateEnv(env: NodeJS.ProcessEnv): void {
    const invalidVars = Object.keys(env).filter(
      key => !securityConfig.allowedEnvVars.includes(key)
    );

    if (invalidVars.length > 0) {
      throw new ToolError(
        'INVALID_ENV_VARS',
        '使用未允許的環境變數',
        { 
          invalidVars,
          allowedVars: securityConfig.allowedEnvVars 
        }
      );
    }
  }

  validateOutputSize(output: string): void {
    if (output.length > securityConfig.maxOutputSize) {
      throw new ToolError(
        'OUTPUT_SIZE_EXCEEDED',
        '輸出超過大小限制',
        { outputSize: output.length, maxOutputSize: securityConfig.maxOutputSize }
      );
    }
  }

  validateResourceUsage(command: string): void {
    // TODO: 實作資源使用限制檢查
    // - CPU 使用率
    // - 記憶體使用量
    // - 網路存取
  }
} 