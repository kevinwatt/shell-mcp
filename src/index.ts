#!/usr/bin/env node

import { ShellMCPServer } from "./mcp/server.js";
import { Logger } from './utils/logger.js';
import { CommandCache } from './utils/cache.js';
import { SecurityChecker } from './utils/security.js';

const logger = Logger.getInstance();
const cache = CommandCache.getInstance();

async function cleanup() {
  logger.info('開始清理資源');
  cache.stopCleanup();
  logger.info('資源清理完成');
}

async function main() {
  try {
    logger.info('啟動 Shell MCP 伺服器');
    
    const server = new ShellMCPServer();
    
    // 處理程序信號
    const handleShutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信號，準備關閉伺服器`);
      await cleanup();
      process.exit(0);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('beforeExit', cleanup);

    // 處理未捕獲的異常
    process.on('uncaughtException', (error) => {
      logger.error('未捕獲的異常', {
        error: error.message,
        stack: error.stack,
        type: 'uncaughtException'
      });
      cleanup().finally(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('未處理的 Promise 拒絕', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        type: 'unhandledRejection'
      });
      cleanup().finally(() => process.exit(1));
    });

    // 處理 stdio 流的錯誤
    process.stdin.on('error', (error) => {
      logger.error('標準輸入錯誤', { error: error.message });
      cleanup().finally(() => process.exit(1));
    });

    process.stdout.on('error', (error) => {
      logger.error('標準輸出錯誤', { error: error.message });
      cleanup().finally(() => process.exit(1));
    });

    // 確保在父進程斷開連接時正確清理
    process.on('disconnect', () => {
      logger.error('與父進程的連接已關閉');
      cleanup().finally(() => process.exit(1));
    });

    // 初始化安全檢查器
    const security = SecurityChecker.getInstance();
    await security.validateCommand('init', [], {});

    // 啟動快取清理
    cache.startCleanup();

    // 啟動伺服器
    await server.start();
    logger.info('伺服器啟動完成', {
      version: server.version,
      capabilities: server.capabilities
    });

  } catch (error) {
    logger.error('伺服器啟動失敗', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'startupError'
    });
    
    await cleanup();
    process.exit(1);
  }
}

// 啟動程式
main().catch(async (error) => {
  logger.error('程式執行失敗', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: 'mainError'
  });
  
  await cleanup();
  process.exit(1);
});
