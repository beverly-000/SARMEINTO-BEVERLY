import { ChangeDetectorRef, Component } from '@angular/core';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/angular';
import { lockClosedOutline, phonePortraitOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ApiConfigService } from '../services/api-config.service';
import { Router } from '@angular/router';
import { catchError, timeout, throwError } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonContent, IonInput, IonButton, IonIcon, IonText, FormsModule],
})
export class HomePage {
  readonly lockIcon = lockClosedOutline;
  readonly phoneIcon = phonePortraitOutline;

  isRegistering = false;
  phone = '';
  displayName = '';
  password = '';
  statusMessage = '';
  isLoading = false;
  apiUrl = '';
  apiReady = false;
  apiChecking = false;

  constructor(private readonly auth: AuthService, private readonly apiConfig: ApiConfigService, private readonly router: Router, private readonly changeDetector: ChangeDetectorRef) {
    addIcons({ lockClosedOutline, phonePortraitOutline });
  }

  ngOnInit(): void { this.apiUrl = this.apiConfig.savedUrl; if (this.apiUrl) this.checkApi(); }
  checkApi(): void {
    const value = this.apiConfig.normalize(this.apiUrl);
    if (!value) { this.statusMessage = 'Enter the API URL first.'; return; }
    this.apiUrl = value; this.apiChecking = true; this.apiReady = false; this.apiConfig.setUrl(value);
    this.apiConfig.health().subscribe({
      next: () => { this.apiReady = true; this.apiChecking = false; this.statusMessage = ''; this.changeDetector.detectChanges(); },
      error: (err) => {
        this.apiConfig.clear();
        this.apiChecking = false;
        const detail = err?.status ? `HTTP ${err.status}` : (err?.message || 'Network request failed');
        this.statusMessage = `Server not found (${detail}). Check the IPv4 address and port 3000.`;
        this.changeDetector.detectChanges();
      }
    });
  }
  changeApi(): void { this.apiReady = false; this.apiUrl = this.apiConfig.savedUrl; this.apiConfig.clear(); }

  submit(): void {
    this.statusMessage = '';
    if (!this.phone || !this.password || (this.isRegistering && !this.displayName)) {
      this.statusMessage = 'Please complete all required fields.';
      return;
    }
    this.isLoading = true;
    const fallbackTimer = window.setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.statusMessage = this.isRegistering
          ? 'The request timed out. Check the database, then try Sign in if the account was saved.'
          : 'The server did not respond. Check that the WatsUp API is running.';
      }
    }, 12000);
    const request = this.isRegistering
      ? this.auth.register(this.phone, this.displayName, this.password)
      : this.auth.login(this.phone, this.password);
    request.pipe(
      timeout(10000),
      catchError((error) => throwError(() => error)),
    ).subscribe({
      next: (response) => {
        window.clearTimeout(fallbackTimer);
        this.isLoading = false;
        this.auth.saveSession(response);
        this.statusMessage = this.isRegistering ? 'Account created successfully.' : `Welcome back, ${response.user?.displayName ?? 'there'}!`;
        this.changeDetector.detectChanges();
        if (!this.isRegistering) this.router.navigateByUrl('/chats', { replaceUrl: true });
      },
      error: (error) => {
        window.clearTimeout(fallbackTimer);
        this.isLoading = false;
        if (error.name === 'TimeoutError' && this.isRegistering) {
          this.statusMessage = 'The account may have been saved. Please switch to Sign in and try your credentials.';
        } else if (error.name === 'TimeoutError') {
          this.statusMessage = 'The server did not respond. Check that the WatsUp API and MySQL are running.';
        } else {
          this.statusMessage = error.error?.message ?? 'Could not connect to WatsUp server.';
        }
        this.changeDetector.detectChanges();
      },
    });
  }

  toggleMode(): void {
    this.isRegistering = !this.isRegistering;
    this.statusMessage = '';
  }
}
