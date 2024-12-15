import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";


@Pipe({
    name: 'nameTranslate',
    pure: false
})
export class NameTranslatePipe implements PipeTransform {

  currentLang: string;

  constructor(private translateService: TranslateService) {
    this.currentLang = this.translateService.currentLang;
    this.translateService.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  transform(value?: ITranslateName): string {
    if (this.currentLang === Lang.RU) {
      return value?.ru ?? "";
    }
    if (this.currentLang === Lang.Kz){
      return value?.kz ?? "";
    }
    if (this.currentLang === Lang.EN){
      return value?.en ?? "";
    }
    return value?.kz ?? "";
  }

}

export interface ITranslateName {
  ru: string;
  kz: string;
  en: string;
}

export enum Lang {
  Kz = 'kz',
  RU = 'ru',
  EN = 'en'
}
