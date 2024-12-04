import {Component, HostListener} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgIf,
    NgForOf,
    CommonModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

  selectedLanguage = 'Рус';  // Стартовый язык
  languages = ['Рус', 'Каз', 'Анг'];  // Доступные языки
  isLanguageListVisible = false;  // Состояние видимости списка языков
  constructor(private router: Router) {
  }
  isExactMatch(path: string): boolean {
    console.log(this.router.url)
    return this.router.url === path;
  }


  // Метод для выбора языка
  currentLanguage: string = 'Рус';

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
