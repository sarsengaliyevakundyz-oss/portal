import {ITranslateName, NameTranslatePipe} from '../pipes/name-translate.pipe';


export interface SystemModel {
  id: number
  codeName: string
  name: ITranslateName
  description: ITranslateName
  kurator: KuratorModel[]
  pathImg: ITranslateName
}


export interface SystemChildModel {
  id: number
  codeName: string
  name: ITranslateName
  description: ITranslateName
  img: string
  url: ITranslateName
}


export interface SystemChildInfoModel {
  systemInfo: SystemModel
  children: SystemChildModel[]
}


export interface KuratorModel{
  name:ITranslateName
  department: ITranslateName
}
