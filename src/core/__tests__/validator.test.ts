/// <reference types="jest" />
import { CommandValidator } from '../validator.js';

describe('CommandValidator', () => {
  let validator: CommandValidator;

  beforeEach(() => {
    validator = new CommandValidator();
  });

  describe('validateCommand', () => {
    it('應該允許白名單中的命令', () => {
      expect(() => validator.validateCommand('ls')).not.toThrow();
      expect(() => validator.validateCommand('pwd')).not.toThrow();
    });

    it('應該拒絕白名單外的命令', () => {
      expect(() => validator.validateCommand('rm')).toThrow('Command not allowed');
      expect(() => validator.validateCommand('vim')).toThrow('Command not allowed');
    });

    it('應該驗證允許的參數', () => {
      expect(() => validator.validateCommand('ls', ['-l'])).not.toThrow();
      expect(() => validator.validateCommand('ls', ['-x'])).toThrow('Invalid argument');
    });

    it('應該處理帶有路徑的命令', () => {
      expect(() => validator.validateCommand('ls', ['/home/user'])).not.toThrow();
      expect(() => validator.validateCommand('ls', ['/etc/passwd'])).toThrow('Access to restricted path');
    });

    it('應該驗證命令的超時設定', () => {
      expect(() => validator.validateCommand('ls', [], { timeout: 5000 })).not.toThrow();
      expect(() => validator.validateCommand('ls', [], { timeout: 35000 }))
        .toThrow('Timeout exceeds maximum allowed value');
    });
  });

  describe('sanitizeInput', () => {
    it('應該移除危險字元', () => {
      expect(validator.sanitizeInput('echo hello; rm -rf /')).toBe('echo hello  rm -rf /');
      expect(validator.sanitizeInput('ls | grep test')).toBe('ls  grep test');
    });

    it('應該處理特殊字符', () => {
      expect(validator.sanitizeInput('ls `pwd`')).toBe('ls  pwd');
      expect(validator.sanitizeInput('cat file > output')).toBe('cat file  output');
      expect(validator.sanitizeInput('grep -r "$HOME"')).toBe('grep -r HOME');
    });
  });

  describe('parseCommand', () => {
    it('應該正確解析命令和參數', () => {
      const [cmd, args] = validator.parseCommand('ls -l -a');
      expect(cmd).toBe('ls');
      expect(args).toEqual(['-l', '-a']);
    });

    it('應該處理多餘的空白', () => {
      const [cmd, args] = validator.parseCommand('ls   -l    -a  ');
      expect(cmd).toBe('ls');
      expect(args).toEqual(['-l', '-a']);
    });

    it('應該處理空命令', () => {
      expect(() => validator.parseCommand('')).toThrow('Command cannot be empty');
      expect(() => validator.parseCommand('   ')).toThrow('Command cannot be empty');
    });

    it('應該正確處理引號', () => {
      const [cmd, args] = validator.parseCommand('grep "search term" file.txt');
      expect(cmd).toBe('grep');
      expect(args).toEqual(['search term', 'file.txt']);
    });
  });

  describe('validatePath', () => {
    it('應該檢查路徑深度', () => {
      expect(() => validator.validatePath('/home/user/file')).not.toThrow();
      expect(() => validator.validatePath('/home/user/dir1/dir2/dir3/file'))
        .toThrow('Path depth exceeds limit');
    });

    it('應該檢查隱藏文件', () => {
      expect(() => validator.validatePath('/home/user/.ssh/config'))
        .toThrow('Access to restricted path');
      expect(() => validator.validatePath('/home/user/.env'))
        .toThrow('Access to restricted path');
    });
  });

  describe('validateFileSize', () => {
    beforeAll(() => {
      // 創建測試目錄
      require('fs').mkdirSync('test', { recursive: true });
      // 創建測試文件
      require('fs').writeFileSync('test/small.txt', 'test');
      require('fs').writeFileSync('test/large.txt', Buffer.alloc(11 * 1024 * 1024));
    });

    afterAll(() => {
      // 清理測試文件
      require('fs').rmSync('test', { recursive: true, force: true });
    });

    it('應該檢查文件大小限制', async () => {
      await expect(validator.validateFileSize('test/small.txt')).resolves.not.toThrow();
      await expect(validator.validateFileSize('test/large.txt'))
        .rejects.toThrow('File size exceeds limit');
    });

    it('應該處理不存在的文件', async () => {
      await expect(validator.validateFileSize('nonexistent.txt'))
        .rejects.toThrow('Cannot access file');
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('應該限制命令執行頻率', () => {
      // 連續執行 whois 命令
      for (let i = 0; i < 10; i++) {
        expect(() => validator.checkRateLimit('whois')).not.toThrow();
      }
      expect(() => validator.checkRateLimit('whois'))
        .toThrow('Rate limit exceeded');
    });

    it('應該在時間間隔後重置限制', () => {
      validator.checkRateLimit('dig');
      jest.advanceTimersByTime(60000);
      expect(() => validator.checkRateLimit('dig')).not.toThrow();
    });
  });
}); 