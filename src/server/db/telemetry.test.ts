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

it('logs a correlated wrapped failure without metrics or sensitive query details', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const failure = new Error('secret SQL and parameters', {
    cause: Object.assign(new Error('secret connection string'), { code: '08006' }),
  });
  try {
    await expect(
      withDatabaseOperation('dashboard', async () => {
        throw failure;
      })
    ).rejects.toBe(failure);
    expect(log).toHaveBeenCalledTimes(1);
    const event = JSON.parse(log.mock.calls[0]![0]);
    expect(event).toEqual({
      event: 'database.operation_failed',
      operation: 'dashboard',
      requestId: expect.any(String),
      code: '08006',
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
  } finally {
    log.mockRestore();
  }
});

it('preserves the original failure if the error log is unavailable', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {
    throw new Error('log unavailable');
  });
  const failure = new Error('original failure');
  try {
    await expect(
      withDatabaseOperation('dashboard', async () => {
        throw failure;
      })
    ).rejects.toBe(failure);
  } finally {
    log.mockRestore();
  }
});
