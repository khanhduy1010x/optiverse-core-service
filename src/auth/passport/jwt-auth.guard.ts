import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AppException } from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { IS_PUBLIC_KEY } from '../decorator/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      console.log('error here');

      // Add error information to the response headers
      if (context) {
        try {
          const response = context.switchToHttp().getResponse();
          response.header('X-Auth-Error', 'true');
          response.header('X-Auth-Error-Type', err ? 'token_error' : 'no_user');
        } catch (e) {
          console.error('Failed to set auth error headers:', e);
        }
      }

      throw err || new AppException(ErrorCode.UNAUTHENTICATED);
    }
    return user;
  }
}
