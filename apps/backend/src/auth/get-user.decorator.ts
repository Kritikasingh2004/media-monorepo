import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  userId: string;
  email: string;
}

type AuthenticatedRequest = Request & { user?: AuthUser };

// Usage: @GetUser() -> AuthUser | undefined; @GetUser('userId') -> string | undefined
export const GetUser = createParamDecorator<keyof AuthUser | undefined>(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
