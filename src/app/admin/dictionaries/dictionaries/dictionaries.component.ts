import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SystemsService } from '../../../shared/services/systems.service';
import { AdminAccessMap } from '../../../shared/models/admin-access.model';
import { filter } from 'rxjs/operators';

interface AdminSection {
  key: keyof AdminAccessMap['access'];
  labelKey: string;
  route: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  { key: 'systems',        labelKey: 'admin.sections.systems',      route: '/admin/dic/systems'   },
  { key: 'news',           labelKey: 'admin.sections.news',          route: '/admin/dic/news'      },
  { key: 'newsCategories', labelKey: 'admin.sections.categories',    route: '/admin/dic/categories'},
  { key: 'localization',   labelKey: 'admin.sections.localization',  route: '/admin/dic/trans'     },
  { key: 'instructions',   labelKey: 'main.document',  route: '/admin/dic/instructions'  },
  { key: 'roles',          labelKey: 'admin.sections.roles',         route: '/admin/dic/roles'     },
];

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgIf, NgForOf, TranslateModule],
  templateUrl: './dictionaries.component.html',
  styleUrls: ['./dictionaries.component.css']
})
export class DictionariesComponent implements OnInit {
  allowedSections: AdminSection[] = [];
  isLoading = true;
  currentUrl = '';

  constructor(
    public router: Router,
    private systemsService: SystemsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Следим за изменением URL чтобы активный таб обновлялся
    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
        this.cdr.detectChanges();
      });

    this.systemsService.getАdminInfo().subscribe({
      next: (map: AdminAccessMap) => {
        const access = map.access;
        this.allowedSections = ADMIN_SECTIONS.filter(sec => access[sec.key]);
        this.isLoading = false;
        this.cdr.detectChanges();

        // Навигация только если мы на корневом пути /admin/dic
        const isOnRoot = this.router.url === '/admin/dic' || this.router.url === '/admin/dic/';
        if (isOnRoot) {
          const first = this.allowedSections[0];
          if (first) this.router.navigate([first.route]);
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isActive(section: AdminSection): boolean {
    return this.currentUrl.includes(section.route);
  }
}
