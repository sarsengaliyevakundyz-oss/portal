import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Lang } from '../../../shared/pipes/name-translate.pipe';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [
    NgIf, CommonModule, TranslatePipe
  ],
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.css'
})
export class LangSwitcherComponent implements OnInit {
  currentLanguage: string = 'Рус';
  isLanguageListVisible = false;  // Состояние видимости списка языков

  langs = Lang;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    const savedLang = localStorage.getItem('vip_lang');
    if (!savedLang) {
      localStorage.setItem('vip_lang', Lang.Kz);
    }

    const langToUse = savedLang || Lang.Kz;
    this.translate.setDefaultLang(langToUse);
    this.translate.use(langToUse);
    this.currentLanguage = langToUse;
  }

  toggleLanguageList(event: Event): void {
    event.stopPropagation(); // Останавливаем всплытие события
    this.isLanguageListVisible = !this.isLanguageListVisible;
  }

  changeLanguage(language: string): void {
    localStorage.setItem("vip_lang", language);
    this.translate.use(language);
    this.currentLanguage = language;
    this.isLanguageListVisible = false; // Закрываем список после выбора языка
    // location.reload()
  }

  @HostListener('document:click', ['$event'])
  closeLanguageList(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-switch')) {
      this.isLanguageListVisible = false;
    }
  }
}
