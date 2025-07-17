import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { TranslatePipe } from "@ngx-translate/core";
import { NewsService } from '../../../shared/services/news.service';
import { News, NewsCategory, NewsQuery } from '../../../shared/models/news.model';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    NgForOf,
    TranslatePipe,
    RouterLink
  ],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit, AfterViewInit {
  @ViewChild('categoriesContainer') categoriesContainer!: ElementRef<HTMLDivElement>;
  
  news: News[] = [];
  categories: NewsCategory[] = [];
  query = { limit: 4, page: 0, categoryId: 22 } as NewsQuery;
  
  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadData();
  }

  ngAfterViewInit() {
    this.checkScrollButtons();
  }

  loadCategories(): void {
    this.newsService.getCategories({ isActive: true }).subscribe(response => {
      this.categories = response;
    
      if (this.categories.length > 0 && !this.query.categoryId) {
        this.query.categoryId = this.categories[0].id;
      }
    });
  }

  loadData(): void {
    this.newsService.getList(this.query).subscribe(response => {
      this.news = response.response;
    });
  }

  scrollCategories(direction: number): void {
    const container = this.categoriesContainer.nativeElement;
    const scrollAmount = 200; // Шаг прокрутки
    
    container.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
    
    setTimeout(() => this.checkScrollButtons(), 300);
  }

  checkScrollButtons(): void {
    // Можно добавить дополнительную логику при необходимости
  }

  isScrollStart(): boolean {
    const container = this.categoriesContainer?.nativeElement;
    return container ? container.scrollLeft <= 10 : true;
  }

  isScrollEnd(): boolean {
    const container = this.categoriesContainer?.nativeElement;
    if (!container) return true;
    return container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
  }

  selectCategory(categoryId: number): void {
    this.query.categoryId = categoryId;
    this.loadData();
  }

  protected readonly environment = environment;
}