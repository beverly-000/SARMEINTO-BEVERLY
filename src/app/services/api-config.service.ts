import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  private readonly http = inject(HttpClient);
  private readonly key = 'watsup_api_url';
  get savedUrl(): string { return localStorage.getItem(this.key) || ''; }
  setUrl(value: string): void { localStorage.setItem(this.key, value.replace(/\/$/, '')); }
  normalize(value: string): string {
    let url = value.trim();
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
    try { const parsed = new URL(url); if (!parsed.port) parsed.port = '3000'; return parsed.toString().replace(/\/$/, ''); } catch { return url; }
  }
  clear(): void { localStorage.removeItem(this.key); }
  baseUrl(): string { return `${this.savedUrl}/api`; }
  health(): Observable<unknown> { return this.http.get(`${this.baseUrl()}/health`); }
}
