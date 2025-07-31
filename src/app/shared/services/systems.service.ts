import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApi} from './base-api';
import {SystemChildInfoModel, SystemModel} from '../models/system.model';
import {ResultModel} from '../models/result.model';
import {Role, UserInfo} from '../models/user.model';
import { AdminAccessMap } from '../models/admin-access.model';


@Injectable({
  providedIn: 'root'
})
export class SystemsService extends BaseApi {

  getList(): Observable<ResultModel<SystemModel[]>> {
    return this.getData<ResultModel<SystemModel[]>>(this.apiUrl + '/internalportal/infoSystems/parent', null);
  }

  getSystemInfo(id: string): Observable<ResultModel<SystemChildInfoModel>> {
    return this.getData<ResultModel<SystemChildInfoModel>>(this.apiUrl + '/internalportal/systems/child', {parentId:id});
  }

  getRoles(): Observable<Role[]> {
    return this.getData<Role[]>(this.apiUrl + '/internalportal/systems/roles', null);
  }

  getUserInfo(): Observable<UserInfo> {
    return this.getData<UserInfo>(this.apiUrl + '/internalportal/infoSystems/userProfile', null);
  }

  getАdminInfo(): Observable<AdminAccessMap> {
    return this.getData<AdminAccessMap>(this.apiUrl + '/internalportal/infoSystems/adminAccessMap', null);
  }

  getAllSystems(): Observable<ResultModel<SystemChildInfoModel[]>> {
    return this.getData<ResultModel<SystemChildInfoModel[]>>(this.apiUrl + '/internalportal/systems/allSystems', null);
  }

  getSystemsList(): Observable<ResultModel<SystemChildInfoModel[]>> {
    return this.getData<ResultModel<SystemChildInfoModel[]>>(this.apiUrl + '/internalportal/admin/systems/list', null);
  }

  addSystem(form: SystemModel): Observable<any> {
    return this.postData<any>(this.apiUrl + '/internalportal/systems/addParent', form);
  }
}
