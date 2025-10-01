import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CurrentUserService} from '../../shared/services/current-user.service';
import {AuthService} from '../../shared/services/auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  tokenIsUpdating = false;
  constructor(private currentUserService: CurrentUserService, private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.currentUserService.getCurrentUser();
    const authToken = this.currentUserService.getCurrentUser()?.accessToken;
    const refreshToken = this.currentUserService.getCurrentUser()?.refreshToken;
    const secretCode = this.currentUserService.getSecretCode();
    if (authToken) {
        if(this.currentUserService.minutesToExpire()<15 && !this.tokenIsUpdating){
          this.tokenIsUpdating = true;
          this.authService.refreshToken(refreshToken!, secretCode!).subscribe(res=>{
            this.currentUserService.setUser("test", res.refresh_token);
            this.tokenIsUpdating = false;
          });
        }
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `${authToken}`)
        });
        return next.handle(authReq);
    }

    return next.handle(req);
  }

}
