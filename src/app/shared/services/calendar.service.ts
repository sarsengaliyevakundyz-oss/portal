import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseApi } from './base-api';
import { ResultModel } from '../models/result.model';
import { CalendarModel, CalendarQuery } from '../models/calendar.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService extends BaseApi {

  getList(query: CalendarQuery): Observable<ResultModel<CalendarModel[]>> {
    return this.getData<ResultModel<CalendarModel[]>>(
      this.apiUrl + '/internalportal/calendar',
      query
    ).pipe(
      tap(result => {
        const asString = typeof result === 'string'
          ? result
          : JSON.stringify(result);
        if (
          asString.includes(
            'Сессия пользователя истекла или недействительна.Требуется повторная авторизация через SSO'
          )
        ) {
          window.open(
            `${window.location.origin}/ssointernalfrontnew?client-id=2`,
            '_blank'
          );
        }
      })
    );
  }
}
