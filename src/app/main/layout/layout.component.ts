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
  // ✅ Добавили поле для состояния аутентификации
  isAuthenticatedState = false;

  private navigationSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null; // ✅ новое
  private contentElement: HTMLElement | null = null;
  private activeLink: string = '';

  constructor(
    private router: Router,
    public currentUser: CurrentUserService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit() {
    this.contentElement = this.el.nativeElement.querySelector('.content');

    // ✅ Подписываемся на статус аутентификации один раз
    this.authSubscription = this.currentUser.isAuthenticated$.subscribe(val => {
      this.isAuthenticatedState = val;
    });

    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError)
    ).subscribe((event: RouterEvent) => {
      this.handleNavigation(event);
    });

    this.activeLink = this.router.url;
  }

  private handleNavigation(event: RouterEvent): void {
    if (event instanceof NavigationEnd) {
      this.activeLink = this.router.url;
      this.smoothScrollToTop();
    }
  }
  private smoothScrollToTop(): void {
    setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }

  ngOnDestroy() {
    this.navigationSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe(); // ✅
  }

  // ✅ Теперь не читает localStorage на каждый цикл
  isAuthenticated(): boolean {
    return this.isAuthenticatedState;
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
      this.showProfileMenu = false;
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

  navigateTo(path: string, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
    }
    if (this.router.url === path) {
      this.smoothScrollToTop();
      return;
    }
    const target = event?.target as HTMLElement;
    if (target) {
      this.renderer.addClass(target, 'click-effect');
      setTimeout(() => {
        this.renderer.removeClass(target, 'click-effect');
      }, 200);
    }
    this.router.navigate([path]);
  }
}
