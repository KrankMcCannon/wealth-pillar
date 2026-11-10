import { channel } from 'node:diagnostics_channel';
import { expect, it, vi } from 'vitest';
import { installDatabaseTelemetry, withDatabaseOperation } from './telemetry';

it('emits timing and correlation while excluding SQL, parameters, errors and rows', async () => {
  const emit = vi.fn();
  const dispose = installDatabaseTelemetry(emit);
  try {
    await withDatabaseOperation('test.read', async () => {
      channel('tracing:postgres:query:asyncEnd').publish({
        queued: 10,
        sent: 15,
        complete: 25,
        count: 1,
        query: 'secret SQL',
        parameters: ['secret password'],
        result: [{ amount: '123.45' }],
        error: { code: '08006', message: 'secret data' },
      });
    });
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'test.read',
        requestId: expect.any(String),
        durationMs: 15,
        queueMs: 5,
        roundTripMs: 10,
        code: '08006',
      })
    );
    expect(JSON.stringify(emit.mock.calls)).not.toContain('secret');
    expect(JSON.stringify(emit.mock.calls)).not.toContain('123.45');
  } finally {
    dispose();
  }
});

it('does not let a broken metrics sink fail a query', () => {
  const dispose = installDatabaseTelemetry(() => {
    throw new Error('sink unavailable');
  });
  try {
    expect(() =>
      channel('tracing:postgres:query:asyncEnd').publish({
        queued: 0,
        sent: null,
        complete: 1,
        count: null,
      })
    ).not.toThrow();
  } finally {
    dispose();
  }
});
