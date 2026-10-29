import { describe, it, expect, vi } from 'vitest';
import { toast } from '@/hooks/use-toast';

vi.mock('sonner', () => ({
  toast: Object.assign(
    vi.fn(() => 'toast-id'),
    {
      success: vi.fn(() => 'success-id'),
      error: vi.fn(() => 'error-id'),
      info: vi.fn(() => 'info-id'),
      dismiss: vi.fn(),
    }
  ),
}));

describe('sonner toast adapter', () => {
  it('routes destructive variant to sonner error', async () => {
    const { toast: sonnerToast } = await import('sonner');
    toast({ title: 'Failed', description: 'Try again', variant: 'destructive' });
    expect(sonnerToast.error).toHaveBeenCalledWith('Failed', { description: 'Try again' });
  });

  it('routes success variant to sonner success', async () => {
    const { toast: sonnerToast } = await import('sonner');
    toast({ title: 'Saved', variant: 'success' });
    expect(sonnerToast.success).toHaveBeenCalledWith('Saved', undefined);
  });
});
