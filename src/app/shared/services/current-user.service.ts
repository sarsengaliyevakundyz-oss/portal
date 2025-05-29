import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {RoleEnum, UserTokenInfo} from '../models/user.model';
import {jwtDecode} from 'jwt-decode';



@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  private currentUser!:UserTokenInfo;
  private permissions: RoleEnum[] = [];
  private authResponseKey = 'authResponse';
  private isLoggingOut = false;
  constructor(private router: Router, private http: HttpClient) {
    this.setupSSOListener();
  }

  private setupSSOListener() {
    window.removeEventListener('message', this.messageHandler);
    window.addEventListener('message', this.messageHandler.bind(this));
  }

  private messageHandler(event: MessageEvent) {
    console.log("event - ", event);
    
    if (event.origin !== window.location.origin) return;

    if (event.data?.data) {
      this.handleSSOResponse(event.data.data);
    }
  }

  private handleSSOResponse(secretCode: string) {
    this.http.post('/getSsoToken', { secretCode })
      .subscribe({
        next: (response: any) => {
          this.setUser(response.accessToken, response.refreshToken);
        },
        error: (err) => {
          console.error('Token exchange failed', err);
          this.router.navigate(['/login']);
        }
      });
  }

  // Method to get the current authenticated user's details
  getCurrentUser(): UserTokenInfo | null {
    if (!this.currentUser){
      // @ts-ignore
      const userInfo = JSON.parse(localStorage.getItem(this.authResponseKey)) as UserTokenInfo;
      if(!userInfo){
        this.logout()
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
      if(!userInfo){
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
    if (this.isLoggingOut) return;
    
    this.isLoggingOut = true;
    localStorage.removeItem(this.authResponseKey);
    
    const ssoUrl = `${window.location.origin}/ssointernalfrontnew/?client-id=2`;
    
    window.location.replace(ssoUrl);
  }

  checkPermissions(...permissions: RoleEnum[]): boolean {
    return permissions.some(permission => this.permissions.includes(permission));
  }


  setUser(token: string, refresh: string): void {
    console.log(token)
    console.log(refresh)
    try {
      const decodedToken: any = jwtDecode(token);
      console.log('decoded', decodedToken)
      if(!this.isExpired(token)){
        this.currentUser = {accessToken: token, family_name: decodedToken.family_name, given_name: decodedToken.given_name,
          full_name: decodedToken.name, email: decodedToken.email, preferred_username: decodedToken.preferred_username, refreshToken: refresh } as UserTokenInfo;
        localStorage.setItem(this.authResponseKey, JSON.stringify(this.currentUser));
      }
      else{
        console.log('token expired')
        this.logout();
      }
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
