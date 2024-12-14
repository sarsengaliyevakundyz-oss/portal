import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {CurrentUserService} from "@shared/services/current-user.service";
import {NzMessageService} from "ng-zorro-antd/message";


@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private currentUserService: CurrentUserService, private message: NzMessageService
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!window.navigator.onLine) {
      // this.messaging.publish(new AlertMessage('meesage.unavailable_internet', true, true));
      return next.handle(request);
    } else {
      return next.handle(request).pipe(catchError(err => {
        console.log(err);
        if ([401].indexOf(err.status) !== -1) {
          // @ts-ignore
          this.currentUserService.logout();
          let message = 'message.session_is_finished';
          alert("Ошибка")
          // this.messaging.publish(new AlertMessage(message, true));
          // this.authService.logout();
        } else {
          let title = err.error.Message;
          this.message.error(title)
          // this.messaging.publish(new ScreenLoadingMessage('', false));
        }
        return throwError(err);

      }));
    }
  }

}
