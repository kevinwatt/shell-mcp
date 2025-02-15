import { CommandExecutor } from '../executor.js';

describe('CommandExecutor', () => {
  let executor: CommandExecutor;

  beforeEach(() => {
    executor = new CommandExecutor();
  });

  it('應該能執行簡單命令', async () => {
    const stream = await executor.execute('echo', ['hello']);
    const output = await collectOutput(stream.stdout);
    expect(output.trim()).toBe('hello');
  });

  it('應該處理超時', async () => {
    const stream = await executor.execute('sleep', ['2'], { timeout: 100 });
    const status = await collectStatus(stream.status);
    expect(status.some(s => s.type === 'interrupted')).toBe(true);
  });

  it('應該處理中斷', async () => {
    const stream = await executor.execute('sleep', ['5']);
    setTimeout(() => executor.interrupt(), 100);
    const status = await collectStatus(stream.status);
    expect(status.some(s => s.type === 'interrupted')).toBe(true);
  });
});

// 輔助函數
async function collectOutput(stream: ReadableStream): Promise<string> {
  const chunks: string[] = [];
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value));
    }
  } finally {
    reader.releaseLock();
  }

  return chunks.join('');
}

async function collectStatus(stream: ReadableStream): Promise<any[]> {
  const status: any[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      status.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return status;
} 