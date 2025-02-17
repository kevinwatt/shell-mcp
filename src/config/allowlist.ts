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
    allowedArgs: ['-l', '-a', '-h', '-R', '--help', '*'],
    timeout: 5000
  },
  'shell.cat': {
    command: 'cat',
    description: 'Concatenate and display file contents',
    allowedArgs: ['-n', '-b', '--help', '*'],
    timeout: 3000
  },
  'shell.pwd': {
    command: 'pwd',
    description: 'Show current working directory',
    timeout: 1000
  },
  'shell.df': {
    command: 'df',
    description: 'Show disk usage',
    allowedArgs: ['-h', '-T', '--help'],
    timeout: 5000
  },
  'shell.echo': {
    command: 'echo',
    description: 'Display text',
    timeout: 1000
  },
  'shell.ps': {
    command: 'ps',
    description: 'Show process status',
    allowedArgs: ['-e', '-f', '-u', '--help'],
    timeout: 5000
  },
  'shell.free': {
    command: 'free',
    description: 'Show memory usage',
    allowedArgs: ['-h', '-m', '-g', '--help'],
    timeout: 5000
  },
  'shell.uptime': {
    command: 'uptime',
    description: 'Show system uptime',
    timeout: 1000
  },
  'shell.date': {
    command: 'date',
    description: 'Show system date and time',
    allowedArgs: ['+%Y-%m-%d', '+%H:%M:%S', '--help'],
    timeout: 1000
  },
  'shell.grep': {
    command: 'grep',
    description: 'Search text patterns in files',
    allowedArgs: [
      '-i',      // case-insensitive
      '-v',      // invert match
      '-n',      // show line numbers
      '-r',      // recursive
      '-l',      // show file names only
      '--color', // colorize
      '*'        // allow patterns and file paths
    ],
    timeout: 5000
  },
  'shell.w': {
    command: 'w',
    description: 'Show who is logged on and what they are doing',
    allowedArgs: ['-h', '-s', '--no-header', '--help'],
    timeout: 2000
  },
  'shell.whois': {
    command: 'whois',
    description: 'Query WHOIS domain registration information',
    allowedArgs: [
      '-H',  // hide legal disclaimers
      '*'    // allow domain names
    ],
    timeout: 5000
  },
  'shell.find': {
    command: 'find',
    description: 'Search for files in a directory hierarchy',
    allowedArgs: [
      '-name',
      '-type',
      '-size',
      '-mtime',
      '-maxdepth',
      '-mindepth',
      '-ls',
      '*'      // allow paths and patterns
    ],
    timeout: 10000
  },
  'shell.netstat': {
    command: 'netstat',
    description: 'Network connection information',
    allowedArgs: [
      '-a',     // all connections
      '-n',     // numeric addresses
      '-t',     // TCP
      '-u',     // UDP
      '-l',     // listening
      '-p',     // show process
      '--help'
    ],
    timeout: 3000
  },
  'shell.lspci': {
    command: 'lspci',
    description: 'List PCI devices',
    allowedArgs: [
      '-v',     // verbose
      '-k',     // kernel drivers
      '-mm',    // machine readable
      '-nn',    // show vendor/device codes
      '--help'
    ],
    timeout: 2000
  },
  'shell.lsusb': {
    command: 'lsusb',
    description: 'List USB devices',
    allowedArgs: [
      '-v',     // verbose
      '-t',     // tree
      '-d',     // device
      '-s',     // bus/device number
      '--help'
    ],
    timeout: 2000
  },
  'shell.dig': {
    command: 'dig',
    description: 'DNS lookup utility',
    allowedArgs: [
      '+short',  // short form
      '+trace',  // trace query
      '+dnssec', // show DNSSEC info
      '@*',      // nameserver
      '*'        // domain names
    ],
    timeout: 5000
  },
  'shell.nslookup': {
    command: 'nslookup',
    description: 'Query DNS records',
    allowedArgs: [
      '-type=*', // record type
      '-query=*',// query type
      '*'        // domain names
    ],
    timeout: 5000
  },
  'shell.ip': {
    command: 'ip',
    description: 'Show / manipulate routing, network devices, interfaces and tunnels',
    allowedArgs: [
      'addr',     // show addresses
      'link',     // show network devices
      'route',    // show routing table
      'neigh',    // show neighbor table
      '-br',      // brief output
      '-c',       // color output
      '-s',       // statistics
      '-d',       // details
      '-h',       // human readable
      '--help',
      'show',
      '*'         // allow interface names
    ],
    timeout: 3000
  }
};

// Security settings
export const securityConfig = {
  maxOutputSize: 1024 * 1024, // 1MB
  defaultTimeout: 30000, // 30 seconds
  restrictedPaths: [
    '/etc/passwd',
    '/etc/shadow',
    '^/\\..*',         // 根目錄下的隱藏文件
    '^/home/[^/]+/\\..*', // 家目錄下的隱藏文件
    '^/root/.*',       // root 目錄下的所有文件
    '/var/log'
  ],
  allowedEnvVars: ['PATH', 'HOME', 'USER', 'SHELL', 'LANG'],
  maxDepth: 4,           // 增加允許的目錄深度
  maxFileSize: 10485760, // 最大文件大小 (10MB)
  rateLimit: {           // 速率限制
    whois: 10,           // 每分鐘查詢次數
    dig: 10,
    nslookup: 10
  }
}; 