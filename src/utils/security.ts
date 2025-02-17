import { securityConfig } from '../config/allowlist.js';
import { ToolError } from './errors.js';
import { CommandOptions, RateLimitConfig } from '../types/index.js';
import { Logger } from './logger.js';

export class SecurityChecker {
  private static instance: SecurityChecker;
  private logger: Logger;
  private rateLimits: Map<string, { count: number; timestamp: number }> = new Map();

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
    this.logger.debug('Performing security check', { command, args, options });

    // 檢查速率限制
    this.checkRateLimit(command);

    // Check working directory
    if (options.cwd) {
      this.validatePath(options.cwd);
    }

    // Check environment variables
    if (options.env) {
      this.validateEnv(options.env);
    }

    // Check timeout settings
    if (options.timeout && options.timeout > securityConfig.defaultTimeout) {
      throw new ToolError(
        'INVALID_TIMEOUT',
        'Timeout exceeds maximum allowed value',
        { 
          timeout: options.timeout,
          maxTimeout: securityConfig.defaultTimeout 
        }
      );
    }

    // 檢查參數中的路徑
    args.forEach(arg => {
      if (!arg.startsWith('-')) {
        this.validatePath(arg);
      }
    });
  }

  public validatePath(path: string): void {
    const normalizedPath = require('path').normalize(path);
    
    // 先檢查目錄深度
    const parts = normalizedPath.split('/').filter(Boolean);
    const depth = parts.length;
    if (depth > securityConfig.maxDepth) {
      throw new ToolError(
        'MAX_DEPTH_EXCEEDED',
        `Path depth exceeds limit of ${securityConfig.maxDepth}`,
        { path, depth, maxDepth: securityConfig.maxDepth }
      );
    }

    for (const restricted of securityConfig.restrictedPaths) {
      const pattern = new RegExp(restricted);
      if (pattern.test(normalizedPath)) {
        throw new ToolError(
          'RESTRICTED_PATH',
          'Access to restricted path',
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
        'Use of unauthorized environment variables',
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
        'Output size exceeds limit',
        { outputSize: output.length, maxOutputSize: securityConfig.maxOutputSize }
      );
    }
  }

  validateResourceUsage(command: string): void {
    // TODO: Implement resource usage limits
    // - CPU usage
    // - Memory usage
    // - Network access
  }

  private checkRateLimit(command: string): void {
    const limits = securityConfig.rateLimit as RateLimitConfig;
    if (command in limits) {
      const now = Date.now();
      const limit = this.rateLimits.get(command) || { count: 0, timestamp: now };
      
      // 重置計數器（如果超過一分鐘）
      if (now - limit.timestamp > 60000) {
        limit.count = 0;
        limit.timestamp = now;
      }
      
      // 檢查限制
      if (limit.count >= limits[command]) {
        throw new ToolError(
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded for ${command}`,
          { command, limit: limits[command] }
        );
      }
      
      // 更新計數
      limit.count++;
      this.rateLimits.set(command, limit);
    }
  }

  public async validateFileSize(path: string): Promise<void> {
    const { promises: fs } = require('fs');
    try {
      const stats = await fs.stat(path);
      if (stats.size > securityConfig.maxFileSize) {
        throw new ToolError(
          'FILE_TOO_LARGE',
          `File size exceeds limit of ${securityConfig.maxFileSize} bytes`,
          { path, size: stats.size, maxSize: securityConfig.maxFileSize }
        );
      }
    } catch (error: unknown) {
      if (error instanceof ToolError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ToolError(
        'FILE_ACCESS_ERROR',
        `Cannot access file: ${message}`,
        { path }
      );
    }
  }
} 