import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CurrentUserService} from '../../shared/services/current-user.service';
import {AuthService} from '../../shared/services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  tokenIsUpdating = false;
  constructor(private currentUserService: CurrentUserService, private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authToken = this.currentUserService.getCurrentUser()?.accessToken;
    const refreshToken = this.currentUserService.getCurrentUser()?.refreshToken;
    if (authToken) {
      //Проверка если токен меньше 10 минут то обновить и уже потом отправить запрос
        if(this.currentUserService.minutesToExpire()<10 && !this.tokenIsUpdating){
          this.tokenIsUpdating = true;
          this.authService.refreshToken(refreshToken!).subscribe(res=>{
            this.currentUserService.setUser(res.access_token, res.refresh_token);
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
