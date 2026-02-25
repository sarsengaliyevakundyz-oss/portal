export interface CalendarModel {
  type: number
  periodKindlistId: number
  periodKindlistName: string
  dateEnd: Date
  formId: number
  formName: string
  sectorId: number
  sectorName: string
}


export interface CalendarQuery{
  year: number;
  month: number;
  type: CalendarTypeEnum;
}


export enum CalendarTypeEnum{
  Respondent = 1,
  Region = 2

}
