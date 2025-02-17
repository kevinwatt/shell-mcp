import { allowedCommands, CommandConfig } from '../config/allowlist.js';
import { ToolError } from '../utils/errors.js';
import { SecurityChecker } from '../utils/security.js';
import { securityConfig } from '../config/allowlist.js';
import { CommandOptions, RateLimitConfig } from '../types/index.js';

export class CommandValidator {
  private rateLimits: Map<string, { count: number; timestamp: number }> = new Map();
  private securityChecker = SecurityChecker.getInstance();

  validateCommand(
    command: string, 
    args: string[] = [], 
    options: CommandOptions = {}
  ): void {
    console.log('Validating command:', {
      command,
      args,
      baseCommand: command.replace('shell.', ''),
      fullCommand: `shell.${command.replace('shell.', '')}`,
      config: allowedCommands[`shell.${command.replace('shell.', '')}`]
    });

    const baseCommand = command.replace('shell.', '');
    
    if (!(`shell.${baseCommand}` in allowedCommands)) {
      throw new Error(`Command not allowed: ${command}`);
    }
    
    const config = allowedCommands[`shell.${baseCommand}`];
    
    const allowedArgs = config.allowedArgs || [];
    
    console.log('Checking args:', {
      allowedArgs,
      hasWildcard: allowedArgs.includes('*')
    });

    args.forEach(arg => {
      if (arg.startsWith('-')) {
        if (!allowedArgs.includes(arg)) {
          console.log('Invalid option:', arg);
          throw new Error(`Invalid argument: ${arg}`);
        }
      }
      else if (!allowedArgs.includes('*')) {
        console.log('Path not allowed:', arg);
        throw new Error(`Invalid argument: ${arg}`);
      } else {
        // 檢查路徑參數
        this.validatePath(arg);
      }
    });
    
    // 檢查超時設定
    if (options.timeout && options.timeout > securityConfig.defaultTimeout) {
      throw new Error(`Timeout exceeds maximum allowed value`);
    }
  }

  validatePath(path: string): void {
    return this.securityChecker.validatePath(path);
  }

  validateFileSize(path: string): Promise<void> {
    return this.securityChecker.validateFileSize(path);
  }

  checkRateLimit(command: string): void {
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
        throw new Error(`Rate limit exceeded for ${command}`);
      }
      
      // 更新計數
      limit.count++;
      this.rateLimits.set(command, limit);
    }
  }

  sanitizeInput(input: string): string {
    // 先替換特殊字符為兩個空格
    let sanitized = input.replace(/[;&|`>]/g, '  ')
      .replace(/\$(\w+|\{(\w+)\})/g, (_, name) => {
        // 移除 ${} 括號
        name = name.replace(/[{}]/g, '');
        // 如果是已知的環境變量，返回其名稱
        return name;
      })
      .replace(/["']/g, '');  // 移除所有引號
    
    // 保留兩個空格，但合併三個或更多空格為兩個空格
    sanitized = sanitized.replace(/\s{3,}/g, '  ');
    
    // 移除前後空格
    sanitized = sanitized.trim();
    
    if (sanitized !== input) {
      this.logSanitization(input, sanitized);
    }
    return sanitized;
  }

  parseCommand(input: string): [string, string[]] {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Command cannot be empty');
    }
    
    const matches = trimmed.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
    const parts = matches.map(part => part.replace(/^["']|["']$/g, ''));
    
    const command = this.sanitizeInput(parts[0]);
    const args = parts.slice(1).map(arg => this.sanitizeInput(arg));
    return [command, args];
  }

  private logSanitization(original: string, sanitized: string): void {
    console.warn(
      'Potentially dangerous characters removed from input',
      {
        original,
        sanitized,
        removedChars: Array.from(original).filter(c => !sanitized.includes(c))
      }
    );
  }
} 