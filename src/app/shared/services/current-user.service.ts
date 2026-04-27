import {HttpClient, HttpHeaders} from "@angular/common/http"
import {Injectable} from "@angular/core"
import {Router} from "@angular/router"
import * as CryptoJS from 'crypto-js'
import {jwtDecode} from 'jwt-decode'
import {BehaviorSubject, firstValueFrom} from 'rxjs'
import {RoleEnum, UserTokenInfo} from '../models/user.model'
import {AuthService} from "./auth.service"
import {NgZone} from '@angular/core';

interface SsoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {
  private secretCode?: string;
  private currentUser!: UserTokenInfo;
  private permissions: RoleEnum[] = [];
  private authResponseKey = 'authResponse';
  private secretCodeKey = 'secretCode';
  private iinKey = 'iin';

  // ✅ 1. Заменили hasLoggedOut на isLogoutInProgress
  private isLogoutInProgress = false;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isAuthCheckedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  isAuthChecked$ = this.isAuthCheckedSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private zone: NgZone
  ) {
    window.addEventListener('message', this.onMessage.bind(this), false);
    const savedCode = localStorage.getItem(this.secretCodeKey);
    if (savedCode) {
      this.secretCode = savedCode;
    }
    this.checkInitialAuthenticationState();
  }

  private checkInitialAuthenticationState(): void {
    const isAuthenticated = this.checkAuthenticationStatus();
    const hasSecretCode = !!localStorage.getItem(this.secretCodeKey);

    if (!isAuthenticated && !hasSecretCode) {
      // ✅ Тоже с задержкой — роутер ещё не инициализирован в момент конструктора
      setTimeout(() => {
        this.zone.run(() => {
          this.redirectToSSO();
        });
      }, 0);
    }
  }
  private checkAuthenticationStatus(): boolean {
    const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey) || 'null') as UserTokenInfo;
    if (!userInfo) return false;

    try {
      const decodedToken: any = jwtDecode(userInfo.accessToken);
      const isValid = decodedToken.exp * 1000 > Date.now();

      if (isValid) {
        this.setUser(userInfo.accessToken, userInfo.refreshToken, true);
      } else {
        // ✅ Токен истёк — чистим localStorage
        localStorage.removeItem(this.authResponseKey);
        localStorage.removeItem(this.secretCodeKey);
      }

      return isValid;
    } catch (error) {
      localStorage.removeItem(this.authResponseKey);
      localStorage.removeItem(this.secretCodeKey);
      return false;
    }
  }

  // ✅ 2. deactivateToken через finally — выход всегда, IIN не удаляется
  async deactivateToken(): Promise<void> {
    if (this.isLogoutInProgress) return;
    this.isLogoutInProgress = true;

    const iin = localStorage.getItem(this.iinKey);

    try {
      if (iin) {
        const key = CryptoJS.enc.Hex.parse('10c3417e0b38987f3b44528d999a090efd708bcef15d6357c252bcd42b4cf03d');
        const iv = CryptoJS.enc.Hex.parse('315f48391c3d3cc857128287f8457d47');
        const encryptedIIN = CryptoJS.AES.encrypt(iin, key, {iv: iv}).toString();

        await firstValueFrom(
          this.http.post(
            '/sso-internal-back-new/sso/internal/deactivateSecretCode',
            {iin: encryptedIIN},
            {headers: new HttpHeaders({'Content-Type': 'application/json'})}
          )
        );
      } else {
        console.warn('IIN not found, skipping deactivation request');
      }
    } catch (error) {
      console.error('Error deactivating token:', error);
    } finally {
      // ✅ Выход всегда — и при успехе, и при ошибке, и без iin
      this.logoutAndRedirect();
    }
  }

  private logoutAndRedirect(): void {
    localStorage.removeItem(this.authResponseKey);
    localStorage.removeItem(this.secretCodeKey);

    this.isAuthenticatedSubject.next(false);
    this.isAuthCheckedSubject.next(true);
    this.currentUser = null as any;
    this.secretCode = undefined;
    this.isLogoutInProgress = false;

    window.open(this.buildSsoRedirectUrl(), '_blank');

    setTimeout(() => {
      this.zone.run(() => {
        this.router.navigate(['/']); // ✅ было /login
      });
    }, 100);
  }


  private async onMessage(event: MessageEvent) {
    // console.log('SSO MESSAGE FULL DATA:', JSON.stringify(event.data));

    const allowedOrigins = [
      'http://172.16.18.182:9999',
      'http://172.16.0.182:9999',
      'http://test.new.e.stat.gov.kz',
      'http://new.e.stat.gov.kz',
      window.location.origin
    ];

    if (!allowedOrigins.includes(event.origin)) {
      console.warn('Blocked origin:', event.origin);
      return;
    }

    const data = event.data;

    if (data?.type === 'AUTH_SECRET_CODE') {
      const receivedCode = data.secretCode;

      if (typeof receivedCode !== 'string') {
        console.error('Unexpected secretCode:', receivedCode);
        return;
      }

      // ✅ 5. Сохраняем IIN если SSO передал (при первом входе)
      if (data.iin) {
        localStorage.setItem(this.iinKey, data.iin);
      }

      this.secretCode = receivedCode;
      localStorage.setItem(this.secretCodeKey, receivedCode);

      try {
        const response = await firstValueFrom(
          this.http.get<SsoTokenResponse>(
            '/internalportal/getSsoToken',
            {
              headers: new HttpHeaders({
                'Accept': 'application/json',
                'secretCode': this.secretCode!
              })
            }
          )
        );

        this.zone.run(() => {
          this.setUser(response.access_token, response.refresh_token);
          this.isLogoutInProgress = false;
          localStorage.removeItem('sso_redirect_time'); // ✅ убираем флаг
          this.router.navigate(['/']);
        });

      } catch (err) {
        console.error('Не удалось получить SSO-токен:', err);
      }
    }
  }

  public getSecretCode(): string | undefined {
    return this.secretCode ?? localStorage.getItem(this.secretCodeKey) ?? undefined;
  }

  getCurrentUser(): UserTokenInfo | null {
    if (!this.currentUser) {
      const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey) || 'null') as UserTokenInfo;
      if (!userInfo) return null;
      this.setUser(userInfo.accessToken, userInfo.refreshToken, true);
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean { return this.isAuthenticatedSubject.value; }

  private redirectToSSO(): void {
    if (window.location.href.includes('ssointernalfrontnew')) {
      return;
    }

    if (this.isLogoutInProgress) {
      return;
    }

    // ✅ Проверяем через localStorage — работает между обновлениями
    const lastRedirect = localStorage.getItem('sso_redirect_time');
    if (lastRedirect && Date.now() - Number(lastRedirect) < 3000) {
      return;
    }

    this.isLogoutInProgress = true;
    localStorage.setItem('sso_redirect_time', Date.now().toString());

    localStorage.removeItem(this.authResponseKey);
    localStorage.removeItem(this.secretCodeKey);

    this.isAuthenticatedSubject.next(false);
    this.isAuthCheckedSubject.next(true);

    window.open(this.buildSsoRedirectUrl(), '_blank');

    setTimeout(() => {
      this.zone.run(() => {
        this.isLogoutInProgress = false;
        this.router.navigate(['/']);
      });
    }, 100);
  }
  // private buildSsoRedirectUrl(): string {
  //   return 'http://172.16.18.182:9999/ssointernalfrontnew/?client-id=2';
  // }
  private buildSsoRedirectUrl(): string {
    const { protocol, hostname, port, origin } = window.location;
    const effectivePort = port || '9999';

    if (hostname === 'test.new.e.stat.gov.kz') {
      return `${protocol}//${hostname}/ssointernalfrontnew/?client-id=2`;
    }
    if (hostname === 'new.e.stat.gov.kz') {
      const url = new URL(`${protocol}//172.16.0.182:${effectivePort}/ssointernalfrontnew`);
      url.searchParams.set('client-id', '2');
      return url.toString();
    }

    if (hostname === '172.16.18.182') {
      const url = new URL(`${protocol}//172.16.18.182:${effectivePort}/ssointernalfrontnew`);
      url.searchParams.set('client-id', '2');
      return url.toString();
    }

    const fallback = new URL('/ssointernalfrontnew', origin);
    fallback.searchParams.set('client-id', '2');
    return fallback.toString();
  }
  // ✅ 7. logout теперь просто вызывает deactivateToken
  async logout() {
    await this.deactivateToken();
  }
  setUser(token: string, refresh: string, updateAuthStatus: boolean = true): void {
    try {
      const isJwt = token && token.split('.').length === 3;
      const decoded: any = isJwt ? jwtDecode(token) : {};

      this.currentUser = {
        accessToken: token,
        refreshToken: refresh,
        full_name: decoded.name || '',
        family_name: decoded.family_name || '',
        given_name: decoded.given_name || '',
        email: decoded.email || '',
        preferred_username: decoded.preferred_username || ''
      } as UserTokenInfo;

      const secretCode = localStorage.getItem(this.secretCodeKey);
      if (secretCode) {
        localStorage.setItem(this.authResponseKey, JSON.stringify(this.currentUser));
      }
      if (updateAuthStatus) {
        this.isAuthenticatedSubject.next(true);
        this.isAuthCheckedSubject.next(true);
      }
    } catch (error) {
      console.error("Error setting user:", error);
      this.redirectToSSO();
    }
  }

  minutesToExpire(): number {
    if (!this.currentUser?.accessToken) return 0;
    try {
      const payload = jwtDecode(this.currentUser.accessToken);
      return Math.floor((payload.exp! - Math.floor(Date.now() / 1000)) / 60);
    } catch (e) {
      return 0;
    }
  }

  getToken(): string | null {
    return this.getCurrentUser()?.accessToken ?? null;
  }
}
