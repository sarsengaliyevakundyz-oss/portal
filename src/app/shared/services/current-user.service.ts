import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {RoleEnum, UserTokenInfo} from '../models/user.model';
import {jwtDecode} from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import * as CryptoJS from 'crypto-js';

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
  private currentUser!:UserTokenInfo;
  private permissions: RoleEnum[] = [];
  private authResponseKey = 'authResponse';
  private secretCodeKey   = 'secretCode';
  private iinKey = 'iin';
  private hasLoggedOut = false;

  constructor(
    private router: Router, 
    private http: HttpClient
  ) {
    window.addEventListener('message', this.onMessage.bind(this), false);
    const savedCode = localStorage.getItem(this.secretCodeKey);
    if (savedCode) {
      this.secretCode = savedCode;
      console.log('Loaded secretCode from localStorage:', savedCode);
    }
  }

    async deactivateToken(): Promise<void> {
      console.log("deactivateToken run")

      const iin = localStorage.getItem(this.iinKey);
      if (!iin) return;
  
      try {
        const key = CryptoJS.enc.Hex.parse('10c3417e0b38987f3b44528d999a090efd708bcef15d6357c252bcd42b4cf03d');
        const iv = CryptoJS.enc.Hex.parse('315f48391c3d3cc857128287f8457d47');
        const encryptedIIN = CryptoJS.AES.encrypt(iin, key, { iv: iv }).toString();
  
        await firstValueFrom(
          this.http.post(
            '/sso-internal-back-new/sso/internal/deactivateSecretCode',
            { iin: encryptedIIN },
            { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
          )
        );

        this.logout();
      } catch (error) {
        console.error('Error deactivating token:', error);
        throw error;
      }
    }
 
  private async onMessage(event: MessageEvent) {
    const data = event.data;
  if (data?.type === 'AUTH_SECRET_CODE') {
    const receivedCode = data.secretCode;
    if (typeof receivedCode !== 'string') {
      console.error('Unexpected secretCode:', receivedCode);
      return;
    }

    if (data.iin && !localStorage.getItem(this.iinKey)) {
      localStorage.setItem(this.iinKey, data.iin);
      console.log('Saved IIN to localStorage:', data.iin);
    }

    this.secretCode = receivedCode;
    localStorage.setItem(this.secretCodeKey, receivedCode);
    console.log('Получили secretCode через postMessage:', receivedCode);
    
      try {
        const response = await firstValueFrom(
          this.http.get<SsoTokenResponse>(
            '/internalportal/getSsoToken',
            {
              headers: new HttpHeaders({
                'Accept': 'application/json',
                'Authorization': this.secretCode!
              })
            }
          )
        );
        this.setUser(response.access_token, response.refresh_token);

        this.router.navigateByUrl('/').then(() => window.location.reload());
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

  // Method to get the current authenticated user's details
  getCurrentUser(): UserTokenInfo | null {
    if (!this.currentUser){
      // @ts-ignore
      const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey)) as UserTokenInfo;
      if(!userInfo){
        this.logout();
        return null;
      }
      else{
        this.setUser(userInfo.accessToken, userInfo.refreshToken);
      }
    };
    return this.currentUser;
  }

  getPermissions(): RoleEnum[]{
    return this.permissions;
  }

  // Method to check if the user is authenticated
  isAuthenticated(): boolean {
    if (!this.currentUser){
      // @ts-ignore
      const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey)) as UserTokenInfo;
      console.log("userInfo - ", userInfo)
      if(!userInfo){
        console.log("userInfo logout ")
        this.logout();
        return false;
      }
      else{
        this.setUser(userInfo.accessToken, userInfo.refreshToken);
      }
    };

    const decodedToken: any = jwtDecode(this.currentUser.accessToken);
    const expiry = decodedToken.exp * 1000;
    return Date.now() < expiry;
  }


  async logout() {
    if (this.hasLoggedOut) return;

    // await this.deactivateToken();
    console.log("this.hasLoggedOut - ", this.hasLoggedOut)
    localStorage.removeItem(this.authResponseKey);
    localStorage.removeItem(this.secretCodeKey);
    localStorage.removeItem(this.iinKey);
    window.open(
      `${window.location.origin}/ssointernalfrontnew?client-id=2`,
      '_blank'
    );
    this.hasLoggedOut = true;
    console.log("ssointernalfrontnew redirect")
  }

  checkPermissions(...permissions: RoleEnum[]): boolean {
    return permissions.some(permission => this.permissions.includes(permission));
  }


  setUser(token: string, refresh: string): void {
    console.log(token)
    console.log(refresh)
    try {
      const decoded: any = jwtDecode(token);
      this.currentUser = {
        accessToken: token,
        refreshToken: refresh,
        full_name: decoded.name,
        family_name: decoded.family_name,
        given_name: decoded.given_name,
        email: decoded.email,
        preferred_username: decoded.preferred_username
      } as UserTokenInfo;
      localStorage.setItem(this.authResponseKey, JSON.stringify(this.currentUser));
    } catch (error) {
      console.log("error error - ", error)

      // localStorage.removeItem(this.authResponseKey);
      // this.logout();
    }
  }


  isExpired(token: string): boolean {
    const payload = jwtDecode(token);

    // exp is in seconds since the epoch
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp! < currentTime;
  }

  minutesToExpire(): number {
    const payload = jwtDecode(this.currentUser.accessToken);
    const currentTime = Math.floor(Date.now() / 1000);

    // time until expiration in seconds
    const timeUntilExpire = payload.exp! - currentTime;

    // convert seconds to minutes
    return Math.floor(timeUntilExpire / 60);
  }
}
