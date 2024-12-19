/**
 * Base interface for all entities in the system
 * @interface IEntity
 */
export interface IEntity {
  /** Unique identifier */
  id: string;
  
  /** Timestamp of when the entity was created */
  createdAt: Date;
  
  /** Timestamp of when the entity was last updated */
  updatedAt: Date;
}

/**
 * Interface for entities that track who created/updated them
 * @interface IAuditableEntity
 * @extends {IEntity}
 */
export interface IAuditableEntity extends IEntity {
  /** ID of the user who created the entity */
  createdBy?: string;
  
  /** ID of the user who last updated the entity */
  updatedBy?: string;
} 