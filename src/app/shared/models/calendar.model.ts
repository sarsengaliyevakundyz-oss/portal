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
  Region = 1,
  Respondent = 2

}
