import { IEntity } from './base.interface';

/**
 * Generic repository interface for CRUD operations
 * @typeParam T - Entity type that extends IEntity
 */
export interface IRepository<T extends IEntity> {
  /**
   * Creates a new entity
   * @param data - Partial entity data
   * @returns Promise resolving to the created entity
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Finds an entity by its ID
   * @param id - Entity identifier
   * @returns Promise resolving to the entity or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Retrieves all entities
   * @returns Promise resolving to array of entities
   */
  findAll(): Promise<T[]>;

  /**
   * Updates an existing entity
   * @param id - Entity identifier
   * @param data - Partial entity data to update
   * @returns Promise resolving to the updated entity
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Deletes an entity
   * @param id - Entity identifier
   * @returns Promise resolving to boolean indicating success
   */
  delete(id: string): Promise<boolean>;
} 