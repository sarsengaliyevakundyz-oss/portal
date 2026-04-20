import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  { key: 'systems',       labelKey: 'admin.sections.systems',      route: '/admin/dic/systems' },
  { key: 'localization',  labelKey: 'admin.sections.localization',  route: '/admin/dic/trans' },
  { key: 'news',          labelKey: 'admin.sections.news',          route: '/admin/dic/news' },
  { key: 'newsCategories',labelKey: 'admin.sections.categories',    route: '/admin/dic/categories' },
  { key: 'instructions',  labelKey: 'admin.sections.instructions',  route: '/admin/instructions' },
  { key: 'roles',         labelKey: 'admin.sections.roles',         route: '/admin/dic/roles' },
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

  constructor(
    public router: Router,
    private systemsService: SystemsService,
    private cdr: ChangeDetectorRef  // ✅ добавь
  ) {}

  ngOnInit(): void {
    this.systemsService.getАdminInfo().subscribe({
      next: (map: AdminAccessMap) => {
        const access = map.access;
        this.allowedSections = ADMIN_SECTIONS.filter(sec => access[sec.key]);
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ сообщаем Angular об изменении

        const systemsSection = this.allowedSections.find(sec => sec.key === 'systems');
        if (systemsSection) {
          this.router.navigate([systemsSection.route]);
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ и здесь тоже
      }
    });
  }
}
