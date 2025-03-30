import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf} from '@angular/common';
import {NewsService} from '../../../shared/services/news.service';
import {News, NewsCategory, NewsCategoryQuery, NewsQuery} from '../../../shared/models/news.model';
import {ActivatedRoute} from '@angular/router';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {SharedModule} from '../../../shared/shared.module';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    DatePipe,
    NzPaginationComponent,
    SharedModule
  ],
  templateUrl: './news-page.component.html',
  styleUrl: './news-page.component.css'
})
export class NewsPageComponent implements OnInit {
  constructor(private newsService: NewsService, private route: ActivatedRoute) { }
  ngOnInit(): void {
    this.loadFilters();
    this.preLoad();
    // this.loadData();
  }
  categories: NewsCategory[] = [];
  years :number[] = [];
  query: NewsQuery = {year: new Date().getFullYear(), page: 0, limit: 10} as NewsQuery;


  news: News[] = [];
  total: number = 0;


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

  openNews(id: number) {
    window.open(`news/${id}`, '_blank');
  }

  private preLoad() {
    this.route.queryParamMap.subscribe(params => { // Используем queryParamMap
      const year = params.get('year');
      const categoryId = params.get('category');

      if (year) {
        this.query.year = Number(year); // Преобразуем в число
      }

      if (categoryId) {
        this.query.categoryId = Number(categoryId); // Преобразуем в число
        this.loadData(); // Вызываем loadData(), если есть categoryId
      }
    });
  }
}
