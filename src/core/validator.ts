import { allowedCommands, CommandConfig } from '../config/allowlist.js';
import { ToolError } from '../utils/errors.js';

export class CommandValidator {
  validateCommand(command: string, args: string[] = []): CommandConfig {
    console.log('Validating command:', {
      command,
      args,
      baseCommand: command.replace('shell.', ''),
      fullCommand: `shell.${command.replace('shell.', '')}`,
      config: allowedCommands[`shell.${command.replace('shell.', '')}`]
    });

    const baseCommand = command.replace('shell.', '');
    
    if (!(`shell.${baseCommand}` in allowedCommands)) {
      throw new Error(`不允許的命令: ${command}`);
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
          throw new Error(`不允許的參數: ${arg}`);
        }
      }
      else if (!allowedArgs.includes('*')) {
        console.log('Path not allowed:', arg);
        throw new Error(`不允許的參數: ${arg}`);
      }
    });
    
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