import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApi} from './base-api';
import {SystemChildInfoModel, SystemModel} from '../models/system.model';
import {ResultModel} from '../models/result.model';
import {CalendarModel, CalendarQuery} from '../models/calendar.model';


@Injectable({
  providedIn: 'root'
})
export class CalendarService extends BaseApi {

  getList(query: CalendarQuery): Observable<ResultModel<CalendarModel[]>> {
    return this.getData<ResultModel<CalendarModel[]>>(this.apiUrl + '/internalportal/calendar', query);
  }

}
