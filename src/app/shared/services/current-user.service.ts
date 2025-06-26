import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {RoleEnum, UserTokenInfo} from '../models/user.model';
import {jwtDecode} from 'jwt-decode';
import { firstValueFrom } from 'rxjs';

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

  private currentUser!:UserTokenInfo;
  private permissions: RoleEnum[] = [];
  private authResponseKey = 'authResponse';
  private hasLoggedOut = false;

  constructor(
    private router: Router, 
    private http: HttpClient
  ) {
    window.addEventListener('message', this.onMessage.bind(this), false);
  }
 
  private async onMessage(event: MessageEvent) {
    console.log('event', event);
    const data = event.data;
    if (data?.type === 'AUTH_SECRET_CODE') {
      const secretCode = data.secretCode;
      console.log('Получили secretCode через postMessage:', secretCode);
    
      try {
        const response = await firstValueFrom(
          this.http.get<SsoTokenResponse>(
            '/internalportal/getSsoToken',
            {
              headers: new HttpHeaders({
                'Accept': 'application/json',
                'Authorization': secretCode
              })
            }
          )
        );
        this.setUser(response.access_token, response.refresh_token);

        this.router.navigateByUrl('/');
      } catch (err) {
        console.error('Не удалось получить SSO-токен:', err);
      }
    }
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


  logout() {
    if (this.hasLoggedOut) return;
    console.log("this.hasLoggedOut - ", this.hasLoggedOut)
    window.location.href = `${window.location.origin}/ssointernalfrontnew?client‐id=2`;
    this.hasLoggedOut = true;
    localStorage.removeItem(this.authResponseKey);
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
      localStorage.removeItem(this.authResponseKey);
      this.logout();
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
