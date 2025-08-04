export class UserEntity {
    id: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    /**
     * RBAC roles assigned to the user
     */
    roles: string[];
  
    // Helper method to create full name
    getFullName(): string {
      return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }
  }
  