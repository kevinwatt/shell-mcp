export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(entry: LogEntry): void {
    // Output to console in development environment
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(entry));
    }

    // TODO: Add file logging or other logging systems in production
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context
    });
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context
    });
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context
    });
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context
    });
  }
} 