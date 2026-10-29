import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCategoryUseCase } from './category.use-cases';
import { CategoriesRepository } from '@/server/repositories/categories.repository';

vi.mock('@/server/repositories/categories.repository', () => ({
  CategoriesRepository: {
    findByKey: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateCategoryCaches: vi.fn(),
}));

vi.mock('@/lib/utils/serializer', () => ({
  serialize: (v: unknown) => v,
}));

const baseInput = {
  label: 'Spesa',
  key: 'spesa',
  icon: 'ShoppingBasket',
  color: '#10B981',
  group_id: '0021a4c8-62bc-4ff1-a5aa-ddee837733a8',
};

describe('createCategoryUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the base key when it is not taken', async () => {
    vi.mocked(CategoriesRepository.findByKey).mockResolvedValue(null);
    vi.mocked(CategoriesRepository.create).mockResolvedValue({
      id: 'cat-1',
      ...baseInput,
      key: 'spesa',
    } as never);

    const result = await createCategoryUseCase(baseInput);

    expect(CategoriesRepository.findByKey).toHaveBeenCalledWith('spesa');
    expect(CategoriesRepository.create).toHaveBeenCalledWith({
      label: 'Spesa',
      key: 'spesa',
      icon: 'ShoppingBasket',
      color: '#10B981',
      group_id: baseInput.group_id,
    });
    expect(result.key).toBe('spesa');
  });

  it('appends a suffix when the base key already exists', async () => {
    vi.mocked(CategoriesRepository.findByKey)
      .mockResolvedValueOnce({ id: 'existing', key: 'spesa' } as never)
      .mockResolvedValueOnce(null);
    vi.mocked(CategoriesRepository.create).mockResolvedValue({
      id: 'cat-2',
      ...baseInput,
      key: 'spesa_2',
    } as never);

    const result = await createCategoryUseCase(baseInput);

    expect(CategoriesRepository.findByKey).toHaveBeenNthCalledWith(1, 'spesa');
    expect(CategoriesRepository.findByKey).toHaveBeenNthCalledWith(2, 'spesa_2');
    expect(CategoriesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Spesa',
        key: 'spesa_2',
        icon: 'ShoppingBasket',
        color: '#10B981',
        group_id: baseInput.group_id,
      })
    );
    expect(result.key).toBe('spesa_2');
  });

  it('normalizes the key to lowercase before uniqueness check', async () => {
    vi.mocked(CategoriesRepository.findByKey).mockResolvedValue(null);
    vi.mocked(CategoriesRepository.create).mockResolvedValue({
      id: 'cat-3',
      label: 'Spesa',
      key: 'spesa',
      icon: 'ShoppingBasket',
      color: '#10B981',
      group_id: baseInput.group_id,
    } as never);

    await createCategoryUseCase({ ...baseInput, key: 'SPESA' });

    expect(CategoriesRepository.findByKey).toHaveBeenCalledWith('spesa');
    expect(CategoriesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'spesa' })
    );
  });
});
