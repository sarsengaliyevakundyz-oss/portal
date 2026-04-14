import {Component, HostListener} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {LangSwitcherComponent} from '../components/lang-swithcer/lang-switcher.component';
import {FooterComponent} from './footer/footer.component';
import {CurrentUserService} from '../../shared/services/current-user.service';
import {TranslatePipe} from '@ngx-translate/core';

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
export class LayoutComponent {
  showProfileMenu = false;
  constructor(
    private router: Router,
    public currentUser: CurrentUserService
  ) {}

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

}
