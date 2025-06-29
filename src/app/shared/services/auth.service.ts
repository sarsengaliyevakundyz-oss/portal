import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {AuthResult} from '../models/result.model';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {CurrentUserService} from './current-user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService{

  constructor(private http: HttpClient, private currentUser: CurrentUserService) {}

  refreshToken(refreshToken: string, secretCode: string ): Observable<AuthResult> {
    console.log('refreshToken:', refreshToken);
    console.log('secretCode:', secretCode);
    // Формируем данные формы
    // const body = new HttpParams()
    //   .set('grant_type', 'refresh_token')
    //   .set('client_id', environment.client)
    //   .set('refresh_token', refreshToken);
    const headers = new HttpHeaders({
      'Authorization':  secretCode,
      'RefreshToken':   refreshToken
    });

    return this.http.get<AuthResult>('/internalportal/getToken', { headers });
  }


}
