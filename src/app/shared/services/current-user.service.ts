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
  private hasLoggedOut = false;
  private isDeactivating = false; // Флаг для предотвращения повторных вызовов
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isAuthCheckedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  isAuthChecked$ = this.isAuthCheckedSubject.asObservable();

  private ssoWindow: Window | null = null;

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

    if (!isAuthenticated && !hasSecretCode && !this.hasLoggedOut) {
      this.redirectToSSO();
      return;
    }
  }

  private checkAuthenticationStatus(): boolean {
    const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey) || 'null') as UserTokenInfo;

    if (!userInfo) {
      return false;
    }

    try {
      const decodedToken: any = jwtDecode(userInfo.accessToken);
      const isValid = decodedToken.exp * 1000 > Date.now();

      if (isValid) {
        this.setUser(userInfo.accessToken, userInfo.refreshToken, true);
      }
      return isValid;
    } catch (error) {
      return false;
    }
  }

  async deactivateToken(): Promise<void> {
    // Предотвращаем повторные вызовы
    if (this.isDeactivating) {
      console.log("Deactivation already in progress, skipping");
      return;
    }

    console.log("deactivateToken started");
    this.isDeactivating = true;

    const iin = localStorage.getItem(this.iinKey);

    // Сначала закрываем SSO окно если оно есть
    if (this.ssoWindow && !this.ssoWindow.closed) {
      try {
        this.ssoWindow.close();
      } catch(e) {}
      this.ssoWindow = null;
    }

    // Очищаем флаг hasLoggedOut чтобы разрешить выход
    this.hasLoggedOut = false;

    if (!iin) {
      console.log('No IIN found, logging out');
      await this.performLogout();
      this.isDeactivating = false;
      return;
    }

    console.log('IIN found, sending deactivation request');

    try {
      const key = CryptoJS.enc.Hex.parse('10c3417e0b38987f3b44528d999a090efd708bcef15d6357c252bcd42b4cf03d');
      const iv = CryptoJS.enc.Hex.parse('315f48391c3d3cc857128287f8457d47');
      const encryptedIIN = CryptoJS.AES.encrypt(iin, key, {iv: iv}).toString();

      // Отправляем запрос с таймаутом
      await firstValueFrom(
        this.http.post(
          '/sso-internal-back-new/sso/internal/deactivateSecretCode',
          {iin: encryptedIIN},
          {headers: new HttpHeaders({'Content-Type': 'application/json'})}
        )
      );
      console.log('Deactivation request successful');
    } catch (error: any) {
      console.error('Error deactivating token:', error?.message || error);
      // Продолжаем выход даже при ошибке
    }

    // Всегда выполняем выход
    await this.performLogout();
    this.isDeactivating = false;
  }

  private async performLogout(): Promise<void> {
    console.log("Performing logout");

    // Очищаем все локальные данные
    localStorage.removeItem(this.authResponseKey);
    localStorage.removeItem(this.secretCodeKey);
    localStorage.removeItem(this.iinKey);

    // Очищаем sessionStorage
    sessionStorage.clear();

    // Очищаем cookies
    this.clearCookies();

    // Сбрасываем состояние
    this.currentUser = null as any;
    this.secretCode = undefined;
    this.hasLoggedOut = true;

    // Обновляем BehaviorSubject
    this.isAuthenticatedSubject.next(false);
    this.isAuthCheckedSubject.next(true);

    // Закрываем SSO окно если оно еще открыто
    if (this.ssoWindow && !this.ssoWindow.closed) {
      try {
        this.ssoWindow.close();
      } catch(e) {}
      this.ssoWindow = null;
    }

    // Перенаправляем на страницу логина с очисткой истории
    await this.router.navigate(['/login'], { replaceUrl: true });

    // Принудительная перезагрузка для полной очистки кэша
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, 50);
  }

  private clearCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      }
      console.log('Cookies cleared');
    } catch(e) {
      console.warn('Could not clear all cookies:', e);
    }
  }

  private async onMessage(event: MessageEvent) {
    console.log('SSO MESSAGE:', event.origin, event.data);

    const allowedOrigins = [
      'http://172.16.18.182:9999',
      'http://172.16.0.182:9999',
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

      // сохраняем iin
      if (data.iin) {
        localStorage.setItem(this.iinKey, data.iin);
      }

      // сохраняем secretCode
      this.secretCode = receivedCode;
      localStorage.setItem(this.secretCodeKey, receivedCode);

      try {
        const response = await firstValueFrom(
          this.http.get<SsoTokenResponse>(
            '/internalportal/getSsoToken',  // Этот URL должен быть полным или проксирован
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
          this.hasLoggedOut = false;
          this.isDeactivating = false;
          // Навигация с правильным base path
          this.router.navigate(['/'], { replaceUrl: true });
        });

      } catch (err) {
        console.error('Не удалось получить SSO-токен:', err);
      }
    }
  }
  public getAuthResponseKey(): string {
    return this.authResponseKey;
  }

  public getSecretCodeKey(): string {
    return this.secretCodeKey;
  }

  public getSecretCode(): string | undefined {
    return this.secretCode ?? localStorage.getItem(this.secretCodeKey) ?? undefined;
  }

  getCurrentUser(): UserTokenInfo | null {
    if (!this.currentUser){
      const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey) || 'null') as UserTokenInfo;
      if(!userInfo){
        return null;
      }
      else{
        this.setUser(userInfo.accessToken, userInfo.refreshToken, true);
      }
    };
    return this.currentUser;
  }

  getPermissions(): RoleEnum[] {
    return this.permissions;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getIsAuthChecked(): boolean {
    return this.isAuthCheckedSubject.value;
  }

  private redirectToSSO(): void {
    if (this.hasLoggedOut) return;

    localStorage.removeItem(this.authResponseKey);
    localStorage.removeItem(this.secretCodeKey);
    localStorage.removeItem(this.iinKey);

    this.isAuthenticatedSubject.next(false);
    this.isAuthCheckedSubject.next(true);

    // Сохраняем ссылку на окно
    this.ssoWindow = window.open(this.buildSsoRedirectUrl(), '_blank');
    this.hasLoggedOut = true;
  }

  private buildSsoRedirectUrl(): string {
    const { protocol, hostname, port, origin } = window.location;
    const effectivePort = port || '9999';

    if (hostname === 'new.e.stat.gov.kz') {
      const url = new URL(`${protocol}//new.e.stat.gov.kz:${effectivePort}/ssointernalfrontnew`);
      url.searchParams.set('client-id', '2');
      return url.toString();
    }

    if (hostname === '172.16.0.182') {
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


  async logout() {
    if (this.hasLoggedOut) return;
    await this.performLogout();
  }

  checkPermissions(...permissions: RoleEnum[]): boolean {
    return permissions.some(permission => this.permissions.includes(permission));
  }

  setUser(token: string, refresh: string, updateAuthStatus: boolean = true): void {
    try {
      const isJwt = token && token.split('.').length === 3;
      const decoded: any = isJwt ? jwtDecode(token) : {}

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

  isExpired(token: string): boolean {
    const payload = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp! < currentTime;
  }

  minutesToExpire(): number {
    if (!this.currentUser || !this.currentUser.accessToken) {
      return 0;
    }
    try {
      const payload = jwtDecode(this.currentUser.accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpire = payload.exp! - currentTime;
      return Math.floor(timeUntilExpire / 60);
    } catch (e) {
      console.error("Error decoding token for minutesToExpire", e);
      return 0;
    }
  }

  getToken(): string | null {
    const user = this.getCurrentUser();
    if (user && user.accessToken) {
      return user.accessToken;
    }
    return null;
  }
}
