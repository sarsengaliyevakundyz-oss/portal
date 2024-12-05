import {Component, HostListener} from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [
    NgIf, CommonModule
  ],
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.css'
})
export class LangSwitcherComponent {
  currentLanguage: string = 'Рус';
  isLanguageListVisible = false;  // Состояние видимости списка языков
  toggleLanguageList(event: Event): void {
    event.stopPropagation(); // Останавливаем всплытие события
    this.isLanguageListVisible = !this.isLanguageListVisible;
  }

  changeLanguage(language: string): void {
    switch (language) {
      case 'ru':
        this.currentLanguage = 'Рус';
        break;
      case 'en':
        this.currentLanguage = 'Eng';
        break;
      case 'kz':
        this.currentLanguage = 'Қаз';
        break;
    }
    this.isLanguageListVisible = false; // Закрываем список после выбора языка
  }

  @HostListener('document:click', ['$event'])
  closeLanguageList(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lang-switch')) {
      this.isLanguageListVisible = false;
    }
  }
}
