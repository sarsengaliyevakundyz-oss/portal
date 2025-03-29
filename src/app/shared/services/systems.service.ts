import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApi} from './base-api';
import {SystemChildInfoModel, SystemModel} from '../models/system.model';
import {ResultModel} from '../models/result.model';
import {Role, UserInfo} from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class SystemsService extends BaseApi {

  getList(): Observable<ResultModel<SystemModel[]>> {
    return this.getData<ResultModel<SystemModel[]>>(this.apiUrl + '/internalportal/systems/parent', null);
  }

  getSystemInfo(id: string): Observable<ResultModel<SystemChildInfoModel>> {
    return this.getData<ResultModel<SystemChildInfoModel>>(this.apiUrl + '/internalportal/systems/child', {parentId:id});
  }

  getRoles(): Observable<Role[]> {
    return this.getData<Role[]>(this.apiUrl + '/internalportal/systems/roles', null);
  }

  getUserInfo(): Observable<UserInfo> {
    return this.getData<UserInfo>(this.apiUrl + '/internalportal/systems/getRoleByUser', null);
  }
}
