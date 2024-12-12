import {Component, HostListener} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {LangSwitcherComponent} from '../components/lang-swithcer/lang-switcher.component';
import {FooterComponent} from './footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LangSwitcherComponent,
    FooterComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

  constructor(private router: Router) {
  }
  isExactMatch(path: string): boolean {
    return this.router.url === path;
  }

}
