import {Component, OnInit} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {NewsItem} from '../../../shared/models/news';
import {TranslatePipe} from "@ngx-translate/core";
import {NewsService} from '../../../shared/services/news.service';
import {News, NewsCategory, NewsQuery, PaginationResultModel} from '../../../shared/models/news.model';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {CalendarTypeEnum} from '../../../shared/models/calendar.model';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../../../shared/shared.module';
import {RouterLink} from '@angular/router';
import {environment} from '../../../../environments/environment';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    NgForOf,
    TranslatePipe,
    NzOptionComponent,
    NzSelectComponent,
    FormsModule,
    SharedModule,
    RouterLink,
    NzCarouselModule,
    NzSpinModule,
    NzIconModule,
    NzButtonModule,
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})

export class NewsComponent implements OnInit {
  news: News[] = [];
  categories: NewsCategory[] = [];
  loading = true;
  query = {limit: 4, page: 0, year: new Date().getFullYear(), categoryId: 22} as NewsQuery;
  
  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadData();
  }

  loadCategories(): void {
    this.newsService.getCategories({isActive: true}).subscribe(response => {
      this.categories = response;
    });
  }

  currentSlideIndex = 0;

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.news.length) % this.news.length;
  }
  
  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.news.length;
  }
  
  loadData(): void {
    this.loading = true;
    this.newsService.getList(this.query).subscribe({
      next: (response: PaginationResultModel<News>) => {
        this.news = response.response;
        this.currentSlideIndex = 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  months = [
    'Month.January', 'Month.February', 'Month.March', 'Month.April',
    'Month.May', 'Month.June', 'Month.July', 'Month.August',
    'Month.September', 'Month.October', 'Month.November', 'Month.December'
  ];
  selectedMonthIndex = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();

  get selectedMonthName(): string {
    return this.months[this.selectedMonthIndex];
  }

  prevMonth(): void {
    this.selectedMonthIndex--;
    if (this.selectedMonthIndex < 0) {
      this.selectedMonthIndex = 11;
      this.selectedYear--;
    }
    this.getNews();
  }

  nextMonth(): void {
    this.selectedMonthIndex++;
    if (this.selectedMonthIndex > 11) {
      this.selectedMonthIndex = 0;
      this.selectedYear++;
    }
    this.getNews();
  }

  private getNews() {

  }

  protected readonly window = window;
  protected readonly CalendarTypeEnum = CalendarTypeEnum;

  protected readonly environment = environment;
}
