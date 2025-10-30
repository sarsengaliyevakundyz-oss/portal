import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseApi} from './base-api';
import {NewsCategory, NewsCategoryQuery} from '../models/news.model';

interface AddCategoryRequest {
  imagePath?: string;
  loginCreated?: string;
  nameKk: string;
  nameRu: string;
}

interface UpdateCategoryRequest {
  categoryId: number;
  imagePath?: string;
  loginUpdated?: string;
  nameKk: string;
  nameRu: string;
}

interface ToggleCategoryRequest {
  categoryId: number;
  isActive: boolean;
  loginDeleted?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService extends BaseApi {

  getCategories(query: NewsCategoryQuery): Observable<NewsCategory[]> {
    return this.getData<NewsCategory[]>(this.apiUrl + '/internalportal/news/categories', query);
  }

  addCategory(body: AddCategoryRequest): Observable<void> {
    return this.postData<void>(this.apiUrl + '/internalportal/news/addCategory', body);
  }

  updateCategory(body: UpdateCategoryRequest): Observable<void> {
    return this.postData<void>(this.apiUrl + '/internalportal/news/updateCategory', body);
  }

  toggleActive(body: ToggleCategoryRequest): Observable<void> {
    return this.removeData<void>(this.apiUrl + '/internalportal/news/deleteCategory', body);
  }
}


