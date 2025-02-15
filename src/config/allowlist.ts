export interface CommandConfig {
  command: string;
  description: string;
  allowedArgs?: string[];
  timeout?: number;
  workDir?: string;
  env?: Record<string, string>;
}

export const allowedCommands: Record<string, CommandConfig> = {
  'shell.ls': {
    command: 'ls',
    description: 'List directory contents',
    allowedArgs: ['-l', '-a', '-h', '-R'],
    timeout: 5000
  },
  'shell.pwd': {
    command: 'pwd',
    description: 'Show current working directory',
    timeout: 1000
  },
  'shell.df': {
    command: 'df',
    description: '顯示磁碟使用情況',
    allowedArgs: ['-h', '-T'],
    timeout: 5000
  },
  'shell.echo': {
    command: 'echo',
    description: '顯示文字',
    timeout: 1000
  },
  'shell.ps': {
    command: 'ps',
    description: '顯示進程狀態',
    allowedArgs: ['-e', '-f', '-u', '--help'],
    timeout: 5000
  },
  'shell.free': {
    command: 'free',
    description: '顯示記憶體使用情況',
    allowedArgs: ['-h', '-m', '-g', '--help'],
    timeout: 5000
  },
  'shell.uptime': {
    command: 'uptime',
    description: '顯示系統運行時間',
    timeout: 1000
  },
  'shell.date': {
    command: 'date',
    description: '顯示系統日期和時間',
    allowedArgs: ['+%Y-%m-%d', '+%H:%M:%S', '--help'],
    timeout: 1000
  }
};

// 安全性設定
export const securityConfig = {
  maxOutputSize: 1024 * 1024, // 1MB
  defaultTimeout: 30000, // 30 seconds
  restrictedPaths: ['/etc', '/var', '/root', '/usr/bin'],
  allowedEnvVars: ['PATH', 'HOME', 'USER', 'SHELL', 'LANG']
}; 