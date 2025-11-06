import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {BaseApi} from './base-api';
import {News, NewsCategory, NewsCategoryQuery, NewsDetail, NewsQuery} from '../models/news.model';
import {PaginationResultModel} from '../models/pagination.model';
import { SystemsService } from './systems.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NewsService extends BaseApi {
  constructor(http: HttpClient, private systemsService: SystemsService) {
    super(http);
  }

  getList(query: NewsQuery): Observable<PaginationResultModel<News>> {
    return this.getData<PaginationResultModel<News>>(this.apiUrl + '/internalportal/news/getNews', query);
  }

  getCategories(query: NewsCategoryQuery): Observable<NewsCategory[]> {
    return this.getData<NewsCategory[]>(this.apiUrl + '/internalportal/news/categories', query);
  }

  getYears(): Observable<number[]> {
    return this.getData<number[]>(this.apiUrl + '/internalportal/news/years', null);
  }

  getById(id: string): Observable<NewsDetail> {
    return this.getData<NewsDetail>(this.apiUrl + '/internalportal/news/getNewsById?id='+id, null);
  }

  addNews(body: {
    categoryId: number;
    content: string;
    description: string;
    imageContent: string;
    imageDescription: string;
    lang: string;
    loginCreated?: string;
    publishDate: string;
    title: string;
  }): Observable<void> {
    return this.systemsService.getAdminInfo().pipe(
      switchMap(info => {
        const bodyWithLogin = { ...body, loginCreated: info.username };
        return this.postData<void>(this.apiUrl + '/internalportal/news/addNews', bodyWithLogin);
      })
    );
  }
}
