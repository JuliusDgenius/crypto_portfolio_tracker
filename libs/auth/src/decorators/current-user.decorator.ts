import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Enhanced decorator to retrieve the current user or specific user properties from the request.
 * Handles special cases like refresh token extraction from the Authorization header.
 * 
 * @param {string | keyof User} data - The specific property to retrieve or special key
 * @param {ExecutionContext} ctx - The execution context containing the request
 * @returns {User | any} - Returns the user object, a specific user property, or special value
 */
export const CurrentUser = createParamDecorator(
  (data: string | keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Special case for refresh token extraction
    if (data === 'refreshToken') {
      const authHeader = request.headers.authorization;
      if (!authHeader) return null;
      
      // Extract the token from "Bearer <token>"
      const [bearer, token] = authHeader.split(' ');
      if (bearer !== 'Bearer' || !token) return null;
      
      return token;
    }

    // Handle regular user properties
    if (typeof data === 'string' && data in user) {
      return user[data];
    }

    return data ? null : user;
  },
);