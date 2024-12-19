/**
 * Base Data Transfer Object with common entity properties
 */
export class BaseDTO {
  /** Unique identifier */
  id: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Base DTO for entity creation operations
 */
export class CreateBaseDTO {
  /** ID of the user creating the entity */
  createdBy?: string;
}

/**
 * Base DTO for entity update operations
 */
export class UpdateBaseDTO {
  /** ID of the user updating the entity */
  updatedBy?: string;
} 