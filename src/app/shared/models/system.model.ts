export interface SystemModel {
  id: number
  codeName: string
  name: string
  description: string
  kurator: string
  pathImg: string
}


export interface SystemChildModel {
  id: number
  codeName: string
  name: string
  img: string
  url: string
}


export interface SystemChildInfoModel {
  systemInfo: SystemModel
  children: SystemChildModel[]
}
