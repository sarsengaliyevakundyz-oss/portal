import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';

interface LocaleItem {
  key: string;
  ru: string;
  kz: string;
}

@Component({
  selector: 'app-admin-localizator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-localizator.component.html',
  styleUrl: './admin-localizator.component.css'
})
export class AdminLocalizatorComponent implements OnInit {
  items: LocaleItem[] = [];
  search = '';
  activeTab: 'all' | 'translated' | 'empty' = 'all';
  loading = true;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const paths = [
      { ru: '/i18n/ru.json',         kz: '/i18n/kz.json'         },
      { ru: 'i18n/ru.json',          kz: 'i18n/kz.json'          },
      { ru: '/assets/i18n/ru.json',  kz: '/assets/i18n/kz.json'  },
      { ru: 'assets/i18n/ru.json',   kz: 'assets/i18n/kz.json'   },
    ];
    this.tryLoad(paths, 0);
  }

  private tryLoad(paths: {ru: string, kz: string}[], index: number): void {
    if (index >= paths.length) {
      this.error = 'Не удалось загрузить файлы. Загрузи вручную.';
      this.loading = false;
      return;
    }
    forkJoin({
      ru: this.http.get<any>(paths[index].ru).pipe(catchError(() => of(null))),
      kz: this.http.get<any>(paths[index].kz).pipe(catchError(() => of(null))),
    }).subscribe(({ ru, kz }) => {
      if (!ru && !kz) { this.tryLoad(paths, index + 1); return; }
      const ruFlat = ru ? this.flatten(ru) : {};
      const kzFlat = kz ? this.flatten(kz) : {};
      const allKeys = new Set([...Object.keys(ruFlat), ...Object.keys(kzFlat)]);
      this.items = Array.from(allKeys).sort().map(key => ({
        key,
        ru: ruFlat[key] || '',
        kz: kzFlat[key] || '',
      }));
      this.loading = false;
    });
  }

  loadFromFile(event: Event, lang: 'ru' | 'kz'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flat = this.flatten(JSON.parse(e.target?.result as string));
        if (this.items.length === 0) {
          this.items = Object.keys(flat).sort().map(key => ({ key, ru: '', kz: '' }));
        }
        this.items.forEach(item => {
          if (flat[item.key]) lang === 'ru' ? item.ru = flat[item.key] : item.kz = flat[item.key];
        });
        Object.keys(flat).forEach(key => {
          if (!this.items.find(i => i.key === key)) {
            this.items.push({ key, ru: lang === 'ru' ? flat[key] : '', kz: lang === 'kz' ? flat[key] : '' });
          }
        });
        this.items.sort((a, b) => a.key.localeCompare(b.key));
        this.loading = false;
        this.error = '';
      } catch { alert('Ошибка парсинга JSON'); }
    };
    reader.readAsText(file);
  }

  get filtered(): LocaleItem[] {
    return this.items.filter(item => {
      const matchSearch = !this.search ||
        item.key.toLowerCase().includes(this.search.toLowerCase()) ||
        item.ru.toLowerCase().includes(this.search.toLowerCase()) ||
        item.kz.toLowerCase().includes(this.search.toLowerCase());
      const matchTab =
        this.activeTab === 'all'        ? true :
          this.activeTab === 'translated' ? (!!item.kz && item.kz !== item.ru) :
            (!item.kz || item.kz === item.ru);
      return matchSearch && matchTab;
    });
  }

  get totalCount(): number      { return this.items.length; }
  get translatedCount(): number { return this.items.filter(i => !!i.kz && i.kz !== i.ru).length; }
  get emptyCount(): number      { return this.items.filter(i => !i.kz || i.kz === i.ru).length; }
  get percent(): number         { return this.totalCount ? Math.round(this.translatedCount / this.totalCount * 100) : 0; }

  exportJson(lang: 'ru' | 'kz'): void {
    const flat: Record<string, string> = {};
    this.items.forEach(i => { flat[i.key] = lang === 'ru' ? i.ru : i.kz; });
    const blob = new Blob([JSON.stringify(this.unflatten(flat), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${lang}.json`;
    a.click();
  }

  private flatten(obj: any, prefix = ''): Record<string, string> {
    return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(acc, this.flatten(obj[key], fullKey));
      } else {
        acc[fullKey] = Array.isArray(obj[key]) ? obj[key].join(', ') : String(obj[key] ?? '');
      }
      return acc;
    }, {});
  }

  private unflatten(flat: Record<string, string>): any {
    const result: any = {};
    for (const key of Object.keys(flat)) {
      const parts = key.split('.');
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = flat[key];
    }
    return result;
  }
}
