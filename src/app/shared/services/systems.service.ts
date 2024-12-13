import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApi} from './base-api';
import {SystemModel} from '../models/system.model';


@Injectable({
  providedIn: 'root'
})
export class SystemsService extends BaseApi {

  getList(): Observable<SystemModel[]> {
    return this.getData<SystemModel[]>(this.apiUrl + '/systems/parent', null);
  }

  getSystemInfo(id: number): Observable<SystemModel[]> {
    return this.getData<SystemModel[]>(this.apiUrl + '/systems/child', {parentId:id});
  }

}
