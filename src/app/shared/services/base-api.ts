import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BaseApi {
  apiUrl = '';

  constructor(private http: HttpClient) {
  }

  protected getData<T>(uri: string, params: any, headers?: HttpHeaders): Observable<T> {
    params = this.normalBody(params);
    const pars = this.getUrlParams(params);
    const options = headers !== undefined
      ? { params: pars, headers }
      : { params: pars };

    const request$ = this.haveOtherBaseUrl(uri)
      ? this.http.get<T>(uri, { params: pars })
      : this.http.get<T>(uri, options);

    return request$.pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleAuthError(err);
      })
    );
  }

  protected postData<T>(uri: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(uri, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleAuthError(err);
      })
    );
  }

  protected putData<T>(uri: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(uri, body, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleAuthError(err);
      })
    );
  }

  protected removeData<T>(uri: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(uri, { params: body, headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleAuthError(err);
      })
    );
  }

  private handleAuthError(err: HttpErrorResponse): Observable<never> {
    const errorMessage = typeof err.error === 'string' ? err.error : err.error?.message;
    
    if (err.status === 401 || 
        errorMessage?.includes('Сессия пользователя истекла') ||
        errorMessage?.includes('Требуется повторная авторизация через SSO') ||
        errorMessage?.includes('status 401 reading')) {
      
      localStorage.removeItem('authResponse');
      localStorage.removeItem('secretCode');
      localStorage.removeItem('iinKey');
      localStorage.removeItem('vip_lang');

      this.redirectToSSO();
    }
    return throwError(() => err);
  }

  private redirectToSSO(): void {
  if (window.location.href.includes('ssointernalfrontnew')) {
    return;
  }
  
  // Открываем SSO в новом окне/вкладке
  window.open(
    `${window.location.origin}/ssointernalfrontnew?client-id=2`,
    '_blank'
  );
  
}

  protected GetFile(uri: string, params: any = null): void {
    const pars = this.getUrlParams(params);
    this.http.get(uri, {params: pars, responseType: 'blob', observe: 'response'})
      .subscribe((response: HttpResponse<Blob>) => {
        this.downloadFile(response);
      });
  }

  protected PostFile(uri: string, body: any): void {
    this.http.post(uri, body, {responseType: 'blob', observe: 'response'})
      .subscribe((response: HttpResponse<Blob>) => {
        this.downloadFile(response);
      });
  }

  protected downloadFile(response: HttpResponse<Blob>): void {
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const fileName = decodeURI(disposition.substring(disposition.indexOf('filename*=UTF-8\'\'') + 17));
      if (response.body) {
        const url = window.URL.createObjectURL(response.body);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.click();
      }
    }
  }

  protected getFileBlob(uri: string, params: any = null): Observable<HttpResponse<Blob>> {
    const pars = this.getUrlParams(params);
    return this.http.get(uri, {params: pars, responseType: 'blob', observe: 'response'});
  }

  // noinspection JSMethodCanBeStatic
  private getUrlParams(body: any): HttpParams {
    let params = new HttpParams();
    for (const key in body) {
      if (!body.hasOwnProperty(key)) {
        continue;
      }
      if (body[key] !== undefined && body[key] !== null) {
        if (!Array.isArray) {
          // @ts-ignore
          // tslint:disable-next-line:only-arrow-functions
          Array.isArray = function(arg): boolean {
            return Object.prototype.toString.call(arg) === '[object Array]';
          };
        }
        if (Array.isArray(body[key])) {
          for (let i = 0; i < body[key].length; i++) {
            params = params.append(key, body[key][i]);
          }
        } else {
          params = params.append(key, body[key]);
        }
      }
    }
    return params;
  }

  private normalBody(body: any): any {
    if (!body) {
      body = {};
    }
    for (const key in body) {
      if (!body.hasOwnProperty(key)) {
        continue;
      }
      if (body[key] instanceof Date) {
        body[key] = formatDate(body[key], 'yyyy-MM-ddTHH:mm:ss', 'ru');
      }
    }
    return body;
  }

  // noinspection JSMethodCanBeStatic
  private haveOtherBaseUrl(url: string): boolean {
    if (url === undefined || url.length < 4) {
      return false;
    }
    const str = url.slice(0, 1);
    return str !== '/';
  }

}
