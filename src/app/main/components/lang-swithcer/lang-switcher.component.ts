import {Component, HostListener} from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Lang} from '../../../shared/pipes/name-translate.pipe';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [
    NgIf, CommonModule, TranslatePipe
  ],
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.css'
})
export class LangSwitcherComponent{
  currentLanguage: string = 'Рус';
  isLanguageListVisible = false;  // Состояние видимости списка языков

  langs = Lang;
  constructor(private translate: TranslateService) {
    this.currentLanguage = this.translate.currentLang ?? localStorage.getItem("vip_lang") ?? Lang.Kz;
    this.translate.setDefaultLang(this.currentLanguage);
    this.translate.currentLang =this.currentLanguage;
  }

  toggleLanguageList(event: Event): void {
    event.stopPropagation(); // Останавливаем всплытие события
    this.isLanguageListVisible = !this.isLanguageListVisible;
  }

  changeLanguage(language: string): void {
    this.translate.setDefaultLang(language);
    this.currentLanguage = language;
    localStorage.setItem("vip_lang", language);
    this.isLanguageListVisible = false; // Закрываем список после выбора языка
    location.reload()
  }

  @HostListener('document:click', ['$event'])
  closeLanguageList(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-switch')) {
      this.isLanguageListVisible = false;
    }
  }
}
