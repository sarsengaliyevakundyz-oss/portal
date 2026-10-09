import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface StatusResponse {
  status: string;
  documentsLoaded: number;
  segmentsIndexed: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly BASE = 'http://localhost:8090/api';

  constructor(private http: HttpClient) {}

  ask(question: string, mode: string = 'user'): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>(`${this.BASE}/chat`, { question, mode });
  }

  getStatus(): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(`${this.BASE}/status`);
  }
}
