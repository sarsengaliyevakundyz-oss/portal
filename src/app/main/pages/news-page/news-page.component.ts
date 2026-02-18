import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf} from '@angular/common';
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
    DatePipe,
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
    // this.loadData();

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
  years :number[] = [];
  query: NewsQuery = {year: new Date().getFullYear(), page: 0, limit: 10} as NewsQuery;


  news: News[] = [];
  total: number = 0;
  private subscriptions = new Subscription();


  loadData() {
    this.newsService.getList(this.query).subscribe(response => {
      this.news = response.response;
      this.total = response.pageable.total;
    })
  }

  private loadFilters() {
    this.newsService.getYears().subscribe(response => {
      this.years = response;
    })
    this.newsService.getCategories({isActive: true}).subscribe(response => {
      this.categories = response;
    })
  }


  private preLoad() {
    this.subscriptions.add(this.route.queryParamMap.subscribe(params => { // Используем queryParamMap
      const year = params.get('year');
      const categoryId = params.get('category');

      if (year) {
        this.query.year = Number(year); // Преобразуем в число
      }

      if (categoryId) {
        this.query.categoryId = Number(categoryId); // Преобразуем в число
        this.loadData(); // Вызываем loadData(), если есть categoryId
      }
    }));
  }

  protected readonly window = window;
    protected readonly environment = environment;
}
