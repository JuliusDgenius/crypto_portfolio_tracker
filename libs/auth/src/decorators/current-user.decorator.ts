import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Parameter decorator to extract the current user or specific user properties from the request.
 * 
 * Usage examples:
 * @CurrentUser() user: User - Gets the entire user object
 * @CurrentUser('email') email: string - Gets just the email property
 * 
 * @param {keyof User | undefined} propertyKey - Optional property key to extract from user
 * @param {ExecutionContext} ctx - Execution context containing the request
 * @returns {User | any} The user object or specified user property
 * 
 * @throws {UnauthorizedException} When no user is found in the request
 */
  export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log("Request object:=> ", request);
    
    // Ensure user exists on request
    if (!request.user) {
      throw new UnauthorizedException('No user found on request');
    }

    const user: User = request.user;

    // If a specific property was requested, return just that property
    if (data) {
      return user[data];
    }

    // Otherwise return the entire user object
    return user;
  }
);