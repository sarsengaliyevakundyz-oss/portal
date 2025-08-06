import {ITranslateName, NameTranslatePipe} from '../pipes/name-translate.pipe';


export interface SystemModel {
  id: number
  codeName: string
  name: ITranslateName
  fullPathImg: string
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

export interface SystemListModel {
  id: number;
  codeName: string;
  nameKz: string;
  nameRu: string;
  descriptionKz: string;
  descriptionRu: string;
  fullImgPath: string;
  kurator: {
    kuratorNameRu: string;
    kuratorNameKz: string;
    kuratorDepartmentRu: string;
    kuratorDepartmentKz: string;
  }[];
  active: boolean;
}

export interface KuratorModel{
  name:ITranslateName
  department: ITranslateName
}
