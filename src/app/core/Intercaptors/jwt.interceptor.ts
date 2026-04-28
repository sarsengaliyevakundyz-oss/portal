import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, firstValueFrom, from, throwError} from 'rxjs';
import {CurrentUserService} from '../../shared/services/current-user.service';
import {AuthService} from '../../shared/services/auth.service';
import {catchError, switchMap} from 'rxjs/operators';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenPromise: Promise<void> | null = null;

  private readonly AUTH_EXCLUSION_URLS = [
    '/internalportal/getToken',
    '/internalportal/getSsoToken',
    '/sso-internal-back-new/sso/internal/deactivateSecretCode'
  ];

  constructor(
    private currentUserService: CurrentUserService,
    private authService: AuthService
  ) {}

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
        // ✅ Нет данных для рефреша — чистим и редиректим без HTTP запроса
        this.clearAndRedirect();
        return throwError(() => new Error('Missing refresh token or secret code'));
      }

      this.refreshTokenPromise = firstValueFrom(
        this.authService.refreshToken(refreshToken, secretCode)
      )
        .then(res => {
          this.currentUserService.setUser(res.access_token, res.refresh_token);
        })
        .catch(err => {
          // ✅ НЕ вызываем logout() — он делает HTTP запрос и создаёт цикл
          // Чистим localStorage напрямую и редиректим в SSO
          this.clearAndRedirect();
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
        }),
        catchError(err => {
          // ✅ Если рефреш упал — не повторяем запрос, просто пробрасываем ошибку
          return throwError(() => err);
        })
      );
    }

    const authReq = req.clone({
      headers: req.headers.set('Authorization', `${authToken}`)
    });
    return next.handle(authReq);
  }

  // ✅ Чистим всё напрямую без HTTP запросов — исключаем зацикливание
  private clearAndRedirect(): void {
    // ✅ Проверяем глобальный флаг
    if ((window as any).__ssoRedirecting) {
      return;
    }

    if (!localStorage.getItem('authResponse')) {
      return;
    }

    (window as any).__ssoRedirecting = true;

    localStorage.removeItem('authResponse');
    localStorage.removeItem('secretCode');

    this.isRefreshing = false;
    this.refreshTokenPromise = null;

    const ssoUrl = this.buildSsoUrl();
    window.open(ssoUrl, '_blank');

    setTimeout(() => {
      (window as any).__ssoRedirecting = false;
      window.location.href = window.location.origin + '/internalportalfront/';
    }, 100);
  }

  private buildSsoUrl(): string {
    const {protocol, hostname, port, origin} = window.location;
    const effectivePort = port || '9999';

    if (hostname === 'test.new.e.stat.gov.kz') {
      return `${protocol}//${hostname}/ssointernalfrontnew/?client-id=2`;  // ✅ добавь
    }
    if (hostname === 'new.e.stat.gov.kz') {
      return `${protocol}//${hostname}/ssointernalfrontnew?client-id=2`;
    }
    if (hostname === '172.16.18.182') {
      return `${protocol}//172.16.18.182:${effectivePort}/ssointernalfrontnew?client-id=2`;
    }
    return `${origin}/ssointernalfrontnew?client-id=2`;
  }
}
