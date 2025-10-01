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
    const headers = new HttpHeaders({
      'RefreshToken': this.currentUser.getCurrentUser()?.refreshToken!,
      'Authorization':  "secretCode",
    });

    return this.http.get<AuthResult>('/internalportal/getToken', { headers });
  }
}
