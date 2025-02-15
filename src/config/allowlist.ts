export interface CommandConfig {
  command: string;
  description: string;
  allowedArgs?: string[];
  timeout?: number;
  workDir?: string;
  env?: Record<string, string>;
}

export const allowedCommands: Record<string, CommandConfig> = {
  'ls': {
    command: 'ls',
    description: '列出目錄內容',
    allowedArgs: ['-l', '-a', '-h', '--help', '-R'],
    timeout: 5000
  },
  'pwd': {
    command: 'pwd',
    description: '顯示當前工作目錄',
    timeout: 1000
  },
  'echo': {
    command: 'echo',
    description: '顯示文字',
    timeout: 1000
  },
  'ps': {
    command: 'ps',
    description: '顯示進程狀態',
    allowedArgs: ['-e', '-f', '-u', '--help'],
    timeout: 5000
  },
  'df': {
    command: 'df',
    description: '顯示磁碟使用情況',
    allowedArgs: ['-h', '--help'],
    timeout: 5000
  },
  'free': {
    command: 'free',
    description: '顯示記憶體使用情況',
    allowedArgs: ['-h', '-m', '-g', '--help'],
    timeout: 5000
  },
  'uptime': {
    command: 'uptime',
    description: '顯示系統運行時間',
    timeout: 1000
  },
  'date': {
    command: 'date',
    description: '顯示系統日期和時間',
    allowedArgs: ['+%Y-%m-%d', '+%H:%M:%S', '--help'],
    timeout: 1000
  }
};

// 安全性設定
export const securityConfig = {
  maxOutputSize: 1024 * 1024, // 1MB
  defaultTimeout: 5000,
  restrictedPaths: [
    '/etc',
    '/usr',
    '/var',
    '/root'
  ],
  allowedEnvVars: [
    'PATH',
    'LANG',
    'HOME',
    'USER'
  ]
}; 