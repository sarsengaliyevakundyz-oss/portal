import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CurrentUserService} from '../../shared/services/current-user.service';
import {AuthService} from '../../shared/services/auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  tokenIsUpdating = false;
  private readonly AUTH_EXCLUSION_URLS = [
    '/internalportal/getToken',
    '/internalportal/getSsoToken'
  ];
  constructor(private currentUserService: CurrentUserService, private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.AUTH_EXCLUSION_URLS.some(url => req.url.includes(url))) {
      return next.handle(req); 
    }
    
    const user = this.currentUserService.getCurrentUser();
    const authToken = this.currentUserService.getCurrentUser()?.accessToken;
    const refreshToken = this.currentUserService.getCurrentUser()?.refreshToken;
    const secretCode = this.currentUserService.getSecretCode();

    if (authToken) {
        if(this.currentUserService.minutesToExpire()<15 && !this.tokenIsUpdating){
          this.tokenIsUpdating = true;
          this.authService.refreshToken(refreshToken!, secretCode!).subscribe(res=>{
            this.currentUserService.setUser(res.access_token, res.refresh_token);
            this.tokenIsUpdating = false;
          });
        }
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${authToken}`)
        });
        return next.handle(authReq);
    }

    return next.handle(req);
  }

}
