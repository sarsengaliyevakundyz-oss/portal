import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  tap
} from 'rxjs/operators';
import { CurrentUserService } from '../../shared/services/current-user.service';
import { AuthService } from '../../shared/services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private tokenIsUpdating = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private currentUserService: CurrentUserService,
    private authService: AuthService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const user = this.currentUserService.getCurrentUser();
    const accessToken = user?.accessToken;
    const refreshToken = user?.refreshToken;
    const secretCode = this.currentUserService.getSecretCode();

    if (!accessToken) {
      return next.handle(req);
    }

    if (this.currentUserService.minutesToExpire() < 15) {
      if (!this.tokenIsUpdating) {
        this.tokenIsUpdating = true;
        this.refreshTokenSubject.next(null);

        return this.authService
          .refreshToken(refreshToken!, secretCode!)
          .pipe(
            tap(res => {
              this.currentUserService.setUser(res.access_token, res.refresh_token);
              this.refreshTokenSubject.next(res.access_token);
            }),
            catchError(err => {
              this.currentUserService.logout();
              return throwError(() => err);
            }),
            finalize(() => {
              this.tokenIsUpdating = false;
            }),
            switchMap(() => {
              const fresh = this.currentUserService.getCurrentUser()!.accessToken;
              const authReq = req.clone({
                headers: req.headers.set('Authorization', fresh)
              });
              return next.handle(authReq);
            })
          );
      } else {
        return this.refreshTokenSubject.pipe(
          filter(token => token != null),
          take(1),
          switchMap(token => {
            const authReq = req.clone({
              headers: req.headers.set('Authorization', token!)
            });
            return next.handle(authReq);
          })
        );
      }
    }

    const authReq = req.clone({
      headers: req.headers.set('Authorization', accessToken)
    });
    return next.handle(authReq);
  }
}
