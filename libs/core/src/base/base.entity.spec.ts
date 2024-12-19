import { BaseEntity } from './base.entity';

class TestEntity extends BaseEntity {
  name: string;

  constructor(partial: Partial<TestEntity>) {
    super(partial);
  }
}

describe('BaseEntity', () => {
  it('should create an instance with complete data', () => {
    const now = new Date();
    const entity = new TestEntity({
      id: '1',
      name: 'test',
      createdAt: now,
      updatedAt: now,
    });

    expect(entity.id).toBe('1');
    expect(entity.name).toBe('test');
    expect(entity.createdAt).toBe(now);
    expect(entity.updatedAt).toBe(now);
  });

  it('should handle partial initialization with only required fields', () => {
    const entity = new TestEntity({
      id: '1',
      name: 'test',
    });

    expect(entity.id).toBe('1');
    expect(entity.name).toBe('test');
    expect(entity.createdAt).toBeUndefined();
    expect(entity.updatedAt).toBeUndefined();
  });

  it('should handle empty initialization', () => {
    const entity = new TestEntity({});
    
    expect(entity.id).toBeUndefined();
    expect(entity.name).toBeUndefined();
    expect(entity.createdAt).toBeUndefined();
    expect(entity.updatedAt).toBeUndefined();
  });

  it('should handle null values', () => {
    const entity = new TestEntity({
      id: null as any,
      name: null as any,
      createdAt: null as any,
      updatedAt: null as any,
    });

    expect(entity.id).toBeNull();
    expect(entity.name).toBeNull();
    expect(entity.createdAt).toBeNull();
    expect(entity.updatedAt).toBeNull();
  });

  it('should preserve date objects', () => {
    const now = new Date();
    const entity = new TestEntity({
      createdAt: now,
      updatedAt: now,
    });

    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle date strings', () => {
    const dateStr = '2024-01-01T00:00:00.000Z';
    const entity = new TestEntity({
      createdAt: new Date(dateStr),
      updatedAt: new Date(dateStr),
    });

    expect(entity.createdAt?.toISOString()).toBe(dateStr);
    expect(entity.updatedAt?.toISOString()).toBe(dateStr);
  });
}); 