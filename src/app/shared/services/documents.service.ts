import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from './base-api';
import { ResultModel } from '../models/result.model';
import { InstructionModel } from '../models/instruction.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService extends BaseApi {

  getInstructionsList(): Observable<ResultModel<InstructionModel[]>> {
    return this.getData<ResultModel<InstructionModel[]>>(this.apiUrl + '/internalportal/instructions/list', null);
  }
}
