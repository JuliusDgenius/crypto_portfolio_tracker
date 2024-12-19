import { IEntity } from '../interfaces/base.interface';

/**
 * Abstract base class for all entities
 * @abstract
 * @class BaseEntity
 * @implements {IEntity}
 */
export abstract class BaseEntity implements IEntity {
  /** Unique identifier */
  id: string;
  
  /** Timestamp of when the entity was created */
  createdAt: Date;
  
  /** Timestamp of when the entity was last updated */
  updatedAt: Date;

  /**
   * Creates an instance of BaseEntity
   * @param {Partial<BaseEntity>} partial - Partial entity data
   */
  constructor(partial: Partial<BaseEntity>) {
    Object.assign(this, partial);
  }
} 