import { vi } from 'vitest';

vi.mock('postgres', () => {
  const mockClient = vi.fn() as unknown as {
    options: {
      parsers: Record<string, unknown>;
      serializers: Record<string, unknown>;
    };
  };
  mockClient.options = {
    parsers: {},
    serializers: {},
  };
  return {
    default: vi.fn(() => mockClient),
  };
});
