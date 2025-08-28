import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SystemsService } from '../../../shared/services/systems.service';
import { AdminAccessMap } from '../../../shared/models/admin-access.model';

interface AdminSection {
  key: keyof AdminAccessMap['access'];
  labelKey: string;
  route: string;
  iconName?: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  { key: 'systems',       labelKey: 'admin.sections.systems',       route: '/admin/dic/systems',       iconName: 'layers' },
  { key: 'localization',  labelKey: 'admin.sections.localization',  route: '/admin/dic/trans',    iconName: 'translate' },
  { key: 'news',          labelKey: 'admin.sections.news',          route: '/admin/dic/news',          iconName: 'announcement' },
  { key: 'newsCategories',labelKey: 'admin.sections.categories',    route: '/admin/news-categories',iconName: 'category' },
  { key: 'instructions',  labelKey: 'admin.sections.instructions',  route: '/admin/instructions',  iconName: 'menu_book' },
  { key: 'roles',         labelKey: 'admin.sections.roles',         route: '/admin/dic/roles',  iconName: 'menu_book' },
];

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NgIf,
    NgForOf,
    TranslateModule
  ],
  templateUrl: './dictionaries.component.html',
  styleUrls: ['./dictionaries.component.css']
})
export class DictionariesComponent implements OnInit {
  allowedSections: AdminSection[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private systemsService: SystemsService
  ) {}

  ngOnInit(): void {
    this.systemsService.getАdminInfo().subscribe({
      next: (map: AdminAccessMap) => {
        const access = map.access;
        this.allowedSections = ADMIN_SECTIONS.filter(sec => access[sec.key]);
        this.isLoading = false;
        
        const systemsSection = this.allowedSections.find(sec => sec.key === 'systems');
        if (systemsSection) {
          this.router.navigate([systemsSection.route]);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  navigateToPage(event: Event): void {
    const route = (event.target as HTMLSelectElement).value;
    if (route) {
      this.router.navigate([route]);
    }
  }
}
