import { SecurityError } from './errors.js';
import { securityConfig } from '../config/allowlist.js';
import path from 'path';

export class SecurityChecker {
  private static instance: SecurityChecker;

  private constructor() {}

  static getInstance(): SecurityChecker {
    if (!SecurityChecker.instance) {
      SecurityChecker.instance = new SecurityChecker();
    }
    return SecurityChecker.instance;
  }

  validatePath(pathToCheck: string): void {
    const normalizedPath = path.normalize(pathToCheck);
    
    // 檢查是否存取受限制的路徑
    for (const restrictedPath of securityConfig.restrictedPaths) {
      if (normalizedPath.startsWith(restrictedPath)) {
        throw new SecurityError(`不允許存取路徑: ${restrictedPath}`);
      }
    }
  }

  validateEnv(env: Record<string, string>): Record<string, string> {
    const sanitizedEnv: Record<string, string> = {};
    
    // 只允許白名單中的環境變數
    for (const key of Object.keys(env)) {
      if (securityConfig.allowedEnvVars.includes(key)) {
        sanitizedEnv[key] = env[key];
      }
    }
    
    return sanitizedEnv;
  }

  validateOutputSize(output: string): void {
    if (output.length > securityConfig.maxOutputSize) {
      throw new SecurityError(`輸出超過大小限制: ${output.length} bytes`);
    }
  }

  validateResourceUsage(command: string): void {
    // TODO: 實作資源使用限制檢查
    // - CPU 使用率
    // - 記憶體使用量
    // - 網路存取
  }
} 