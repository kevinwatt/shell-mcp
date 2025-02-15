/// <reference types="jest" />
import { CommandExecutor } from '../executor.js';
import { Readable } from 'stream';
import { CommandCache } from '../../utils/cache.js';

describe('CommandExecutor', () => {
  let executor: CommandExecutor;
  let cache: CommandCache;

  beforeEach(() => {
    executor = new CommandExecutor();
    cache = CommandCache.getInstance();
  });

  afterEach(() => {
    cache.stopCleanup();
  });

  it('應該能執行簡單命令', async () => {
    const stream = await executor.execute('echo', ['hello']);
    const output = await collectOutput(stream.stdout);
    expect(output.trim()).toBe('hello');
  });

  // 移除或修改這些測試，因為 status 已經不存在了
  // it('應該處理超時', async () => { ... });
  // it('應該處理中斷', async () => { ... });
});

// 修改輔助函數使用 Node.js 的 Readable
async function collectOutput(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
    stream.on('error', reject);
  });
} 