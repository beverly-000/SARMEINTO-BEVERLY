import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';

export interface AuthResponse {
  token?: string;
  user?: { id: number; phone: string; displayName: string; avatarUrl?: string };
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  login(phone: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.config.baseUrl()}/auth/login`, { phone, password });
  }

  register(phone: string, displayName: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.config.baseUrl()}/auth/register`, { phone, displayName, password });
  }

  saveSession(response: AuthResponse): void {
    if (response.token) localStorage.setItem('watsup_token', response.token);
    if (response.user) localStorage.setItem('watsup_user', JSON.stringify(response.user));
  }
}
