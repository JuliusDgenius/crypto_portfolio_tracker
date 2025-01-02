import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Custom decorator to retrieve the current user from the request.
 * 
 * @param {keyof User} data - The specific property of the user to retrieve.
 * @param {ExecutionContext} ctx - The execution context containing the request.
 * @returns {User | any} - Returns the user object or a specific property of the user.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);