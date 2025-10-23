import {Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {NewsItem} from '../../../shared/models/news';
import {TranslatePipe} from "@ngx-translate/core";
import {NewsService} from '../../../shared/services/news.service';
import {News, NewsCategory, NewsQuery} from '../../../shared/models/news.model';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {CalendarTypeEnum} from '../../../shared/models/calendar.model';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../../../shared/shared.module';
import {RouterLink} from '@angular/router';
import {environment} from '../../../../environments/environment';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { Subscription, take } from 'rxjs';

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
    RouterLink
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent implements OnInit {
  @ViewChild('categoriesScroll') categoriesScroll!: ElementRef;
  news: News[] = [];
  categories: NewsCategory[] = [];
  query = {limit: 4, page: 0, year: new Date().getFullYear(), categoryId: 22} as NewsQuery;
  currentCategoryIndex = 0;
  private authSubscription: Subscription | undefined;

  constructor(
    private newsService: NewsService,
    public currentUser: CurrentUserService
  ) {}
 
  isAuthenticated(): boolean {
    return this.currentUser.isAuthenticated();
  }

  ngOnInit(): void {
    this.authSubscription = this.currentUser.isAuthChecked$.pipe(
      take(2)
    ).subscribe(isReady => {
      console.log('isReady in news:', isReady);
      if (isReady) {
        console.log('isAuthenticated in news:', this.currentUser.isAuthenticated())
        if (this.currentUser.isAuthenticated()) {
          this.loadCategories();
          }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
        this.authSubscription.unsubscribe();
    }
  }

  private loadCategories(): void {
    this.newsService.getCategories({ isActive: true }).subscribe(response => {
      this.categories = response;
      if (this.categories.length) {
        this.currentCategoryIndex = 0;
        this.query.categoryId = this.categories[0].id;
        this.loadData();
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
 
  selectCategory(categoryId: number): void {
    this.query.categoryId = categoryId;
    this.loadData();
  }
 
  scrollCategories(direction: number): void {
    const newIndex = this.currentCategoryIndex + direction;
  
    if (newIndex >= 0 && newIndex < this.categories.length) {
      this.currentCategoryIndex = newIndex;
      const category = this.categories[this.currentCategoryIndex];
      this.query.categoryId = category.id;
      this.loadData();
    }
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
 
  private parseDate(dateString: string | Date): Date {
    if (dateString instanceof Date) {
      return dateString;
    }
    if (typeof dateString === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  protected readonly window = window;
  protected readonly CalendarTypeEnum = CalendarTypeEnum;
 
  loadData() {
    this.newsService.getList(this.query).subscribe(response => {
      this.news = response.response.map(item => ({
        ...item,
        publishDate: this.parseDate(item.publishDate)
      }));
    })
  }
 
  protected readonly environment = environment;
}