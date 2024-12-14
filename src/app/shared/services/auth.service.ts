import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {AuthResult} from '../models/result.model';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService{

  constructor(private http: HttpClient) {}

  refreshToken(refreshToken: string): Observable<AuthResult> {
    // Формируем данные формы
    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', environment.client)
      .set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<AuthResult>(environment.tokenUrl, body.toString(), { headers });
  }


}
