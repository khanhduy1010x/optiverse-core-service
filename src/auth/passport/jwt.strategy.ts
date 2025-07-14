import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from 'src/common/exceptions/app.exception';
import { ErrorCode } from 'src/common/exceptions/error-code.enum';
import { UserSessionRepository } from 'src/modules/users-sessions/user-session.repository';
import { request } from 'http';
import { JwtPayload } from '../dto/JwtPayload.dto';
import { UserRole } from 'src/modules/users/user.schema';
import { UserService } from 'src/modules/users/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userSessionRespository: UserSessionRepository,
    private readonly userService: UserService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new AppException(ErrorCode.MISSING_SECRET_KEY);
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any): Promise<JwtPayload> {
    try {
      const isSessionRequired = !['/auth/reset-password'].includes(request.url);
      if (isSessionRequired) {
        const isValidSession = await this.userSessionRespository.validateIsActive(
          payload.session_id,
        );
        if (!isValidSession) {
          (request as any).authError = {
            type: 'session_expired',
            code: ErrorCode.ACCOUNT_IS_LOGOUT,
          };
          throw new AppException(ErrorCode.ACCOUNT_IS_LOGOUT);
        }
      }

      const user = await this.userService.findById(payload.sub);
      if (user && user.status === 'suspended') {
        (request as any).authError = {
          type: 'user_banned',
          code: ErrorCode.USER_IS_BANNED,
        };
        (request as any).userBanned = true;
        throw new AppException(ErrorCode.USER_IS_BANNED);
      }

      const jwtRole = payload.role || UserRole.USER;
      const currentRole = user?.role || UserRole.USER;

      if (jwtRole !== currentRole) {
        (request as any).roleChanged = true;
        (request as any).newRole = currentRole;
      }

      return new JwtPayload(
        payload.sub,
        payload.email,
        payload.full_name,
        payload.session_id,
        currentRole,
      );
    } catch (error) {
      (request as any).authError = {
        type: error instanceof AppException ? ErrorCode.ACCOUNT_IS_LOGOUT : 'token_error',
        message: error.message,
      };
      throw error;
    }
  }
}
