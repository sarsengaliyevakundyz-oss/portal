import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface Breadcrumb {
  label: string;
  labelKey: string;  // ключ для translate pipe
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <nav class="breadcrumb" *ngIf="breadcrumbs.length > 1">
      <ng-container *ngFor="let crumb of breadcrumbs; let last = last">
        <a *ngIf="!last" [routerLink]="crumb.url" class="crumb-link">
          {{ crumb.labelKey | translate }}
        </a>
        <span *ngIf="!last" class="crumb-separator">›</span>
        <span *ngIf="last" class="crumb-current">{{ crumb.labelKey | translate }}</span>
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

  // ключи из твоего JSON
  private readonly LABELS: Record<string, string> = {
    '':             'title.home',
    'systems':      'main.system',
    'documentation':'main.document',
    'news':         'title.news',
    'admin':        'main.personal_cabinet',
    'profile':      'navigation.profile',
    'dic':          'administrations.admin',
    'systems-admin':'main.system',
    'news-admin':   'title.news',
    'categories':   'admin.sections.categories',
    'trans':        'admin.sections.localization',
    'roles':        'admin.sections.roles',
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

    const crumbs: Breadcrumb[] = [
      { label: 'title.home', labelKey: 'title.home', url: '/' }
    ];

    let currentUrl = '';
    for (const segment of segments) {
      currentUrl += `/${segment}`;
      const isId = /^\d+$/.test(segment);
      const labelKey = isId ? `#${segment}` : (this.LABELS[segment] || segment);
      crumbs.push({ label: labelKey, labelKey, url: currentUrl });
    }

    this.breadcrumbs = crumbs;
  }
}
