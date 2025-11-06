import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {BaseApi} from './base-api';
import {NewsCategory, NewsCategoryQuery} from '../models/news.model';
import { SystemsService } from './systems.service';
import { HttpClient } from '@angular/common/http';

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
  loginCreated?: string;
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
  constructor(http: HttpClient, private systemsService: SystemsService) {
    super(http);
  }

  getCategories(query: NewsCategoryQuery): Observable<NewsCategory[]> {
    return this.getData<NewsCategory[]>(this.apiUrl + '/internalportal/news/categories', query);
  }

  addCategory(body: AddCategoryRequest): Observable<void> {
    return this.systemsService.getAdminInfo().pipe(
      switchMap(info => {
        const bodyWithLogin = { ...body, loginCreated: info.username };
        return this.postData<void>(this.apiUrl + '/internalportal/news/addCategory', bodyWithLogin);
      })
    );
  }

  updateCategory(body: UpdateCategoryRequest): Observable<void> {
    return this.systemsService.getAdminInfo().pipe(
      switchMap(info => {
        const bodyWithLogin = { ...body, loginCreated: info.username };
        return this.postData<void>(this.apiUrl + '/internalportal/news/updateCategory', bodyWithLogin);
      })
    );
  }

  toggleActive(body: ToggleCategoryRequest): Observable<void> {
    return this.removeData<void>(this.apiUrl + '/internalportal/news/deleteCategory', body);
  }
}


