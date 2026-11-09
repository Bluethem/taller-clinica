import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const health = { check: vi.fn() };
  const db = { pingCheck: vi.fn() };
  let controller: HealthController;

  beforeEach(() => {
    health.check.mockReset();
    db.pingCheck.mockReset();
    db.pingCheck.mockResolvedValue({ database: { status: 'up' } });
    health.check.mockImplementation(async (indicators) => {
      const results = await Promise.all(indicators.map((fn: () => unknown) => fn()));
      return { status: 'ok', details: Object.assign({}, ...results) };
    });
    controller = new HealthController(health as never, db as never);
  });

  it('delega el ping de base de datos a Terminus', async () => {
    const result = await controller.check();
    expect(health.check).toHaveBeenCalledTimes(1);
    expect(db.pingCheck).toHaveBeenCalledWith('database');
    expect(result.status).toBe('ok');
  });
});
