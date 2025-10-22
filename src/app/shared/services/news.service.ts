import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApi} from './base-api';
import {News, NewsCategory, NewsCategoryQuery, NewsDetail, NewsQuery} from '../models/news.model';
import {PaginationResultModel} from '../models/pagination.model';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class NewsService extends BaseApi {

  getList(query: NewsQuery): Observable<PaginationResultModel<News>> {
    return this.getData<PaginationResultModel<News>>(this.apiUrl + '/internalportal/news/getNews', query)
      .pipe(
        map(response => ({
          ...response,
          response: response.response.map(news => ({
            ...news,
            publishDate: new Date(news.publishDate) // Convert string to Date
          }))
        }))
      );
  }

  getCategories(query: NewsCategoryQuery): Observable<NewsCategory[]> {
    return this.getData<NewsCategory[]>(this.apiUrl + '/internalportal/news/categories', query);
  }

  getYears(): Observable<number[]> {
    return this.getData<number[]>(this.apiUrl + '/internalportal/news/years', null);
  }

  getById(id: string): Observable<NewsDetail> {
    return this.getData<NewsDetail>(this.apiUrl + '/internalportal/news/getNewsById?id='+id, null)
      .pipe(
        map(newsDetail => ({
          ...newsDetail,
          publishDate: new Date(newsDetail.publishDate)
        }))
      );
  }
}
