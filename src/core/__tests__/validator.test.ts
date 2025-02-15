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
      expect(() => validator.validateCommand('rm')).toThrow('不允許的命令');
      expect(() => validator.validateCommand('cat')).toThrow('不允許的命令');
    });

    it('應該驗證允許的參數', () => {
      expect(() => validator.validateCommand('ls', ['-l'])).not.toThrow();
      expect(() => validator.validateCommand('ls', ['-x'])).toThrow('不允許的參數');
    });
  });

  describe('sanitizeInput', () => {
    it('應該移除危險字元', () => {
      expect(validator.sanitizeInput('echo hello; rm -rf /')).toBe('echo hello rm -rf /');
      expect(validator.sanitizeInput('ls | grep test')).toBe('ls  grep test');
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
  });
}); 