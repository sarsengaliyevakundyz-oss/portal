import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import {CurrentUserService} from '../../shared/services/current-user.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private currentUserService: CurrentUserService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('hi')
    const token = this.currentUserService.getCurrentUser()?.accessToken;
    if (token) {
      const modifiedReq = req.clone({
        setHeaders: {
          Authorization: `${token}`
        }
      });
      return next.handle(modifiedReq);
    }

    return next.handle(req);
  }
}
