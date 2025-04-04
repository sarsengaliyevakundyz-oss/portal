import {Component, OnInit} from '@angular/core';
import {DatePipe, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NewsService} from '../../../../shared/services/news.service';
import {News, NewsCategory, NewsDetail, NewsQuery} from '../../../../shared/models/news.model';
import {ActivatedRoute, Router} from '@angular/router';
import {SharedModule} from '../../../../shared/shared.module';
import {environment} from "../../../../../environments/environment";

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    NgForOf,
    SharedModule
  ],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.css'
})
export class NewsDetailComponent implements OnInit {
  constructor(private newsService: NewsService, private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit(): void {
    this.loadFilters();
    this.loadData();
  }

  categories: NewsCategory[] = [];
  years: number[] = [];
  query: NewsQuery = {year: new Date().getFullYear(), page: 0, limit: 10} as NewsQuery;


  news: NewsDetail = {} as NewsDetail;

  loadData() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '';
      if (id) {
        this.newsService.getById(id).subscribe(response => {
          this.news = response;
          this.query.year = new Date(this.news.publishDate).getFullYear();
          this.query.categoryId = this.news.categoryId;
        })
      }
    });

  }

  private loadFilters() {
    this.newsService.getYears().subscribe(response => {
      this.years = response;
    })
    this.newsService.getCategories({isActive: true}).subscribe(response => {
      this.categories = response;
    })
  }

  goToNewsList() {
    this.router.navigate(['/news'], { queryParams: { category: this.query.categoryId, year: new Date(this.news.publishDate).getFullYear() } });
  }

    protected readonly environment = environment;
}
