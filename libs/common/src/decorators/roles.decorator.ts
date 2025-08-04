import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/**
 * Roles decorator for RBAC. Usage: @Roles('admin', 'user')
 * Sets required roles metadata for route/controller.
 * @param roles - List of allowed roles
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles); 