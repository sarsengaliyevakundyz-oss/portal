import { Component, HostListener, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event as RouterEvent } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from '../components/lang-swithcer/lang-switcher.component';
import { FooterComponent } from './footer/footer.component';
import { CurrentUserService } from '../../shared/services/current-user.service';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LangSwitcherComponent,
    FooterComponent,
    TranslatePipe
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  showProfileMenu = false;
  isNavigating = false;
  private navigationSubscription: Subscription | null = null;
  private contentElement: HTMLElement | null = null;
  private activeLink: string = '';

  constructor(
    private router: Router,
    public currentUser: CurrentUserService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit() {
    // Находим элемент контента
    this.contentElement = this.el.nativeElement.querySelector('.content');

    // Отслеживаем все события навигации
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError)
    ).subscribe((event: RouterEvent) => {
      this.handleNavigation(event);
    });

    // Сохраняем активную ссылку
    this.activeLink = this.router.url;
  }

  private handleNavigation(event: RouterEvent): void {
    if (event instanceof NavigationStart) {
      this.isNavigating = true;

      // Добавляем класс для плавного перехода
      this.renderer.addClass(document.body, 'navigation-start');
      this.renderer.addClass(document.body, 'fade-out');

      // Добавляем класс на контент для плавного перехода
      if (this.contentElement) {
        this.renderer.addClass(this.contentElement, 'navigating');
      }

    } else if (event instanceof NavigationEnd) {
      this.activeLink = this.router.url;

      // Плавное появление контента
      setTimeout(() => {
        this.isNavigating = false;
        this.renderer.removeClass(document.body, 'navigation-start');
        this.renderer.removeClass(document.body, 'fade-out');

        if (this.contentElement) {
          this.renderer.removeClass(this.contentElement, 'navigating');
          // Добавляем класс для плавного появления
          this.renderer.addClass(this.contentElement, 'fade-in');
          setTimeout(() => {
            if (this.contentElement) {
              this.renderer.removeClass(this.contentElement, 'fade-in');
            }
          }, 300);
        }

        // Плавная прокрутка наверх
        this.smoothScrollToTop();
      }, 150);

    } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
      this.isNavigating = false;
      this.renderer.removeClass(document.body, 'navigation-start');
      this.renderer.removeClass(document.body, 'fade-out');
      if (this.contentElement) {
        this.renderer.removeClass(this.contentElement, 'navigating');
      }
    }
  }

  private smoothScrollToTop(): void {
    // Плавная прокрутка
    const scrollToTop = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 0) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    // Небольшая задержка для плавности
    setTimeout(scrollToTop, 50);
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser.isAuthenticated() &&
      !!localStorage.getItem(this.currentUser.getAuthResponseKey()) &&
      !!localStorage.getItem(this.currentUser.getSecretCodeKey());
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  async deactivateToken(): Promise<void> {
    try {
      await this.currentUser.deactivateToken();
    } catch (error) {
      console.error('Error deactivating token:', error);
    } finally {
      // Очищаем все данные
      localStorage.removeItem(this.currentUser.getAuthResponseKey());
      localStorage.removeItem(this.currentUser.getSecretCodeKey());
      localStorage.removeItem('iinKey');
      localStorage.removeItem('vip_lang');

      this.showProfileMenu = false;

      // Перезагружаем страницу, а не навигируем на /login
      // При перезагрузке checkInitialAuthenticationState() увидит что нет сессии и откроет SSO
      window.location.href = '/';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.profile-container')) {
      this.showProfileMenu = false;
    }
  }

  isExactMatch(path: string): boolean {
    return this.router.url === path;
  }

  // Плавный переход по меню
  navigateTo(path: string, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
    }

    const currentUrl = this.router.url;

    // Если уже на этой странице, плавно скроллим наверх
    if (currentUrl === path) {
      this.smoothScrollToTop();
      return;
    }

    // Добавляем эффект клика на кнопку
    const target = event?.target as HTMLElement;
    if (target) {
      this.renderer.addClass(target, 'click-effect');
      setTimeout(() => {
        this.renderer.removeClass(target, 'click-effect');
      }, 200);
    }

    // Выполняем навигацию
    this.router.navigate([path]);
  }
}
