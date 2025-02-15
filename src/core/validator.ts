import { allowedCommands, CommandConfig } from '../config/allowlist.js';

export class CommandValidator {
  validateCommand(command: string, args: string[] = []): CommandConfig {
    // 添加前綴以匹配 allowlist 中的鍵
    const fullCommand = `shell.${command}`;
    const config = allowedCommands[fullCommand];
    
    if (!config) {
      throw new Error('不允許的命令');
    }

    // 驗證參數
    if (args.length > 0 && config.allowedArgs) {
      for (const arg of args) {
        if (!config.allowedArgs.includes(arg)) {
          throw new Error('不允許的參數');
        }
      }
    }

    return config;
  }

  sanitizeInput(input: string): string {
    // 移除危險字元
    return input.replace(/[;&|`$]/g, '');
  }

  parseCommand(input: string): [string, string[]] {
    const parts = input.trim().split(/\s+/);
    const command = this.sanitizeInput(parts[0]);
    const args = parts.slice(1).map(arg => this.sanitizeInput(arg));
    
    return [command, args];
  }
} 