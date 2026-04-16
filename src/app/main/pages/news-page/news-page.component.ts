import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';
import {NewsService} from '../../../shared/services/news.service';
import {News, NewsCategory, NewsQuery} from '../../../shared/models/news.model';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {SharedModule} from '../../../shared/shared.module';
import {environment} from "../../../../environments/environment";
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    // DatePipe - удаляем, так как не используем
    NzPaginationComponent,
    SharedModule,
    RouterLink
  ],
  templateUrl: './news-page.component.html',
  styleUrl: './news-page.component.css'
})
export class NewsPageComponent implements OnInit, OnDestroy {
  constructor(
    private newsService: NewsService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadFilters();
    this.preLoad();

    this.subscriptions.add(
      this.translate.onLangChange.subscribe(() => {
        this.loadFilters();
        if (this.query.categoryId != null) {
          this.loadData();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  categories: NewsCategory[] = [];
  years: number[] = [];
  query: NewsQuery = {year: new Date().getFullYear(), page: 0, limit: 10} as NewsQuery;

  news: News[] = [];
  total: number = 0;
  private subscriptions = new Subscription();

  loadData() {
    this.newsService.getList(this.query).subscribe(response => {
      this.news = response.response;
      this.total = response.pageable.total;
    });
  }

  private loadFilters() {
    this.newsService.getYears().subscribe(response => {
      this.years = response;
    });
    this.newsService.getCategories({isActive: true}).subscribe(response => {
      this.categories = response;
    });
  }

  private preLoad() {
    this.subscriptions.add(this.route.queryParamMap.subscribe(params => {
      const year = params.get('year');
      const categoryId = params.get('category');

      if (year) {
        this.query.year = Number(year);
      }

      if (categoryId) {
        this.query.categoryId = Number(categoryId);
        this.loadData();
      }
    }));
  }

  formatDate(dateStr: Date | string): string {
    if (!dateStr) return '';

    // 👇 Сначала преобразуем Date в строку, если нужно
    let dateString: string;
    if (dateStr instanceof Date) {
      // Если это объект Date, преобразуем в ISO строку
      dateString = dateStr.toISOString();
    } else {
      dateString = dateStr;
    }

    // Проверяем формат "DD.MM.YYYY"
    if (dateString.includes('.')) {
      const parts = dateString.split('.');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }

    // Если пришло в ISO формате или другой строковой дате
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return dateString;
  }

  protected readonly window = window;
  protected readonly environment = environment;
}
