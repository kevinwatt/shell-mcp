import { allowedCommands, CommandConfig } from '../config/allowlist.js';
import { ToolError } from '../utils/errors.js';

export class CommandValidator {
  validateCommand(command: string, args: string[] = []): CommandConfig {
    const baseCommand = command.replace('shell.', '');
    
    if (!(`shell.${baseCommand}` in allowedCommands)) {
      throw new ToolError(
        'INVALID_COMMAND',
        '不允許的命令',
        { command, availableCommands: Object.keys(allowedCommands) }
      );
    }

    const config = allowedCommands[`shell.${baseCommand}`];

    if (args.length > 0 && config.allowedArgs) {
      const invalidArgs = args.filter(arg => !config.allowedArgs?.includes(arg));
      if (invalidArgs.length > 0) {
        throw new ToolError(
          'INVALID_ARGS',
          '不允許的參數',
          { 
            command,
            invalidArgs,
            allowedArgs: config.allowedArgs 
          }
        );
      }
    }

    return config;
  }

  sanitizeInput(input: string): string {
    const sanitized = input.replace(/[;&|`$]/g, '');
    if (sanitized !== input) {
      this.logSanitization(input, sanitized);
    }
    return sanitized;
  }

  parseCommand(input: string): [string, string[]] {
    const parts = input.trim().split(/\s+/);
    if (parts.length === 0) {
      throw new ToolError(
        'EMPTY_COMMAND',
        '命令不能為空'
      );
    }

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