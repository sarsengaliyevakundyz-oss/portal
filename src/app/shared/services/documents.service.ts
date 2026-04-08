import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseApi } from './base-api';
import { CategoryModel } from '../models/category.model';
import { CurrentUserService } from './current-user.service';

export interface DocumentDto {
  id: number;
  categoryId: number;
  categoryCode: string;
  title: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: string;
  createdAt: string;
  createdBy: string;
  downloadUrl: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService extends BaseApi {

  constructor(
    http: HttpClient,
    private currentUserService: CurrentUserService
  ) {
    super(http);
  }

  /**
   * Получить headers с токеном
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.currentUserService.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  /**
   * Получить категории с токеном
   */
  getCategories(lang: string): Observable<CategoryModel[]> {
    const headers = this.getAuthHeaders();
    return this.getData<CategoryModel[]>(
      this.apiUrl + `/internalportal/api/categories?lang=${lang}`,
      null,
      headers
    );
  }

  /**
   * Получить документы по категории с пагинацией
   */
  getDocumentsByCategory(
    categoryId: number,
    lang: string = 'ru',
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<DocumentDto>> {
    const headers = this.getAuthHeaders();
    const url = `/internalportal/api/documents/category/${categoryId}?lang=${lang}&page=${page}&size=${size}&sort=createdAt,desc`;
    return this.getData<PageResponse<DocumentDto>>(url, null, headers);
  }

  /**
   * Поиск документов по категории
   */
  searchDocumentsByCategory(
    categoryId: number,
    searchTerm: string,
    lang: string = 'ru',
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<DocumentDto>> {
    const headers = this.getAuthHeaders();
    const url = `/internalportal/api/documents/category/${categoryId}/search?q=${encodeURIComponent(searchTerm)}&lang=${lang}&page=${page}&size=${size}&sort=createdAt,desc`;
    return this.getData<PageResponse<DocumentDto>>(url, null, headers);
  }

  /**
   * Получить документ по ID
   */
  getDocumentById(
    id: number,
    lang: string = 'ru'
  ): Observable<DocumentDto> {
    const headers = this.getAuthHeaders();
    const url = `/internalportal/api/documents/${id}?lang=${lang}`;
    return this.getData<DocumentDto>(url, null, headers);
  }

  /**
   * Фильтр документов по статусу
   */
  getDocumentsByStatus(
    categoryId: number,
    status: string,
    lang: string = 'ru',
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<DocumentDto>> {
    const headers = this.getAuthHeaders();
    const url = `/internalportal/api/documents/category/${categoryId}/status/${status}?lang=${lang}&page=${page}&size=${size}&sort=createdAt,desc`;
    return this.getData<PageResponse<DocumentDto>>(url, null, headers);
  }
}
