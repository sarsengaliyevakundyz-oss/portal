import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, firstValueFrom, from, throwError} from 'rxjs'; // Добавляем 'from' и 'throwError'
import {CurrentUserService} from '../../shared/services/current-user.service';
import {AuthService} from '../../shared/services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenPromise: Promise<void> | null = null;

  private readonly AUTH_EXCLUSION_URLS = [
    '/internalportal/getToken',
    '/internalportal/getSsoToken'
  ];
  constructor(private currentUserService: CurrentUserService, private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.AUTH_EXCLUSION_URLS.some(url => req.url.includes(url))) {
      return next.handle(req);
    }

    const authToken = this.currentUserService.getCurrentUser()?.accessToken;
    if (!authToken) {
      return next.handle(req);
    }

    const isTokenExpired = this.currentUserService.minutesToExpire() < 15;

    if (isTokenExpired && !this.isRefreshing) {
      this.isRefreshing = true;

      const refreshToken = this.currentUserService.getCurrentUser()?.refreshToken;
      const secretCode = this.currentUserService.getSecretCode();

      if (!refreshToken || !secretCode) {
        this.currentUserService.logout();
        return throwError(() => new Error('Missing refresh token or secret code'));
      }
      this.refreshTokenPromise = firstValueFrom(
        this.authService.refreshToken(refreshToken, secretCode)
      )
        .then(res => {
          this.currentUserService.setUser(res.access_token, res.refresh_token);
        })
        .catch(err => {
          this.currentUserService.logout();
          throw err;
        })
        .finally(() => {
          this.isRefreshing = false;
          this.refreshTokenPromise = null;
        });
    }

    if (this.isRefreshing && this.refreshTokenPromise) {
      return from(this.refreshTokenPromise).pipe(
        switchMap(() => {
          const newAuthToken = this.currentUserService.getCurrentUser()?.accessToken;
          if (!newAuthToken) {
            return next.handle(req);
          }
          const refreshedReq = req.clone({
            headers: req.headers.set('Authorization', `${newAuthToken}`)
          });
          return next.handle(refreshedReq);
        })
      );
    }

    const authReq = req.clone({
      headers: req.headers.set('Authorization', `${authToken}`)
    });
    return next.handle(authReq);
  }
}
