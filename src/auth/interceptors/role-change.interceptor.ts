import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RoleChangeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        if (request.roleChanged) {
          response.header('X-Role-Changed', 'true');
          response.header('X-New-Role', request.newRole);
        }

        return data;
      }),
    );
  }
}
