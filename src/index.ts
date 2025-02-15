#!/usr/bin/env node

import { ShellMCPServer } from "./mcp/server.js";
import { Logger } from './utils/logger.js';
import { CommandCache } from './utils/cache.js';
import { SecurityChecker } from './utils/security.js';

const logger = Logger.getInstance();
const cache = CommandCache.getInstance();

const server = new ShellMCPServer();

server.start().catch((error) => {
  logger.error('伺服器啟動失敗', { error });
  process.exit(1);
});
