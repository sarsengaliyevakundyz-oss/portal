import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <nav class="breadcrumb" *ngIf="breadcrumbs.length > 1">
      <ng-container *ngFor="let crumb of breadcrumbs; let last = last; let first = first">
        <a *ngIf="!last" [routerLink]="crumb.url" class="crumb-link">
          <span *ngIf="first"></span>
          {{ crumb.label }}
        </a>
        <span *ngIf="!last" class="crumb-separator">›</span>
        <span *ngIf="last" class="crumb-current">{{ crumb.label }}</span>
      </ng-container>
    </nav>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 0 16px 0;
      font-size: 13px;
    }

    .crumb-link {
      color: #0575DA;
      text-decoration: none;
      transition: color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .crumb-link:hover {
      color: #0099ff;
      text-decoration: underline;
    }

    .crumb-separator {
      color: #ccc;
      font-size: 16px;
    }

    .crumb-current {
      color: #999;
      font-weight: 500;
    }
  `]
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];

  private readonly LABELS: Record<string, string> = {
    '': 'Главная',
    'systems': 'Системы',
    'documentation': 'Документация',
    'news': 'Новости',
    'admin': 'Личный кабинет',
    'profile': 'Профиль',
    'dic': 'Администрирование',
    'systems-admin': 'Системы',
    'news-admin': 'Новости',
    'categories': 'Категории',
    'trans': 'Локализация',
    'roles': 'Роли',
  };

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.buildBreadcrumbs());
  }

  private buildBreadcrumbs(): void {
    const url = this.router.url.split('?')[0];
    const segments = url.split('/').filter(s => s);

    const crumbs: Breadcrumb[] = [{ label: 'Главная', url: '/' }];

    let currentUrl = '';
    for (const segment of segments) {
      currentUrl += `/${segment}`;
      const isId = /^\d+$/.test(segment);
      const label = isId ? `#${segment}` : (this.LABELS[segment] || segment);
      crumbs.push({ label, url: currentUrl });
    }

    this.breadcrumbs = crumbs;
  }
}
