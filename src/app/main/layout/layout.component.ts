import {Component, HostListener} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {LangSwitcherComponent} from '../components/lang-swithcer/lang-switcher.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LangSwitcherComponent
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

  systems = [
    { name: '', link: '/', logo: 'systems/halyk_sanagy.svg' },
    { name: '', link: 'https://taldau.stat.gov.kz/', logo: 'systems/taldau.svg' },
    { name: '', link: '/', logo: 'systems/mics.svg' },
    { name: 'Кабинет респондента', link: '/', logo: 'systems/kabinet.svg' },
  ];


  // Метод для выбора язык
}
